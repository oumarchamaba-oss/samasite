import { supabase } from "../../../lib/supabaseClient";
import { iconesDepuisLogo } from "../../../lib/sitePublic";

// app/site/[token]/page.js est un Composant Client ("use client", session-
// aware) : il ne peut donc pas exporter generateMetadata lui-même — seul un
// Composant Serveur le peut. Ce layout ne sert qu'à ça : personnaliser
// l'icône d'onglet du navigateur avec le logo du commerce (même logique que
// app/s/[slug]/page.js pour le lien public court, voir lib/sitePublic.js).
// Il ne rend rien de plus que la page elle-même.
export async function generateMetadata({ params }) {
  const { data } = await supabase.rpc("obtenir_site_par_jeton", { p_token: params.token });
  const icons = iconesDepuisLogo(data?.[0]?.logo_url);
  return icons ? { icons } : {};
}

export default function LayoutSiteParJeton({ children }) {
  return children;
}
