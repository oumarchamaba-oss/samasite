-- ============================================================
-- SAMA SITE — Schéma DÉDIÉ pour l'instance Supabase self-hosted
-- partagée du VPS Wanekoo (db.samasite.online)
-- ============================================================
-- À NE PAS exécuter sur le projet Supabase Cloud actuel (production) :
-- celui-ci utilise encore le schéma "public" (voir supabase/schema.sql).
-- Ce fichier isole Sama Site dans son propre schéma Postgres "sama_site",
-- pour cohabiter proprement avec les autres apps hébergées sur le même
-- VPS (ex: souleymane-agne) sans jamais toucher à leurs tables/policies.
--
-- À exécuter sur le VPS, une fois connecté en SSH :
--   cd ~/supabase/docker
--   docker compose exec -T db psql -U postgres -d postgres < schema_sama_site_selfhosted.sql
-- (ou : Supabase Studio > SQL Editor > coller tout le fichier > Run)
--
-- Après exécution, deux étapes RESTENT nécessaires côté VPS (voir le
-- message qui accompagne ce fichier) :
--   1. Exposer le schéma "sama_site" à l'API (PGRST_DB_SCHEMAS dans .env
--      + redémarrage du conteneur "rest").
--   2. Créer le compte admin (oumarchamaba@gmail.com) via Auth Admin API
--      ou Studio > Authentication > Add user.

create schema if not exists sama_site;

-- Les rôles utilisés par l'API (PostgREST) doivent pouvoir "voir" le
-- schéma avant même que RLS n'entre en jeu — ce n'est PAS automatique
-- pour un schéma custom (contrairement à "public", que Supabase
-- configure par défaut à la création d'un projet).
grant usage on schema sama_site to anon, authenticated, service_role;

-- Table des sites créés par les clients
create table if not exists sama_site.sites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Propriétaire du site (null tant que le site n'est pas rattaché à un compte —
  -- cas d'une création sans compte, accessible via edit_token pendant l'essai).
  user_id uuid references auth.users(id) on delete set null,

  -- Lien privé d'édition pour un site créé SANS compte : permet au créateur de
  -- revenir modifier son site pendant les 2 jours d'essai, sans authentification.
  -- Unique, imprévisible, et vérifié + limité dans le temps par les fonctions
  -- ci-dessous (jamais par une policy RLS générique — voir plus bas pourquoi).
  edit_token uuid unique default gen_random_uuid(),
  edit_token_expires_at timestamptz default (now() + interval '2 days'),

  -- Identité du commerce
  nom_entreprise text not null,
  contact_nom text,
  whatsapp text not null,
  email text,
  adresse text,
  lien_google_maps text,

  -- Catégorie
  secteur_id text not null,           -- ex: 'restaurant', 'artisanat'
  metier text,                        -- si secteur_id = 'artisanat'
  metier_groupe text,

  -- Contenu
  accroche text,
  logo_url text,
  banniere_url text,
  couleurs jsonb,                     -- { primaire, fond, accent }
  produits jsonb default '[]'::jsonb, -- [{ texte, prix, categorie, description, image_url }]
  reseaux jsonb default '{}'::jsonb,  -- { facebook, instagram, tiktok, twitter }
  modes_livraison jsonb default '[]'::jsonb,
  horaires jsonb default '{}'::jsonb, -- { lundi: { ouvert: true, debut: "08:00", fin: "18:00" }, ... }

  -- Cycle de vie du site
  statut text not null default 'essai' check (statut in ('essai', 'a_livrer', 'actif', 'expire')),
  essai_expire_le timestamptz default (now() + interval '2 days'),

  -- Abonnement / paiement
  extension text check (extension in ('com', 'sn')),
  duree text check (duree in ('semestre', 'an')),
  montant integer,
  moyen_paiement text check (moyen_paiement in ('wave', 'orange_money', 'visa')),
  paiement_confirme boolean default false,
  preuve_paiement text,               -- lien capture d'écran ou référence transaction envoyée par le client
  domaine text,
  abonnement_expire_le timestamptz,

  -- Suivi pour le téléchargement manuel du site (voir README) : permet de
  -- savoir si le client a modifié son contenu depuis le dernier téléchargement.
  derniere_modification_client_le timestamptz,
  derniere_livraison_le timestamptz,

  -- Suppression "douce" par le propriétaire (voir supprimer_site_proprietaire()
  -- plus bas) : le site n'est jamais réellement effacé, pour ne pas perdre
  -- l'historique de paiements associé (on delete cascade sur paiements).
  supprime_le timestamptz
);

-- Table des demandes de renouvellement / relance (historique)
create table if not exists sama_site.relances (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sama_site.sites(id) on delete cascade,
  created_at timestamptz default now(),
  canal text check (canal in ('whatsapp', 'email')),
  note text
);

