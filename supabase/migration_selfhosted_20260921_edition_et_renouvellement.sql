-- ============================================================
-- Migration self-hosted (schéma sama_site) — 21 septembre 2026
-- ============================================================
-- Porte vers l'instance self-hosted (VPS) deux migrations qui existaient
-- déjà, prêtes et testées, dans le dépôt (supabase/migrations/) mais qui
-- n'avaient JAMAIS été exécutées sur aucune base de données — ni Cloud, ni
-- self-hosted. C'est la cause racine confirmée de deux bugs signalés le
-- 21/09/2026 : "modifier un site créé" échoue silencieusement (la fonction
-- modifier_site_proprietaire() que le code appelle n'existe pas en base),
-- et le renouvellement d'un abonnement (confirmer_renouvellement_admin())
-- n'a jamais eu de fonction correspondante côté base.
--
-- Contenu (équivalent schema-qualifié de :
--   supabase/migrations/20260919120000_modifications_facturables.sql
--   supabase/migrations/20260919130000_confirmer_renouvellement_admin.sql
-- adaptés au schéma sama_site, comme le prévoyait déjà le commentaire
-- d'en-tête de ces deux fichiers) :
--  1. Table sama_site.modifications_facturables (journal des modifications
--     à 500 F sur un site déjà payé/actif).
--  2. sama_site.modifier_site_proprietaire() — remplace l'update direct
--     pour un compte propriétaire, facture automatiquement si le site est actif.
--  3. sama_site.modifier_site_par_jeton() mise à jour avec la même règle de
--     facturation (site payé, édité via lien privé sans compte).
--  4. sama_site.marquer_modifications_facturees() — solde l'ardoise d'un
--     client (bouton admin).
--  5. sama_site.confirmer_paiement_admin() mise à jour pour journaliser une
--     ligne dans sama_site.paiements (type 'initial') — jusqu'ici cette
--     table ne recevait jamais aucune écriture en self-hosted.
--  6. sama_site.confirmer_renouvellement_admin() — nouvelle fonction :
--     confirme un renouvellement, prolonge abonnement_expire_le, journalise
--     une ligne 'renouvellement' dans sama_site.paiements.
--
-- À exécuter sur le VPS, une fois connecté en SSH, depuis ~/supabase/docker :
--   docker compose exec -T db psql -U postgres -d postgres < migration_selfhosted_20260921_edition_et_renouvellement.sql

-- 1) Retirer l'update direct des colonnes de contenu : toute modification
--    passe désormais exclusivement par modifier_site_proprietaire() /
--    modifier_site_par_jeton(), qui appliquent la facturation automatique.
revoke update on sama_site.sites from authenticated;

-- 2) Table de suivi des modifications facturables
create table if not exists sama_site.modifications_facturables (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sama_site.sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  montant integer not null default 500,
  facturee boolean not null default false,
  facturee_le timestamptz
);

alter table sama_site.modifications_facturables enable row level security;

drop policy if exists "Admin gère les modifications facturables" on sama_site.modifications_facturables;
create policy "Admin gère les modifications facturables"
  on sama_site.modifications_facturables for all
  to authenticated
  using (sama_site.is_admin())
  with check (sama_site.is_admin());

grant select, insert, update, delete on sama_site.modifications_facturables to authenticated;

create index if not exists idx_modifs_facturables_site on sama_site.modifications_facturables(site_id);
create index if not exists idx_modifs_facturables_facturee on sama_site.modifications_facturables(facturee);

