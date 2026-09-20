-- ============================================================
-- Migration : renouvellements + historique des paiements
-- ============================================================
-- NE PAS APPLIQUER À LA PRODUCTION SANS CONFIRMATION EXPLICITE D'OUMAR.
-- Ce fichier est prêt mais n'a pas encore été exécuté sur le projet
-- Supabase Cloud actif (samasite.online) ni sur l'instance self-hosted.
--
-- Contenu, identique à ce qui a été ajouté à la fin de supabase/schema.sql :
--  1. confirmer_paiement_admin() (paiement initial) journalise désormais
--     aussi une ligne dans la table "paiements" existante (type 'initial'),
--     qui ne recevait encore aucune écriture jusqu'ici.
--  2. Une nouvelle fonction confirmer_renouvellement_admin(), réservée à
--     l'administrateur : confirme un renouvellement (durée, montant, moyen
--     de paiement choisis au moment de la confirmation — rien n'est
--     présoumis par le client pour un renouvellement, contrairement à la
--     commande initiale), prolonge abonnement_expire_le à la date fournie
--     par l'application, et journalise une ligne 'renouvellement' dans
--     "paiements".
--
-- Dépend de la migration précédente (20260919120000_modifications_facturables.sql)
-- uniquement pour l'ordre chronologique — cette migration-ci ne touche pas à
-- "modifications_facturables", elle peut être appliquée indépendamment tant
-- que la table "paiements" existe déjà (elle est créée dans schema.sql /
-- schema_sama_site_selfhosted.sql depuis le début du projet).
--
-- Testé fonctionnellement contre une instance Postgres 16 locale jetable
-- (rejet non-admin, mise à jour correcte des champs du site, prolongation
-- de l'abonnement, écriture de la ligne "paiements") avant d'être ajouté ici.
--
-- Pour appliquer cette migration :
--   - Sur Supabase Cloud (prod actuelle) : coller ce fichier dans
--     SQL Editor > New query, puis "Run" — uniquement quand Oumar confirme.
--   - Sur le VPS self-hosted : utiliser la variante schema-qualifiée dans
--     supabase/schema_sama_site_selfhosted.sql (même logique, préfixée
--     sama_site.*).

-- 1) Le paiement initial journalise désormais une ligne dans "paiements"
create or replace function confirmer_paiement_admin(
  p_site_id uuid,
  p_abonnement_expire_le timestamptz
)
returns setof sites
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  update sites set
    statut = 'actif',
    paiement_confirme = true,
    abonnement_expire_le = p_abonnement_expire_le,
    updated_at = now()
  where id = p_site_id;

  insert into paiements (site_id, type, extension, duree, montant, moyen_paiement, statut, confirme_le, confirme_par)
  select id, 'initial', extension, duree, montant, moyen_paiement, 'confirme', now(), 'manuel'
  from sites where id = p_site_id;

  return query select * from sites where id = p_site_id;
end;
$$;
grant execute on function confirmer_paiement_admin to authenticated;

-- 2) Confirmation d'un renouvellement
create or replace function confirmer_renouvellement_admin(
  p_site_id uuid,
  p_duree text,
  p_montant integer,
  p_moyen_paiement text,
  p_abonnement_expire_le timestamptz
)
returns setof sites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site sites%rowtype;
begin
  if not is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  select * into v_site from sites where id = p_site_id;
  if not found then
    raise exception 'Site introuvable.';
  end if;

  update sites set
    statut = 'actif',
    paiement_confirme = true,
    duree = p_duree,
    montant = p_montant,
    moyen_paiement = p_moyen_paiement,
    abonnement_expire_le = p_abonnement_expire_le,
    updated_at = now()
  where id = p_site_id;

  insert into paiements (site_id, type, extension, duree, montant, moyen_paiement, statut, confirme_le, confirme_par)
  values (p_site_id, 'renouvellement', v_site.extension, p_duree, p_montant, p_moyen_paiement, 'confirme', now(), 'manuel');

  return query select * from sites where id = p_site_id;
end;
$$;
grant execute on function confirmer_renouvellement_admin to authenticated;
