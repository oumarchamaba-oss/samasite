-- ============================================================
-- Migration : "À propos", compteurs de visites/clics WhatsApp, et avis clients
-- ============================================================
-- À exécuter sur le VPS self-hosted (schéma "sama_site"), avec :
--   Get-Content -Raw "supabase\migration_selfhosted_20260929_avis_compteurs_apropos.sql" | ssh root@167.233.247.98 "docker exec -i supabase-db psql -U postgres -d postgres"
--
-- Contexte (audit complet du 29/09/2026, recommandations niveau 1/2) :
--   - "À propos" : un paragraphe libre que le commerçant peut ajouter à son
--     mini-site (colonne non sensible, même traitement que "accroche").
--   - Compteurs de preuve sociale : nombre de visites de la page publique et
--     nombre de clics sur le bouton WhatsApp, affichés dans le tableau de
--     bord du commerçant (jamais sur le mini-site public lui-même).
--   - Avis clients : un client peut laisser une note (1-5) et un commentaire
--     sur le mini-site public ; le commerçant modère (approuve/rejette)
--     avant publication, seuls les avis approuvés sont visibles publiquement.

alter table sama_site.sites add column if not exists a_propos text;
alter table sama_site.sites add column if not exists visites_compteur integer not null default 0;
alter table sama_site.sites add column if not exists clics_whatsapp_compteur integer not null default 0;

-- ------------------------------------------------------------
-- Table avis
-- ------------------------------------------------------------
create table if not exists sama_site.avis (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sama_site.sites(id) on delete cascade,
  auteur_nom text not null check (char_length(btrim(auteur_nom)) between 1 and 80),
  note smallint not null check (note between 1 and 5),
  commentaire text check (commentaire is null or char_length(commentaire) <= 500),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'approuve', 'rejete')),
  created_at timestamptz not null default now()
);
create index if not exists avis_site_id_idx on sama_site.avis(site_id);

-- Défense en profondeur (même principe que paiements_boutique_config) :
-- RLS activée, ZÉRO grant direct à anon/authenticated — tout passe par les
-- fonctions SECURITY DEFINER ci-dessous, exécutées par le propriétaire de la
-- table (postgres), qui contourne RLS.
alter table sama_site.avis enable row level security;

-- Dépose un avis depuis le mini-site public. Public (anon) : n'importe quel
-- visiteur peut déposer un avis sur un site existant et non supprimé — reste
-- "en_attente" jusqu'à modération par le commerçant.
create or replace function sama_site.deposer_avis(p_slug text, p_auteur_nom text, p_note smallint, p_commentaire text default null)
returns void
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_site_id uuid;
begin
  select id into v_site_id from sama_site.sites where slug = p_slug and supprime_le is null;
  if not found then
    raise exception 'Site introuvable.';
  end if;
  if p_note is null or p_note < 1 or p_note > 5 then
    raise exception 'Note invalide (1 à 5).';
  end if;
  if p_auteur_nom is null or char_length(btrim(p_auteur_nom)) < 1 then
    raise exception 'Nom manquant.';
  end if;

  insert into sama_site.avis (site_id, auteur_nom, note, commentaire)
  values (v_site_id, btrim(p_auteur_nom), p_note, nullif(btrim(coalesce(p_commentaire, '')), ''));
end;
$$;
grant execute on function sama_site.deposer_avis to anon, authenticated;

-- Liste les avis APPROUVÉS d'un site, pour affichage public.
create or replace function sama_site.obtenir_avis_public(p_slug text)
returns table (id uuid, auteur_nom text, note smallint, commentaire text, created_at timestamptz)
language sql
security definer
set search_path = sama_site, public, extensions
stable
as $$
  select a.id, a.auteur_nom, a.note, a.commentaire, a.created_at
  from sama_site.avis a
  join sama_site.sites s on s.id = a.site_id
  where s.slug = p_slug and s.supprime_le is null and a.statut = 'approuve'
  order by a.created_at desc;
$$;
grant execute on function sama_site.obtenir_avis_public to anon, authenticated;

