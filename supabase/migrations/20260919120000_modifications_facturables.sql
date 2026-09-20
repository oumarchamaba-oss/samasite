-- ============================================================
-- Migration : facturation des modifications post-paiement (500 F)
-- ============================================================
-- NE PAS APPLIQUER À LA PRODUCTION SANS CONFIRMATION EXPLICITE D'OUMAR.
-- Ce fichier est prêt mais n'a pas encore été exécuté sur le projet
-- Supabase Cloud actif (samasite.online) ni sur l'instance self-hosted.
--
-- Contenu, identique à ce qui a été ajouté à la fin de supabase/schema.sql :
--  1. Une colonne d'update directe sur "sites" est retirée aux clients
--     connectés (authenticated) : toute modification doit désormais passer
--     par une fonction sécurisée, pour ne jamais pouvoir contourner la
--     facturation.
--  2. Une nouvelle table modifications_facturables, qui journalise chaque
--     modification à 500 F sur un site déjà payé ("actif").
--  3. Une nouvelle fonction modifier_site_proprietaire(), qui remplace
--     l'ancien update direct utilisé par un client connecté (mode "owned"
--     dans EditerSite.js), et facture automatiquement si le site est actif.
--  4. modifier_site_par_jeton() mise à jour pour appliquer la même règle
--     de facturation à un site payé mais toujours édité via son lien privé
--     (sans compte).
--  5. Une fonction marquer_modifications_facturees(), réservée à
--     l'administrateur, pour solder l'ardoise d'un client une fois payée.
--
-- Pour appliquer cette migration :
--   - Sur Supabase Cloud (prod actuelle) : coller ce fichier dans
--     SQL Editor > New query, puis "Run" — uniquement quand Oumar confirme.
--   - Sur le VPS self-hosted : utiliser la variante schema-qualifiée dans
--     supabase/schema_sama_site_selfhosted.sql (même logique, préfixée
--     sama_site.*).

-- 1) Retirer l'update direct
revoke update on sites from authenticated;

-- 2) Table de suivi des modifications facturables
create table if not exists modifications_facturables (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  montant integer not null default 500,
  facturee boolean not null default false,
  facturee_le timestamptz
);

alter table modifications_facturables enable row level security;

create policy "Admin gère les modifications facturables"
  on modifications_facturables for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create index if not exists idx_modifs_facturables_site on modifications_facturables(site_id);
create index if not exists idx_modifs_facturables_facturee on modifications_facturables(facturee);

-- 3) Modification depuis le compte propriétaire (remplace l'update direct)
create or replace function modifier_site_proprietaire(p_site_id uuid, p_champs jsonb)
returns setof sites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site sites%rowtype;
  v_autorise boolean;
begin
  select * into v_site from sites where id = p_site_id;
  if not found then
    raise exception 'Site introuvable.';
  end if;

  if v_site.user_id is distinct from auth.uid() and not is_admin() then
    raise exception 'Ce site ne vous appartient pas.';
  end if;

  v_autorise := (
    (v_site.statut in ('essai', 'a_livrer') and v_site.essai_expire_le > now())
    or (v_site.statut = 'actif' and (v_site.abonnement_expire_le is null or v_site.abonnement_expire_le > now()))
  );
  if not v_autorise and not is_admin() then
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
    horaires         = coalesce(p_champs->'horaires', horaires),
    updated_at       = now(),
    derniere_modification_client_le = now()
  where id = v_site.id;

  if v_site.statut = 'actif' then
    insert into modifications_facturables (site_id) values (v_site.id);
  end if;

  return query select * from sites where id = v_site.id;
end;
$$;
grant execute on function modifier_site_proprietaire to authenticated;

-- 4) Même règle pour l'édition via lien privé (token, sans compte)
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
    insert into modifications_facturables (site_id) values (v_site.id);
  end if;

  return query select * from sites where id = v_site.id;
end;
$$;
grant execute on function modifier_site_par_jeton to anon, authenticated;

-- 5) Solder l'ardoise d'un client (bouton "Marquer facturé" côté admin)
create or replace function marquer_modifications_facturees(p_site_id uuid)
returns setof modifications_facturables
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  update modifications_facturables
  set facturee = true, facturee_le = now()
  where site_id = p_site_id and facturee = false;

  return query select * from modifications_facturables where site_id = p_site_id;
end;
$$;
grant execute on function marquer_modifications_facturees to authenticated;