-- Historique des paiements : chaque commande initiale ET chaque renouvellement
-- crée une ligne ici. C'est cette table qui alimente les factures/reçus et
-- permet de savoir précisément ce qui a été payé, quand, et comment.
create table if not exists sama_site.paiements (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sama_site.sites(id) on delete cascade,
  created_at timestamptz default now(),

  type text not null default 'initial' check (type in ('initial', 'renouvellement')),
  extension text check (extension in ('com', 'sn')),
  duree text check (duree in ('semestre', 'an')),
  montant integer not null,
  moyen_paiement text check (moyen_paiement in ('wave', 'orange_money', 'visa')),

  -- 'en_attente' : commande enregistrée, paiement pas encore confirmé (manuel ou API).
  -- 'confirme'   : paiement reçu — coché manuellement par l'admin, ou automatiquement par l'API plus tard.
  statut text not null default 'en_attente' check (statut in ('en_attente', 'confirme', 'echoue')),
  confirme_le timestamptz,

  -- Rempli automatiquement quand un vrai fournisseur de paiement (API) sera branché :
  -- référence de transaction, méthode de confirmation ('manuel' ou 'api').
  reference_transaction text,
  confirme_par text default 'manuel' check (confirme_par in ('manuel', 'api'))
);

-- ============================================================
-- Sécurité : Row Level Security (RLS)
-- ============================================================
-- Modèle identique à supabase/schema.sql, seulement re-schématisé pour
-- sama_site. Voir ce fichier pour le détail des choix de sécurité.

alter table sama_site.sites enable row level security;
alter table sama_site.relances enable row level security;
alter table sama_site.paiements enable row level security;

-- Fonction utilitaire : suis-je l'administrateur ? (un seul compte admin pour
-- l'instant — ajoutez d'autres e-mails dans le tableau si besoin plus tard).
create or replace function sama_site.is_admin()
returns boolean
language sql
stable
set search_path = sama_site, public, extensions
as $$
  select coalesce(auth.jwt() ->> 'email', '') in ('oumarchamaba@gmail.com');
$$;
grant execute on function sama_site.is_admin to anon, authenticated;

-- Privilèges de base sur les tables : PostgREST/les clients ont besoin d'un
-- GRANT table-level pour même TENTER la requête — RLS filtre ensuite QUELLES
-- lignes sont réellement visibles/modifiables. "anon" n'a volontairement
-- AUCUN accès direct aux tables : il passe uniquement par les fonctions
-- "security definer" plus bas (creer_site_public, obtenir_site_par_jeton,
-- modifier_site_par_jeton), exactement comme dans schema.sql (public).
grant select, insert on sama_site.sites to authenticated;
grant select, insert, update, delete on sama_site.relances to authenticated;
grant select, insert, update, delete on sama_site.paiements to authenticated;
grant all privileges on all tables in schema sama_site to service_role;

-- Un utilisateur connecté peut créer un site directement rattaché à son propre
-- compte (parcours "création avec compte"). La création SANS compte passe par
-- la fonction creer_site_public() ci-dessous, pas par cette policy.
create policy "Un compte peut créer son propre site"
  on sama_site.sites for insert
  to authenticated
  with check (user_id = auth.uid());

-- Chacun ne lit que ses propres sites ; l'administrateur lit tout.
create policy "Lecture de ses propres sites (ou admin)"
  on sama_site.sites for select
  to authenticated
  using (user_id = auth.uid() or sama_site.is_admin());

-- Modification limitée à ses propres sites, ET seulement s'ils sont encore
-- dans la fenêtre autorisée (essai en cours, ou abonnement actif). Passé ce
-- délai, plus aucune écriture n'est possible tant que l'admin n'a pas
-- confirmé un paiement (qui, lui, passe toujours — is_admin() prioritaire).
create policy "Modification de ses sites actifs (ou admin)"
  on sama_site.sites for update
  to authenticated
  using (
    sama_site.is_admin()
    or (
      user_id = auth.uid()
      and (
        (statut in ('essai', 'a_livrer') and essai_expire_le > now())
        or (statut = 'actif' and (abonnement_expire_le is null or abonnement_expire_le > now()))
      )
    )
  )
  with check (user_id = auth.uid() or sama_site.is_admin());

