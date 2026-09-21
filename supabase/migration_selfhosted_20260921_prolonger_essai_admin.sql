-- ============================================================
-- Migration : permettre à l'administrateur de prolonger la période
-- d'essai d'un site, directement depuis le tableau de bord
-- ============================================================
-- À exécuter sur le VPS self-hosted (schéma "sama_site").
--
-- Contexte (21/09/2026) : le tableau de bord admin permettait déjà de
-- télécharger un site, générer facture/reçu, relancer par e-mail/WhatsApp,
-- et (via supprimer_site_proprietaire, qui accepte déjà "ou sama_site.is_admin()")
-- de supprimer un site. Il manquait un moyen d'augmenter le délai de la
-- période d'essai (essai_expire_le) pour un client qui en a besoin. Cette
-- fonction, réservée à l'administrateur, ajoute un nombre de jours choisi
-- à la date d'expiration actuelle — que l'essai soit encore en cours ou
-- déjà dépassé (essai_expire_le n'est jamais remis à zéro automatiquement,
-- voir le commentaire "bucket" de components/DashboardAdmin.js), ce qui
-- permet aussi bien de repousser un essai en cours que de redonner du
-- temps à un client dont l'essai vient d'expirer.

create or replace function sama_site.prolonger_essai_admin(p_site_id uuid, p_jours integer)
returns setof sama_site.sites
language plpgsql
security definer
set search_path = sama_site, public, extensions
as $$
begin
  if not sama_site.is_admin() then
    raise exception 'Réservé à l''administrateur.';
  end if;

  if p_jours is null or p_jours <= 0 then
    raise exception 'Le nombre de jours doit être positif.';
  end if;

  update sama_site.sites set
    essai_expire_le = greatest(coalesce(essai_expire_le, now()), now()) + (p_jours || ' days')::interval,
    updated_at = now()
  where id = p_site_id
    and supprime_le is null
    and statut in ('essai', 'a_livrer');

  if not found then
    raise exception 'Site introuvable, supprimé, ou son statut ne correspond plus à un essai (déjà payé ou déjà expiré définitivement).';
  end if;

  return query select * from sama_site.sites where id = p_site_id;
end;
$$;
grant execute on function sama_site.prolonger_essai_admin to authenticated;