-- 3) Modification depuis le compte propriétaire (remplace l'update direct)
create or replace function sama_site.modifier_site_proprietaire(p_site_id uuid, p_champs jsonb)
returns setof sama_site.sites
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_site sama_site.sites%rowtype;
  v_autorise boolean;
begin
  select * into v_site from sama_site.sites where id = p_site_id;
  if not found then
    raise exception 'Site introuvable.';
  end if;

  if v_site.user_id is distinct from auth.uid() and not sama_site.is_admin() then
    raise exception 'Ce site ne vous appartient pas.';
  end if;

  v_autorise := (
    (v_site.statut in ('essai', 'a_livrer') and v_site.essai_expire_le > now())
    or (v_site.statut = 'actif' and (v_site.abonnement_expire_le is null or v_site.abonnement_expire_le > now()))
  );
  if not v_autorise and not sama_site.is_admin() then
    raise exception 'Ce site n''a plus les droits de modification (essai ou abonnement expiré).';
  end if;

  update sama_site.sites set
    nom_entreprise   = coalesce(p_champs->>'nom_entreprise', nom_entreprise),
    contact_nom      = coalesce(p_champs->>'contact_nom', contact_nom),
    whatsapp         = coalesce(p_champs->>'whatsapp', whatsapp),
    email            = coalesce(p_champs->>'email', email),
    adresse          = coalesce(p_champs->>'adresse', adresse),
    lien_google_maps = coalesce(p_champs->>'lien_google_maps', lien_google_maps),
    accroche         = coalesce(p_champs->>'accroche', accroche),
    logo_url         = coalesce(p_champs->>'logo_url', logo_url),
    banniere_url     = coalesce(p_champs->>'banniere_url', banniere_url),
    couleurs         = coalesce(p_champs->'couleurs', couleurs),
    produits         = coalesce(p_champs->'produits', produits),
    reseaux          = coalesce(p_champs->'reseaux', reseaux),
    modes_livraison  = coalesce(p_champs->'modes_livraison', modes_livraison),
    horaires         = coalesce(p_champs->'horaires', horaires),
    updated_at       = now(),
    derniere_modification_client_le = now()
  where id = v_site.id;

  if v_site.statut = 'actif' then
    insert into sama_site.modifications_facturables (site_id) values (v_site.id);
  end if;

  return query select * from sama_site.sites where id = v_site.id;
end;
$$;
grant execute on function sama_site.modifier_site_proprietaire to authenticated;

-- 4) Même règle pour l'édition via lien privé (token, sans compte)
create or replace function sama_site.modifier_site_par_jeton(p_token uuid, p_champs jsonb)
returns setof sama_site.sites
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_site sama_site.sites%rowtype;
  v_autorise boolean;
begin
  select * into v_site from sama_site.sites where edit_token = p_token;
  if not found then
    raise exception 'Lien invalide ou expiré.';
  end if;

  v_autorise := (
    (v_site.statut in ('essai', 'a_livrer') and v_site.essai_expire_le > now())
    or (v_site.statut = 'actif' and (v_site.abonnement_expire_le is null or v_site.abonnement_expire_le > now()))
  );
  if not v_autorise then
    raise exception 'Ce site n''a plus les droits de modification (essai ou abonnement expiré).';
  end if;

  update sama_site.sites set
    nom_entreprise   = coalesce(p_champs->>'nom_entreprise', nom_entreprise),
    contact_nom      = coalesce(p_champs->>'contact_nom', contact_nom),
    whatsapp         = coalesce(p_champs->>'whatsapp', whatsapp),
    email            = coalesce(p_champs->>'email', email),
    adresse          = coalesce(p_champs->>'adresse', adresse),
    lien_google_maps = coalesce(p_champs->>'lien_google_maps', lien_google_maps),
    accroche         = coalesce(p_champs->>'accroche', accroche),
    logo_url         = coalesce(p_champs->>'logo_url', logo_url),
    banniere_url     = coalesce(p_champs->>'banniere_url', banniere_url),
    couleurs         = coalesce(p_champs->'couleurs', couleurs),
    produits         = coalesce(p_champs->'produits', produits),
    reseaux          = coalesce(p_champs->'reseaux', reseaux),
    modes_livraison  = coalesce(p_champs->'modes_livraison', modes_livraison),
    horaires         = coalesce(p_champs->'horaires', horaires),
    metier           = coalesce(p_champs->>'metier', metier),
    metier_groupe    = coalesce(p_champs->>'metier_groupe', metier_groupe),
    extension        = coalesce(p_champs->>'extension', extension),
    duree            = coalesce(p_champs->>'duree', duree),
    montant          = coalesce((p_champs->>'montant')::integer, montant),
    moyen_paiement   = coalesce(p_champs->>'moyen_paiement', moyen_paiement),
    domaine          = coalesce(p_champs->>'domaine', domaine),
    statut           = case
                         when p_champs ? 'statut' and p_champs->>'statut' = 'a_livrer' and v_site.statut = 'essai'
                         then 'a_livrer'
                         else statut
                       end,
    updated_at       = now(),
    derniere_modification_client_le = now()
  where id = v_site.id;

  if v_site.statut = 'actif' then
    insert into sama_site.modifications_facturables (site_id) values (v_site.id);
  end if;

  return query select * from sama_site.sites where id = v_site.id;