-- Restriction supplémentaire, INDÉPENDANTE de la policy ci-dessus : la policy
-- RLS décide QUELLES LIGNES peuvent être touchées, mais pas QUELLES COLONNES.
-- Sans cette étape, un client connecté pourrait — via un appel direct à
-- l'API, en contournant l'interface — s'auto-activer en écrivant lui-même
-- paiement_confirme=true ou statut='actif' sur SON PROPRE site (la ligne
-- passerait bien la vérification "user_id = auth.uid()"). On retire donc à
-- "authenticated" le droit de modifier les colonnes sensibles liées au
-- paiement : elles ne sont plus modifiables que via les fonctions "security
-- definer" ci-dessous (soumettre_paiement_manuel, confirmer_paiement_admin),
-- qui appliquent les bonnes règles (transition autorisée, ou admin requis).
revoke update on sama_site.sites from authenticated;
grant update (
  nom_entreprise, contact_nom, whatsapp, email, adresse, lien_google_maps,
  accroche, logo_url, banniere_url, couleurs, produits, reseaux,
  modes_livraison, metier, metier_groupe, horaires, derniere_modification_client_le
) on sama_site.sites to authenticated;

-- Soumet une intention de paiement manuel (étape 5, "j'ai déjà envoyé
-- l'argent") pour un site qu'on possède. Autorise uniquement la transition
-- "essai" -> "a_livrer", jamais "actif" — l'activation reste réservée à
-- l'administrateur via confirmer_paiement_admin().
create or replace function sama_site.soumettre_paiement_manuel(
  p_site_id uuid,
  p_contact_nom text,
  p_extension text,
  p_duree text,
  p_montant integer,
  p_moyen_paiement text,
  p_domaine text
)
returns setof sama_site.sites
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_site sama_site.sites%rowtype;
begin
  select * into v_site from sama_site.sites where id = p_site_id;
  if not found then
    raise exception 'Site introuvable.';
  end if;
  if v_site.user_id is distinct from auth.uid() and not sama_site.is_admin() then
    raise exception 'Ce site ne vous appartient pas.';
  end if;
  if v_site.statut <> 'essai' then
    raise exception 'Cette commande a déjà été soumise.';
  end if;

  update sama_site.sites set
    statut = 'a_livrer',
    contact_nom = coalesce(p_contact_nom, contact_nom),
    extension = p_extension,
    duree = p_duree,
    montant = p_montant,
    moyen_paiement = p_moyen_paiement,
    domaine = p_domaine,
    updated_at = now()
  where id = p_site_id;

  return query select * from sama_site.sites where id = p_site_id;
end;
$$;
grant execute on function sama_site.soumettre_paiement_manuel to authenticated;

-- Confirme un paiement et active un site — réservé à l'administrateur.
-- Remplace toute écriture directe de "statut"/"paiement_confirme" par le
-- dashboard, désormais bloquée par la restriction de colonnes ci-dessus.
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

  return query select * from sama_site.sites where id = p_site_id;
end;
$$;
grant execute on function sama_site.confirmer_paiement_admin to authenticated;

-- Marque un site comme livré (fichier téléchargé / hébergé ailleurs) — utilisé
-- pour savoir si le client a modifié son site DEPUIS cette livraison, et donc
-- si l'admin doit re-télécharger et remettre le fichier à jour.
create or replace function sama_site.marquer_site_livre(p_site_id uuid)
returns setof sama_site.sites
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
begin
  if not sama_site.is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  update sama_site.sites set derniere_livraison_le = now() where id = p_site_id;
  return query select * from sama_site.sites where id = p_site_id;
end;
$$;
grant execute on function sama_site.marquer_site_livre to authenticated;

-- Note : il n'existe volontairement AUCUNE policy anonyme sur "sites" (ni
-- select, ni insert, ni update). Un visiteur non connecté qui crée un site
-- passe par creer_site_public(), le consulte via obtenir_site_par_jeton(),
-- et le modifie via modifier_site_par_jeton() — trois fonctions "security
-- definer" ci-dessous.

create or replace function sama_site.creer_site_public(
  p_nom_entreprise text,
  p_contact_nom text,
  p_whatsapp text,
  p_email text,
  p_adresse text,
  p_lien_google_maps text,
  p_secteur_id text,
  p_metier text,
  p_metier_groupe text,
  p_accroche text,
  p_logo_url text,
  p_banniere_url text,
  p_couleurs jsonb,
  p_produits jsonb,
  p_reseaux jsonb,
  p_modes_livraison jsonb,
  p_horaires jsonb default null
)
returns table (id uuid, edit_token uuid)
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_id uuid;
  v_token uuid := gen_random_uuid();
