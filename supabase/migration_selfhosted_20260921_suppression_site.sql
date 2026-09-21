-- ============================================================
-- Migration : suppression (douce) d'un site par son propriétaire
-- ============================================================
-- À exécuter sur le VPS self-hosted (schéma "sama_site").
--
-- Suppression "douce", pas un DELETE SQL : on marque le site avec
-- supprime_le = now() plutôt que de le supprimer réellement. Un vrai DELETE
-- entraînerait, via "on delete cascade", la perte définitive de l'historique
-- des paiements (table sama_site.paiements) et des relances liés à ce site —
-- des données comptables qu'on veut conserver même si le client supprime son
-- site. Une fois supprime_le posé :
--   - le site disparaît immédiatement de "Mon espace" (filtré côté requête) ;
--   - son lien privé (obtenir_site_par_jeton) et son lien public
--     (obtenir_site_public_par_slug) ne le retrouvent plus (comme s'il
--     n'existait pas) ;
--   - il reste consultable en base (et par l'admin) pour la comptabilité.

alter table sama_site.sites add column if not exists supprime_le timestamptz;

-- Le lien privé de gestion ne doit plus jamais résoudre un site supprimé.
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

-- Le lien public court non plus.
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
  where slug = p_slug and supprime_le is null;
$$;
grant execute on function sama_site.obtenir_site_public_par_slug to anon, authenticated;

-- Supprime (douce) un site : réservé au propriétaire connecté (ou à l'admin).
-- N'est volontairement PAS exposée via une policy RLS générique ni via une
-- colonne "update" accordée directement à "authenticated" (comme
-- paiement_confirme, "supprime_le" n'est pas dans la liste de colonnes
-- modifiables directement) : ça force tout appelant à passer par ici, où la
-- vérification de propriété est explicite et où on ne peut RIEN faire
-- d'autre que poser cette seule colonne.
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
