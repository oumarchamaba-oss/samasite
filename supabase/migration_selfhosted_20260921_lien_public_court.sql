-- Lien public court et sans bouton "Modifier" pour chaque site (21/09/2026)
--
-- Jusqu'ici, le SEUL lien existant pour un site était /site/{edit_token} :
-- un identifiant long (uuid) qui, en plus, sert aussi de clé de gestion
-- privée (c'est via ce même lien que le propriétaire modifie son site sans
-- compte). Le partager tel quel avec des clients posait deux problèmes :
-- lien illisible/long, et bandeau "Modifier ce site" qui pouvait apparaître.
--
-- Ce fichier ajoute un "slug" (ex: boulangerie-thiaw-oumar) lisible et
-- court, séparé du edit_token, utilisé UNIQUEMENT pour l'affichage public
-- en lecture seule (nouvelle page /s/{slug}) — jamais pour la gestion.
-- Le lien /site/{edit_token} continue de fonctionner comme avant (rien ne
-- casse pour les liens déjà partagés), il redevient un lien de gestion
-- interne à l'application plutôt que "le" lien à partager.

-- 1) Colonne slug + index unique (autorise plusieurs NULL, utile pendant
--    la transition avant que le backfill ne tourne).
alter table sama_site.sites add column if not exists slug text;
create unique index if not exists sites_slug_key on sama_site.sites (slug) where slug is not null;

-- 2) Nettoie un texte en identifiant d'URL : minuscules, accents français
--    retirés (sans dépendre de l'extension "unaccent", pas garantie sur
--    toutes les instances self-hosted), tout ce qui n'est pas [a-z0-9]
--    remplacé par un tiret, tirets en trop retirés.
create or replace function sama_site.slugifier(txt text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(
        translate(
          coalesce(txt, ''),
          'àáâãäåèéêëìíîïòóôõöùúûüýçñÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝÇÑ',
          'aaaaaaeeeeiiiiooooouuuuyicnAAAAAAEEEEIIIIOOOOOUUUUYICN'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

-- 3) Génère automatiquement un slug (entreprise + prénom du contact) à la
--    création d'un site, avec un suffixe numérique en cas de doublon.
--    Ne se déclenche qu'à l'insertion : un slug déjà distribué/partagé ne
--    change plus jamais, même si l'entreprise renomme son site ensuite.
create or replace function sama_site.generer_slug_site()
returns trigger
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  base_slug text;
  prenom text;
  candidat text;
  suffixe int := 1;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  prenom := split_part(coalesce(new.contact_nom, ''), ' ', 1);
  base_slug := sama_site.slugifier(
    new.nom_entreprise || case when prenom <> '' then '-' || prenom else '' end
  );
  if base_slug = '' then
    base_slug := 'site';
  end if;
  base_slug := left(base_slug, 40);

  candidat := base_slug;
  while exists (select 1 from sama_site.sites where slug = candidat) loop
    suffixe := suffixe + 1;
    candidat := left(base_slug, 40) || '-' || suffixe;
  end loop;

  new.slug := candidat;
  return new;
end;
$$;

drop trigger if exists trig_generer_slug_site on sama_site.sites;
create trigger trig_generer_slug_site
before insert on sama_site.sites
for each row execute function sama_site.generer_slug_site();

-- 4) Comble les sites déjà existants (le trigger ne joue qu'à l'insertion).
do $$
declare
  r record;
  base_slug text;
  prenom text;
  candidat text;
  suffixe int;
begin
  for r in select id, nom_entreprise, contact_nom from sama_site.sites where slug is null or slug = '' order by created_at loop
    prenom := split_part(coalesce(r.contact_nom, ''), ' ', 1);
    base_slug := sama_site.slugifier(
      r.nom_entreprise || case when prenom <> '' then '-' || prenom else '' end
    );
    if base_slug = '' then
      base_slug := 'site';
    end if;
    base_slug := left(base_slug, 40);

    candidat := base_slug;
    suffixe := 1;
    while exists (select 1 from sama_site.sites where slug = candidat) loop
      suffixe := suffixe + 1;
      candidat := left(base_slug, 40) || '-' || suffixe;
    end loop;

    update sama_site.sites set slug = candidat where id = r.id;
  end loop;
end $$;

-- 5) creer_site_public() (ancien parcours "essai sans compte", conservé pour
--    compatibilité) doit renvoyer le slug généré par le trigger ci-dessus.
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
returns table (id uuid, edit_token uuid, slug text)
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
declare
  v_id uuid;
  v_token uuid := gen_random_uuid();
  v_slug text;
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
  ) returning sama_site.sites.id, sama_site.sites.slug into v_id, v_slug;

  return query select v_id, v_token, v_slug;
end;
$$;
grant execute on function sama_site.creer_site_public to anon, authenticated;

-- 6) Lecture publique par slug, pour la nouvelle page /s/{slug} — UNIQUEMENT
--    les colonnes nécessaires à l'affichage du site. Contrairement à
--    obtenir_site_par_jeton() (qui renvoie toute la ligne, y compris
--    paiement/preuve_paiement/edit_token — acceptable là car il faut déjà
--    connaître le jeton secret pour l'appeler), cette fonction est destinée
--    à être appelée par n'importe quel visiteur anonyme muni du lien
--    public : elle ne doit donc jamais exposer de donnée interne.
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
  abonnement_expire_le timestamptz
)
language sql
security definer
set search_path = sama_site, public, extensions
stable
as $$
  select nom_entreprise, accroche, whatsapp, adresse, email, lien_google_maps,
         logo_url, banniere_url, couleurs, produits, reseaux, modes_livraison, horaires,
         metier, metier_groupe, secteur_id, statut, essai_expire_le, abonnement_expire_le
  from sama_site.sites
  where slug = p_slug;
$$;
grant execute on function sama_site.obtenir_site_public_par_slug to anon, authenticated;