end;
$$;
grant execute on function sama_site.modifier_site_par_jeton to anon, authenticated;

-- 5) Solder l'ardoise d'un client (bouton "Marquer facturé" côté admin)
create or replace function sama_site.marquer_modifications_facturees(p_site_id uuid)
returns setof sama_site.modifications_facturables
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
begin
  if not sama_site.is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  update sama_site.modifications_facturables
  set facturee = true, facturee_le = now()
  where site_id = p_site_id and facturee = false;

  return query select * from sama_site.modifications_facturables where site_id = p_site_id;
end;
$$;
grant execute on function sama_site.marquer_modifications_facturees to authenticated;

-- 6) Le paiement initial journalise désormais une ligne dans sama_site.paiements
create or replace function sama_site.confirmer_paiement_admin(
  p_site_id uuid,
  p_abonnement_expire_le timestamptz
)
returns setof sama_site.sites
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
begin
  if not sama_site.is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  update sama_site.sites set
    statut = 'actif',
    paiement_confirme = true,
    abonnement_expire_le = p_abonnement_expire_le,
    updated_at = now()
  where id = p_site_id;

  insert into sama_site.paiements (site_id, type, extension, duree, montant, moyen_paiement, statut, confirme_le, confirme_par)
  select id, 'initial', extension, duree, montant, moyen_paiement, 'confirme', now(), 'manuel'
  from sama_site.sites where id = p_site_id;

  return query select * from sama_site.sites where id = p_site_id;
end;
$$;
grant execute on function sama_site.confirmer_paiement_admin to authenticated;

-- 7) Confirmation d'un renouvellement (nouvelle fonction)
create or replace function sama_site.confirmer_renouvellement_admin(
  p_site_id uuid,
  p_duree text,
  p_montant integer,
  p_moyen_paiement text,
  p_abonnement_expire_le timestamptz
)
returns setof sama_site.sites
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_site sama_site.sites%rowtype;
begin
  if not sama_site.is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  select * into v_site from sama_site.sites where id = p_site_id;
  if not found then
    raise exception 'Site introuvable.';
  end if;

  update sama_site.sites set
    statut = 'actif',
    paiement_confirme = true,
    duree = p_duree,
    montant = p_montant,
    moyen_paiement = p_moyen_paiement,
    abonnement_expire_le = p_abonnement_expire_le,
    updated_at = now()
  where id = p_site_id;

  insert into sama_site.paiements (site_id, type, extension, duree, montant, moyen_paiement, statut, confirme_le, confirme_par)
  values (p_site_id, 'renouvellement', v_site.extension, p_duree, p_montant, p_moyen_paiement, 'confirme', now(), 'manuel');

  return query select * from sama_site.sites where id = p_site_id;
end;
$$;
grant execute on function sama_site.confirmer_renouvellement_admin to authenticated;