begin
  insert into sama_site.sites (
    nom_entreprise, contact_nom, whatsapp, email, adresse, lien_google_maps,
    secteur_id, metier, metier_groupe, accroche, logo_url, banniere_url,
    couleurs, produits, reseaux, modes_livraison, horaires,
    statut, essai_expire_le, edit_token, edit_token_expires_at
  ) values (
    p_nom_entreprise, p_contact_nom, p_whatsapp, p_email, p_adresse, p_lien_google_maps,
    p_secteur_id, p_metier, p_metier_groupe, p_accroche, p_logo_url, p_banniere_url,
    coalesce(p_couleurs, '{}'::jsonb), coalesce(p_produits, '[]'::jsonb),
    coalesce(p_reseaux, '{}'::jsonb), coalesce(p_modes_livraison, '[]'::jsonb), p_horaires,
    'essai', now() + interval '2 days', v_token, now() + interval '2 days'
  ) returning sama_site.sites.id into v_id;

  return query select v_id, v_token;
end;
$$;
grant execute on function sama_site.creer_site_public to anon, authenticated;

-- Retrouve un site par son jeton d'édition (utilisé par "Mon espace" et par
-- la page /site/[jeton] pour un visiteur non connecté).
create or replace function sama_site.obtenir_site_par_jeton(p_token uuid)
returns setof sama_site.sites
language sql
security definer
set search_path = sama_site, public, extensions
stable
as $$
  select * from sama_site.sites where edit_token = p_token and supprime_le is null;
$$;
grant execute on function sama_site.obtenir_site_par_jeton to anon, authenticated;

-- Supprime (douce) un site : réservé au propriétaire connecté (ou à l'admin).
-- Voir supabase/migration_selfhosted_20260921_suppression_site.sql pour le
-- détail du choix (suppression douce plutôt que DELETE, pour conserver
-- l'historique de paiements).
create or replace function sama_site.supprimer_site_proprietaire(p_site_id uuid)
returns void
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
begin
  update sama_site.sites
  set supprime_le = now()
  where id = p_site_id
    and supprime_le is null
    and (user_id = auth.uid() or sama_site.is_admin());

  if not found then
    raise exception 'Site introuvable, déjà supprimé, ou vous n''en êtes pas propriétaire.';
  end if;
end;
$$;
grant execute on function sama_site.supprimer_site_proprietaire to authenticated;

-- Modifie un site via son jeton, en respectant les mêmes règles de fenêtre
-- que pour un compte (essai en cours, ou abonnement actif).
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

  return query select * from sama_site.sites where id = v_site.id;
end;
$$;
grant execute on function sama_site.modifier_site_par_jeton to anon, authenticated;

-- Rattache un site (créé sans compte) au compte de l'utilisateur actuellement
-- connecté — utilisée quand quelqu'un se connecte ou s'inscrit depuis la page
-- /site/[jeton]. Refuse si le site appartient déjà à quelqu'un d'autre.
create or replace function sama_site.rattacher_site(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_site sama_site.sites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise pour récupérer ce site.';
  end if;

  select * into v_site from sama_site.sites where edit_token = p_token;
  if not found then
    raise exception 'Lien invalide ou expiré.';
  end if;

  if v_site.user_id is not null and v_site.user_id <> auth.uid() then
    raise exception 'Ce site est déjà rattaché à un autre compte.';
  end if;

  update sama_site.sites set user_id = auth.uid() where id = v_site.id;
  return v_site.id;
end;
$$;
grant execute on function sama_site.rattacher_site to authenticated;

-- Liste publique restreinte (nom, secteur, statut uniquement) pour la section
-- "Ils ont créé leur site avec Sama Site" de la page d'accueil.
create or replace function sama_site.sites_publics()
returns table (nom_entreprise text, secteur_id text, statut text)
language sql
security definer
set search_path = sama_site, public, extensions
stable
as $$
  select nom_entreprise, secteur_id, statut
  from sama_site.sites
  where statut <> 'expire' and supprime_le is null
  order by created_at desc
  limit 30;
$$;
grant execute on function sama_site.sites_publics to anon, authenticated;

-- Relances et paiements : réservés à l'administrateur uniquement (les clients
-- n'y accèdent jamais directement, ni en lecture ni en écriture).
create policy "Admin gère les relances"
  on sama_site.relances for all
  to authenticated
  using (sama_site.is_admin())
  with check (sama_site.is_admin());

create policy "Admin gère les paiements"
  on sama_site.paiements for all
  to authenticated
  using (sama_site.is_admin())
  with check (sama_site.is_admin());

-- Index utiles
create index if not exists idx_sites_statut on sama_site.sites(statut);
create index if not exists idx_sites_created_at on sama_site.sites(created_at desc);
create index if not exists idx_sites_abonnement_expire on sama_site.sites(abonnement_expire_le);
create index if not exists idx_sites_user on sama_site.sites(user_id);
create index if not exists idx_sites_edit_token on sama_site.sites(edit_token);
create index if not exists idx_paiements_site on sama_site.paiements(site_id);
create index if not exists idx_paiements_statut on sama_site.paiements(statut);
