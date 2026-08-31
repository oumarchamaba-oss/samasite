-- ============================================================
-- SAMA SITE — Schéma de base de données (Supabase / PostgreSQL)
-- ============================================================
-- À exécuter dans : Supabase > votre projet > SQL Editor > New query
-- Copiez-collez tout ce fichier, puis cliquez sur "Run".

-- Table des sites créés par les clients
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

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
  abonnement_expire_le timestamptz
);

-- Table des demandes de renouvellement / relance (historique)
create table if not exists relances (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  created_at timestamptz default now(),
  canal text check (canal in ('whatsapp', 'email')),
  note text
);

-- Historique des paiements : chaque commande initiale ET chaque renouvellement
-- crée une ligne ici. C'est cette table qui alimente les factures/reçus et
-- permet de savoir précisément ce qui a été payé, quand, et comment.
create table if not exists paiements (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
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

-- Sécurité : active la Row Level Security (RLS)
alter table sites enable row level security;
alter table relances enable row level security;
alter table paiements enable row level security;

-- Le public (visiteurs anonymes) peut CRÉER un site (formulaire de création)
create policy "Le public peut créer un site"
  on sites for insert
  to anon
  with check (true);

-- Le public peut LIRE les sites. Nécessaire pour deux usages sans connexion :
--  1) la page d'accueil (liste "Ils ont créé leur site avec Sama Site"),
--  2) "Mon espace" du client, qui retrouve son site via l'identifiant (UUID)
--     enregistré dans son navigateur — cet UUID agit comme un jeton d'accès :
--     imprévisible, mais pas un vrai système d'authentification.
-- Limite connue (MVP) : n'importe qui connaissant l'URL Supabase et la clé
-- publique pourrait interroger la table entière avec cette règle. Si vous
-- stockez des données sensibles, remplacez cette policy par une fonction RPC
-- "security definer" qui ne renvoie qu'un site précis à la fois.
create policy "Lecture publique des sites (MVP, voir commentaire ci-dessus)"
  on sites for select
  to anon
  using (true);

-- Le public peut mettre à jour SON site (ex : confirmer une commande de paiement
-- à l'étape 5 du parcours). Même limite MVP que ci-dessus : protégée par
-- l'imprévisibilité de l'UUID, pas par une vraie authentification.
create policy "Le public peut mettre à jour son site (MVP)"
  on sites for update
  to anon
  using (true)
  with check (true);

-- Seuls les utilisateurs connectés (vous, l'admin) peuvent LIRE/MODIFIER tous les sites
create policy "Admin peut tout lire"
  on sites for select
  to authenticated
  using (true);

create policy "Admin peut tout modifier"
  on sites for update
  to authenticated
  using (true);

create policy "Admin peut gérer les relances"
  on relances for all
  to authenticated
  using (true)
  with check (true);

-- Paiements : le client (anon) peut créer une demande de paiement pour son site
-- (à l'étape "commande" du parcours) ; seul l'admin peut la confirmer/modifier.
create policy "Le public peut créer une demande de paiement"
  on paiements for insert
  to anon
  with check (true);

create policy "Le public peut lire les paiements de son site (MVP)"
  on paiements for select
  to anon
  using (true);

create policy "Admin peut tout faire sur les paiements"
  on paiements for all
  to authenticated
  using (true)
  with check (true);

-- Index utiles pour le dashboard
create index if not exists idx_sites_statut on sites(statut);
create index if not exists idx_sites_created_at on sites(created_at desc);
create index if not exists idx_sites_abonnement_expire on sites(abonnement_expire_le);
create index if not exists idx_paiements_site on paiements(site_id);
create index if not exists idx_paiements_statut on paiements(statut);
