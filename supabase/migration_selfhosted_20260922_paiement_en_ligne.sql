-- ============================================================
-- Migration : paiement en ligne (Orange Money, Wave, Free Money, Visa,
-- Mastercard) pour les produits/services d'un site, via Versus Finances Tech
-- ============================================================
-- À exécuter sur le VPS self-hosted (schéma "sama_site").
--
-- Contexte (demande du 22/09/2026) : chaque commerçant doit pouvoir choisir,
-- à la création de son site ou plus tard en modification, de proposer le
-- paiement en ligne à ses propres clients (en plus de la commande WhatsApp
-- déjà existante), le tout inclus dans le prix du site (aucun coût
-- supplémentaire). L'argent va directement sur le compte marchand du
-- commerçant chez Versus Finances Tech (jamais sur un compte Sama Site) —
-- chaque site payé reçoit sa PROPRE clé API Versus, fournie par Versus à
-- Oumar au moment de la livraison, qu'il saisit ensuite dans ce dashboard.
--
-- Règles :
--   - Un site en essai (non payé) n'a JAMAIS le paiement en ligne actif,
--     seulement WhatsApp — même s'il a coché la demande.
--   - Le client DEMANDE la fonctionnalité (paiement_en_ligne_demande,
--     colonne non sensible, comme nom_entreprise) ; seul l'admin peut
--     ensuite l'ACTIVER (paiement_en_ligne_actif) en fournissant la vraie
--     clé API, une fois le site facturé/livré.
--   - La clé API elle-même n'est JAMAIS lisible par "anon"/"authenticated" :
--     elle vit dans une table séparée sans aucun grant à ces rôles, lue
--     uniquement par une route serveur utilisant la clé service_role (voir
--     app/api/paiement-boutique/initier/route.js côté application).

alter table sama_site.sites add column if not exists paiement_en_ligne_demande boolean not null default false;
alter table sama_site.sites add column if not exists paiement_en_ligne_actif boolean not null default false;

-- Table séparée, volontairement SANS AUCUN grant à anon/authenticated : seul
-- service_role (déjà couvert par le "grant all ... to service_role" global
-- du schéma) peut la lire, depuis une route serveur uniquement — jamais
-- depuis le navigateur du commerçant ni celui de ses clients.
create table if not exists sama_site.paiements_boutique_config (
  site_id uuid primary key references sama_site.sites(id) on delete cascade,
  fournisseur text not null default 'Versus',
  api_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enregistre/remplace la clé API Versus d'un site et active le paiement en
-- ligne. Réservé à l'administrateur, et seulement pour un site déjà payé
-- (statut = 'actif') — jamais un essai.
create or replace function sama_site.definir_paiement_en_ligne_admin(p_site_id uuid, p_api_key text)
returns void
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_statut text;
begin
  if not sama_site.is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;
  if p_api_key is null or btrim(p_api_key) = '' then
    raise exception 'Clé API manquante.';
  end if;

  select statut into v_statut from sama_site.sites where id = p_site_id and supprime_le is null;
  if not found then
    raise exception 'Site introuvable.';
  end if;
  if v_statut <> 'actif' then
    raise exception 'Le paiement en ligne ne peut être activé que sur un site payé (statut actif).';
  end if;

  insert into sama_site.paiements_boutique_config (site_id, fournisseur, api_key, updated_at)
  values (p_site_id, 'Versus', btrim(p_api_key), now())
  on conflict (site_id) do update set api_key = excluded.api_key, updated_at = now();

  update sama_site.sites set paiement_en_ligne_actif = true where id = p_site_id;
end;
$$;
grant execute on function sama_site.definir_paiement_en_ligne_admin to authenticated;

-- Retire la configuration et désactive le paiement en ligne. Réservé à
-- l'administrateur.
create or replace function sama_site.retirer_paiement_en_ligne_admin(p_site_id uuid)
returns void
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
begin
  if not sama_site.is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  delete from sama_site.paiements_boutique_config where site_id = p_site_id;
  update sama_site.sites set paiement_en_ligne_actif = false where id = p_site_id;
end;
$$;
grant execute on function sama_site.retirer_paiement_en_ligne_admin to authenticated;

-- modifier_site_proprietaire() doit pouvoir enregistrer la DEMANDE (opt-in)
-- du client — copie exacte du reste de cette fonction, depuis
-- migration_selfhosted_20260921_durcissement_suppression.sql, avec l'ajout
-- de "paiement_en_ligne_demande" dans le UPDATE.
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
  select * into v_site from sama_site.sites where id = p_site_id and supprime_le is null;
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
    paiement_en_ligne_demande = coalesce((p_champs->>'paiement_en_ligne_demande')::boolean, paiement_en_ligne_demande),
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

-- modifier_site_par_jeton() : même ajout, copie exacte du reste depuis
-- migration_selfhosted_20260921_durcissement_suppression.sql.
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
  select * into v_site from sama_site.sites where edit_token = p_token and supprime_le is null;
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
    paiement_en_ligne_demande = coalesce((p_champs->>'paiement_en_ligne_demande')::boolean, paiement_en_ligne_demande),
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

-- obtenir_site_public_par_slug() doit exposer le SEUL indicateur non sensible
-- "paiement_en_ligne_actif" (jamais la clé API), pour que la page publique
-- /s/{slug} et le fichier téléchargé sachent s'ils doivent afficher les
-- moyens de paiement — copie exacte du reste depuis
-- migration_selfhosted_20260921_suppression_site.sql.
create or replace function sama_site.obtenir_site_public_par_slug(p_slug text)
returns table (
  nom_entreprise text,
  accroche text,
  whatsapp text,
  adresse text,
  email text,
  lien_google_maps text,
  logo_url text,
  banniere_url text,
  couleurs jsonb,
  produits jsonb,
  reseaux jsonb,
  modes_livraison jsonb,
  horaires jsonb,
  metier text,
  metier_groupe text,
  secteur_id text,
  statut text,
  essai_expire_le timestamptz,
  abonnement_expire_le timestamptz,
  paiement_en_ligne_actif boolean
)
language sql
security definer
set search_path = sama_site, public, extensions
stable
as $$
  select nom_entreprise, accroche, whatsapp, adresse, email, lien_google_maps,
         logo_url, banniere_url, couleurs, produits, reseaux, modes_livraison, horaires,
         metier, metier_groupe, secteur_id, statut, essai_expire_le, abonnement_expire_le,
         paiement_en_ligne_actif
  from sama_site.sites
  where slug = p_slug and supprime_le is null;
$$;
grant execute on function sama_site.obtenir_site_public_par_slug to anon, authenticated;

-- Colonne non sensible (comme nom_entreprise) : le client peut la modifier
-- directement — défense en profondeur, même principe que le grant existant
-- (voir schema_sama_site_selfhosted.sql). "paiement_en_ligne_actif" reste
-- volontairement HORS de cette liste : seul definir_paiement_en_ligne_admin
-- / retirer_paiement_en_ligne_admin (réservés à l'admin) peuvent la changer.
revoke update on sama_site.sites from authenticated;
grant update (
  nom_entreprise, contact_nom, whatsapp, email, adresse, lien_google_maps,
  accroche, logo_url, banniere_url, couleurs, produits, reseaux,
  modes_livraison, metier, metier_groupe, horaires, derniere_modification_client_le,
  paiement_en_ligne_demande
) on sama_site.sites to authenticated;
