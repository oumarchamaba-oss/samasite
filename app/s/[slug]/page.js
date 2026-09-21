// Page PUBLIQUE d'un site, via son lien court (samasite.online/s/{slug}).
//
// Volontairement différente de app/site/[token]/page.js :
// - Composant SERVEUR (pas "use client") : le rendu part directement du
//   HTML généré côté serveur, sans écran "Chargement…" pendant qu'un
//   navigateur télécharge le JS puis interroge la base — c'est ce qui
//   rendait l'ancien lien perceptiblement lent à l'ouverture.
// - `revalidate` était fixé à 30s (cache) : un client a signalé le 21/09/2026
//   qu'un produit tout juste ajouté puis publié restait invisible sur le
//   lien public — exactement l'effet attendu de ce cache pendant sa fenêtre
//   de 30s. Puisque "publier" doit être immédiat pour l'utilisateur, cette
//   page est repassée en rendu dynamique (aucun cache) : chaque ouverture
//   du lien recharge l'état réel du site en base, sans délai.
// - Ne connaît JAMAIS l'identité du visiteur (pas de session, pas de
//   vérification de propriétaire) : aucune action "Modifier ce site" ne
//   peut donc apparaître ici, pour personne, y compris le propriétaire —
//   c'est le lien à partager sans arrière-pensée avec des clients.
// - N'appelle que obtenir_site_public_par_slug(), qui ne renvoie que les
//   colonnes nécessaires à l'affichage (jamais paiement/edit_token/user_id).
//
// La gestion du site (modifier, payer, renouveler) reste réservée à "Mon
// espace" et à app/site/[token]/page.js — jamais à cette page.
import { notFound } from "next/navigation";
import { T, SECTEURS } from "../../../lib/data";
import { supabase } from "../../../lib/supabaseClient";
import { estPublie, businessDepuisSite, iconesDepuisLogo } from "../../../lib/sitePublic";
import SiteDesktop from "../../../components/SiteDesktop";
import { Clock } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function chargerSite(slug) {
  const { data, error } = await supabase.rpc("obtenir_site_public_par_slug", { p_slug: slug });
  if (error || !data || data.length === 0) return null;
  return data[0];
}

export async function generateMetadata({ params }) {
  // Le layout racine ajoute déjà " - Sama Site" (voir app/layout.js, title.template) —
  // ne pas le répéter ici.
  const site = await chargerSite(params.slug);
  if (!site) return { title: "Site introuvable" };
  const icons = iconesDepuisLogo(site.logo_url);
  return {
    title: site.nom_entreprise,
    description: site.accroche || `Découvrez ${site.nom_entreprise} sur Sama Site.`,
    ...(icons ? { icons } : {}),
  };
}

export default async function PageSitePublicParSlug({ params }) {
  const site = await chargerSite(params.slug);
  if (!site) notFound();

  const secteur = SECTEURS.find((s) => s.id === site.secteur_id);

  if (!secteur) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <p className="text-sm" style={{ color: T.gris }}>Ce site ne peut pas être affiché pour le moment. Contactez le support si le problème persiste.</p>
      </div>
    );
  }

  if (!estPublie(site)) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: T.rougeFond }}>
          <Clock size={24} color={T.rouge} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: T.encre }}>{site.nom_entreprise}</h2>
        <p className="text-sm" style={{ color: T.gris }}>
          {site.statut === "actif"
            ? "L'abonnement de ce site a expiré. Contactez le propriétaire pour plus d'informations."
            : "Ce site n'est plus publié pour le moment."}
        </p>
      </div>
    );
  }

  // On ne passe JAMAIS l'objet `secteur` en entier ici : il contient des
  // composants d'icône lucide-react (fonctions), et cette page est un
  // Composant Serveur qui rend un Composant Client ("use client" dans
  // SiteDesktop.js) — React ne peut pas sérialiser une fonction à travers
  // cette frontière ("Functions cannot be passed directly to Client
  // Components..."), ce qui provoquait l'erreur 500 vue en production sur
  // ce lien public (digest 417911372). Seul secteurId (une chaîne, donc
  // sérialisable) traverse la frontière ; SiteDesktop retrouve lui-même
  // l'objet secteur complet côté client via lib/data.js.
  return <SiteDesktop secteurId={site.secteur_id} business={businessDepuisSite(site)} paye={site.statut === "actif"} />;
}
