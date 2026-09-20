-- ============================================================
-- SAMA SITE — Migration : comptes clients, sites multiples, permissions
-- ============================================================
-- À exécuter UNE SEULE FOIS sur votre projet Supabase existant (celui où
-- vous avez déjà exécuté schema.sql). Allez dans SQL Editor > New query,
-- collez tout ce fichier, cliquez sur "Run".
--
-- Ce script ne supprime AUCUNE donnée existante : il ajoute les nouvelles
-- colonnes/fonctions, et remplace uniquement les anciennes règles de sécurité
-- (policies) devenues trop permissives maintenant que vos clients ont aussi
-- de vrais comptes.

-- 1) Nouvelles colonnes sur "sites"
alter table sites add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table sites add column if not exists edit_token uuid unique default gen_random_uuid();
alter table sites add column if not exists edit_token_expires_at timestamptz default (now() + interval '2 days');

-- Donne un jeton aux sites déjà créés avant cette migration, pour qu'ils
-- restent accessibles via "Mon espace" (sinon edit_token serait vide pour eux).
update sites set edit_token = gen_random_uuid() where edit_token is null;
update sites set edit_token_expires_at = essai_expire_le where edit_token_expires_at is null;

-- 2) Fonction utilitaire : suis-je l'administrateur ?
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') in ('oumarchamaba@gmail.com');
$$;

-- 3) Suppression des anciennes policies devenues trop permissives
drop policy if exists "Le public peut créer un site" on sites;
drop policy if exists "Lecture publique des sites (MVP, voir commentaire ci-dessus)" on sites;
drop policy if exists "Le public peut mettre à jour son site (MVP)" on sites;
drop policy if exists "Admin peut tout lire" on sites;
drop policy if exists "Admin peut tout modifier" on sites;
drop policy if exists "Admin peut gérer les relances" on relances;
drop policy if exists "Le public peut créer une demande de paiement" on paiements;
drop policy if exists "Le public peut lire les paiements de son site (MVP)" on paiements;
drop policy if exists "Admin peut tout faire sur les paiements" on paiements;

-- 4) Nouvelles policies, limitées à "mes propres sites, ou moi si admin"
create policy "Un compte peut créer son propre site"
  on sites for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Lecture de ses propres sites (ou admin)"
  on sites for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

create policy "Modification de ses sites actifs (ou admin)"
  on sites for update
  to authenticated
  using (
    is_admin()
    or (
      user_id = auth.uid()
      and (
        (statut in ('essai', 'a_livrer') and essai_expire_le > now())
        or (statut = 'actif' and (abonnement_expire_le is null or abonnement_expire_le > now()))
      )
    )
  )
  with check (user_id = auth.uid() or is_admin());

create policy "Admin gère les relances"
  on relances for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admin gère les paiements"
  on paiements for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- 5) Fonctions "security definer" pour la création/édition sans compte
create or replace function creer_site_public(
  p_nom_entreprise text, p_contact_nom text, p_whatsapp text, p_email text,
  p_adresse text, p_lien_google_maps text, p_secteur_id text, p_metier text,
  p_metier_groupe text, p_accroche text, p_logo_url text, p_banniere_url text,
  p_couleurs jsonb, p_produits jsonb, p_reseaux jsonb, p_modes_livraison jsonb
)
returns table (id uuid, edit_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_token uuid := gen_random_uuid();
begin
  insert into sites (
    nom_entreprise, contact_nom, whatsapp, email, adresse, lien_google_maps,
    secteur_id, metier, metier_groupe, accroche, logo_url, banniere_url,
    couleurs, produits, reseaux, modes_livraison,
    statut, essai_expire_le, edit_token, edit_token_expires_at
  ) values (
    p_nom_entreprise, p_contact_nom, p_whatsapp, p_email, p_adresse, p_lien_google_maps,
    p_secteur_id, p_metier, p_metier_groupe, p_accroche, p_logo_url, p_banniere_url,
    coalesce(p_couleurs, '{}'::jsonb), coalesce(p_produits, '[]'::jsonb),
    coalesce(p_reseaux, '{}'::jsonb), coalesce(p_modes_livraison, '[]'::jsonb),
    'essai', now() + interval '2 days', v_token, now() + interval '2 days'
  ) returning sites.id into v_id;

  return query select v_id, v_token;
end;
$$;
grant execute on function creer_site_public to anon, authenticated;

create or replace function obtenir_site_par_jeton(p_token uuid)
returns setof sites
language sql
security definer
set search_path = public
stable
as $$
  select * from sites where edit_token = p_token;
$$;
grant execute on function obtenir_site_par_jeton to anon, authenticated;

create or replace function modifier_site_par_jeton(p_token uuid, p_champs jsonb)
returns setof sites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site sites%rowtype;
  v_autorise boolean;
begin
  select * into v_site from sites where edit_token = p_token;
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

  update sites set
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
    updated_at       = now()
  where id = v_site.id;

  return query select * from sites where id = v_site.id;
end;
$$;
grant execute on function modifier_site_par_jeton to anon, authenticated;

create or replace function rattacher_site(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site sites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise pour récupérer ce site.';
  end if;

  select * into v_site from sites where edit_token = p_token;
  if not found then
    raise exception 'Lien invalide ou expiré.';
  end if;

  if v_site.user_id is not null and v_site.user_id <> auth.uid() then
    raise exception 'Ce site est déjà rattaché à un autre compte.';
  end if;

  update sites set user_id = auth.uid() where id = v_site.id;
  return v_site.id;
end;
$$;
grant execute on function rattacher_site to authenticated;

create or replace function sites_publics()
returns table (nom_entreprise text, secteur_id text, statut text)
language sql
security definer
set search_path = public
stable
as $$
  select nom_entreprise, secteur_id, statut
  from sites
  where statut <> 'expire'
  order by created_at desc
  limit 30;
$$;
grant execute on function sites_publics to anon, authenticated;

-- 6) Index
create index if not exists idx_sites_user on sites(user_id);
create index if not exists idx_sites_edit_token on sites(edit_token);

-- Migration terminée. Vos sites existants sont conservés, avec un edit_token
-- généré rétroactivement. Ils resteront en "user_id = null" (non rattachés à
-- un compte) jusqu'à ce que quelqu'un les réclame via /site/[jeton].