-- Liste TOUS les avis (toute modération confondue) d'un site, pour le
-- propriétaire (ou l'admin) dans son tableau de bord.
create or replace function sama_site.obtenir_avis_proprietaire(p_site_id uuid)
returns table (id uuid, auteur_nom text, note smallint, commentaire text, statut text, created_at timestamptz)
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from sama_site.sites where id = p_site_id and supprime_le is null;
  if not found then
    raise exception 'Site introuvable.';
  end if;
  if v_user_id is distinct from auth.uid() and not sama_site.is_admin() then
    raise exception 'Ce site ne vous appartient pas.';
  end if;

  return query
    select a.id, a.auteur_nom, a.note, a.commentaire, a.statut, a.created_at
    from sama_site.avis a
    where a.site_id = p_site_id
    order by a.created_at desc;
end;
$$;
grant execute on function sama_site.obtenir_avis_proprietaire to authenticated;

-- Approuve ou rejette un avis. Réservé au propriétaire du site (ou l'admin).
create or replace function sama_site.moderer_avis(p_avis_id uuid, p_statut text)
returns void
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_user_id uuid;
begin
  if p_statut not in ('approuve', 'rejete') then
    raise exception 'Statut invalide.';
  end if;

  select s.user_id into v_user_id
  from sama_site.avis a join sama_site.sites s on s.id = a.site_id
  where a.id = p_avis_id;
  if not found then
    raise exception 'Avis introuvable.';
  end if;
  if v_user_id is distinct from auth.uid() and not sama_site.is_admin() then
    raise exception 'Cet avis ne concerne pas un de vos sites.';
  end if;

  update sama_site.avis set statut = p_statut where id = p_avis_id;
end;
$$;
grant execute on function sama_site.moderer_avis to authenticated;

-- ------------------------------------------------------------
-- Compteurs de preuve sociale (visites, clics WhatsApp)
-- ------------------------------------------------------------
create or replace function sama_site.incrementer_visite_site(p_slug text)
returns void
language sql
security definer
set search_path = sama_site, public, extensions
as $$
  update sama_site.sites set visites_compteur = visites_compteur + 1
  where slug = p_slug and supprime_le is null;
$$;
grant execute on function sama_site.incrementer_visite_site to anon, authenticated;

create or replace function sama_site.incrementer_clic_whatsapp(p_slug text)
returns void
language sql
security definer
set search_path = sama_site, public, extensions
as $$
  update sama_site.sites set clics_whatsapp_compteur = clics_whatsapp_compteur + 1
  where slug = p_slug and supprime_le is null;
$$;
grant execute on function sama_site.incrementer_clic_whatsapp to anon, authenticated;

-- ------------------------------------------------------------
-- modifier_site_proprietaire() / modifier_site_par_jeton() : ajout de
-- "a_propos" — copie exacte du reste depuis
-- migration_selfhosted_20260922_paiement_en_ligne.sql.
-- ------------------------------------------------------------
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
    a_propos         = coalesce(p_champs->>'a_propos', a_propos),
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
    a_propos         = coalesce(p_champs->>'a_propos', a_propos),
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

-- ------------------------------------------------------------
-- obtenir_site_public_par_slug() : ajout de a_propos (affichage) — les
-- compteurs restent PRIVÉS (jamais exposés sur cette fonction publique),
-- voir obtenir_avis_proprietaire/MonEspace pour leur lecture par le
-- commerçant. "create or replace" ne peut pas changer les colonnes de
-- retour : on supprime explicitement avant de recréer.
-- ------------------------------------------------------------
drop function if exists sama_site.obtenir_site_public_par_slug(text);
create or replace function sama_site.obtenir_site_public_par_slug(p_slug text)
returns table (
  nom_entreprise text,
  accroche text,
  a_propos text,
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
  select nom_entreprise, accroche, a_propos, whatsapp, adresse, email, lien_google_maps,
         logo_url, banniere_url, couleurs, produits, reseaux, modes_livraison, horaires,
         metier, metier_groupe, secteur_id, statut, essai_expire_le, abonnement_expire_le,
         paiement_en_ligne_actif
  from sama_site.sites
  where slug = p_slug and supprime_le is null;
$$;
grant execute on function sama_site.obtenir_site_public_par_slug to anon, authenticated;

-- "a_propos" est une colonne non sensible (comme "accroche") : le client
-- peut la modifier directement — défense en profondeur, même principe que
-- le grant existant (voir migration_selfhosted_20260922_paiement_en_ligne.sql).
revoke update on sama_site.sites from authenticated;
grant update (
  nom_entreprise, contact_nom, whatsapp, email, adresse, lien_google_maps,
  accroche, a_propos, logo_url, banniere_url, couleurs, produits, reseaux,
  modes_livraison, metier, metier_groupe, horaires, derniere_modification_client_le,
  paiement_en_ligne_demande
) on sama_site.sites to authenticated;
