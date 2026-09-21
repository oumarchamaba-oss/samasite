-- ============================================================
-- Migration : un site supprimé (soft delete) ne doit plus apparaître
-- dans la section "Ils ont créé leur site avec Sama Site" de l'accueil
-- ============================================================
-- À exécuter sur le VPS self-hosted (schéma "sama_site").
--
-- Constat (revue complète du 21/09/2026) : sama_site.sites_publics() —
-- utilisée par app/page.js pour la section de confiance de la page
-- d'accueil publique — n'avait jamais reçu le filtre "supprime_le is null"
-- ajouté aux autres fonctions de lecture publique (obtenir_site_par_jeton,
-- obtenir_site_public_par_slug, voir migration_selfhosted_20260921_suppression_site.sql
-- et migration_selfhosted_20260921_durcissement_suppression.sql). Un site
-- supprimé par son propriétaire pouvait donc continuer d'afficher le nom
-- de son commerce publiquement sur la page d'accueil, ce qui contredit le
-- message de confirmation affiché lors de la suppression ("le site ne
-- sera plus accessible, ni par vous ni par vos clients"). Cette migration
-- ne touche QUE la clause WHERE de cette fonction (ajout de
-- "and supprime_le is null") — copie exacte du reste.

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
