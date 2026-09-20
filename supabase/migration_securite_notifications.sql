-- ============================================================
-- SAMA SITE — Migration : sécurité par colonnes + notification de
-- modification client (à exécuter APRÈS migration_comptes.sql)
-- ============================================================
-- Corrige un vrai trou de sécurité : un client connecté pouvait, en théorie,
-- s'auto-activer en appelant l'API directement avec paiement_confirme=true
-- ou statut='actif' sur son propre site (la policy RLS ne vérifiait que la
-- propriété de la ligne, pas quelles colonnes étaient modifiées).
-- Ajoute aussi le suivi "le client a-t-il modifié son site depuis le dernier
-- téléchargement ?" pour le dashboard.

-- 1) Nouvelles colonnes
alter table sites add column if not exists derniere_modification_client_le timestamptz;
alter table sites add column if not exists derniere_livraison_le timestamptz;

-- 2) Restriction par colonne : un compte client ne peut plus modifier
-- directement les colonnes sensibles (statut, paiement_confirme, montant...)
-- — seulement via les fonctions ci-dessous, qui appliquent les bonnes règles.
revoke update on sites from authenticated;
grant update (
  nom_entreprise, contact_nom, whatsapp, email, adresse, lien_google_maps,
  accroche, logo_url, banniere_url, couleurs, produits, reseaux,
  modes_livraison, metier, metier_groupe, derniere_modification_client_le
) on sites to authenticated;

grant execute on function is_admin to anon, authenticated;

-- 3) Soumission d'un paiement manuel par un client connecté (remplace
-- l'ancienne écriture directe sur "statut"/"extension"/"montant"...).
create or replace function soumettre_paiement_manuel(
  p_site_id uuid,
  p_contact_nom text,
  p_extension text,
  p_duree text,
  p_montant integer,
  p_moyen_paiement text,
  p_domaine text
)
returns setof sites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site sites%rowtype;
begin
  select * into v_site from sites where id = p_site_id;
  if not found then
    raise exception 'Site introuvable.';
  end if;
  if v_site.user_id is distinct from auth.uid() and not is_admin() then
    raise exception 'Ce site ne vous appartient pas.';
  end if;
  if v_site.statut <> 'essai' then
    raise exception 'Cette commande a déjà été soumise.';
  end if;

  update sites set
    statut = 'a_livrer',
    contact_nom = coalesce(p_contact_nom, contact_nom),
    extension = p_extension,
    duree = p_duree,
    montant = p_montant,
    moyen_paiement = p_moyen_paiement,
    domaine = p_domaine,
    updated_at = now()
  where id = p_site_id;

  return query select * from sites where id = p_site_id;
end;
$$;
grant execute on function soumettre_paiement_manuel to authenticated;

-- 4) Confirmation de paiement — réservée à l'administrateur.
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

  return query select * from sites where id = p_site_id;
end;
$$;
grant execute on function confirmer_paiement_admin to authenticated;

-- 5) Marque un site comme livré (téléchargé) — réservée à l'administrateur.
create or replace function marquer_site_livre(p_site_id uuid)
returns setof sites
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  update sites set derniere_livraison_le = now() where id = p_site_id;
  return query select * from sites where id = p_site_id;
end;
$$;
grant execute on function marquer_site_livre to authenticated;

-- 6) modifier_site_par_jeton enregistre désormais la date de modification
-- client (déjà "security definer", donc pas concernée par la restriction de
-- colonnes ci-dessus — mais on veut qu'elle alimente aussi ce suivi).
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
    updated_at       = now(),
    derniere_modification_client_le = now()
  where id = v_site.id;

  return query select * from sites where id = v_site.id;
end;
$$;
grant execute on function modifier_site_par_jeton to anon, authenticated;

-- Migration terminée.
