-- ============================================================
-- SAMA SITE — Migration : horaires d'ouverture
-- ============================================================
-- À exécuter APRÈS migration_comptes.sql et migration_securite_notifications.sql.

-- 1) Nouvelle colonne
alter table sites add column if not exists horaires jsonb;
alter table sites add column if not exists modes_livraison jsonb; -- au cas où une base très ancienne ne l'aurait pas encore

-- 2) Autoriser un compte client à modifier ses propres horaires
revoke update on sites from authenticated;
grant update (
  nom_entreprise, contact_nom, whatsapp, email, adresse, lien_google_maps,
  accroche, logo_url, banniere_url, couleurs, produits, reseaux,
  modes_livraison, metier, metier_groupe, horaires, derniere_modification_client_le
) on sites to authenticated;

-- 3) creer_site_public change de signature (nouveau paramètre) : on supprime
-- explicitement l'ancienne version avant de recréer, sinon Postgres garderait
-- les deux versions en même temps et les appels deviendraient ambigus.
drop function if exists creer_site_public(
  text, text, text, text, text, text, text, text, text, text, text, text,
  jsonb, jsonb, jsonb, jsonb
);

create or replace function creer_site_public(
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
set search_path = public
as $$
declare
  v_id uuid;
  v_token uuid := gen_random_uuid();
begin
  insert into sites (
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
  ) returning sites.id into v_id;

  return query select v_id, v_token;
end;
$$;
grant execute on function creer_site_public to anon, authenticated;

-- 4) modifier_site_par_jeton garde la même signature (jsonb générique), on
-- ajoute juste "horaires" à ce qu'elle sait mettre à jour.
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

  return query select * from sites where id = v_site.id;
end;
$$;
grant execute on function modifier_site_par_jeton to anon, authenticated;

-- Migration terminée.
