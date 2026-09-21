-- ============================================================
-- Migration : un site supprimé (soft delete) ne doit plus être modifiable
-- ============================================================
-- À exécuter sur le VPS self-hosted (schéma "sama_site").
--
-- Constat (audit du 21/09/2026) : obtenir_site_par_jeton() et
-- obtenir_site_public_par_slug() excluent déjà les sites supprimés
-- (supprime_le is not null) depuis migration_selfhosted_20260921_suppression_site.sql,
-- mais les DEUX fonctions qui écrivent — modifier_site_proprietaire() et
-- modifier_site_par_jeton() — ne vérifiaient pas supprime_le. Un site
-- supprimé restait donc modifiable si l'appelant tenait encore une
-- référence (page déjà ouverte, lien /mon-espace/{id} en historique de
-- navigateur, etc.), ce qui contredit le message de confirmation affiché
-- lors de la suppression ("le site ne sera plus accessible, ni par vous ni
-- par vos clients"). Cette migration ne touche QUE la clause WHERE initiale
-- de ces deux fonctions (ajout de "and supprime_le is null") — copie exacte
-- du reste, sans aucun autre changement, depuis
-- migration_selfhosted_20260921_edition_et_renouvellement.sql.

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
