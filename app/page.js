import { supabase } from "../lib/supabaseClient";
import { SECTEURS } from "../lib/data";
import NavPublic from "../components/NavPublic";
import Accueil from "../components/Accueil";

// Régénère la page au maximum toutes les 5 minutes plutôt qu'à chaque
// visite : la liste "Ils ont créé leur site avec Sama Site" ne change pas
// assez souvent pour justifier un aller-retour Supabase à chaque requête.
export const revalidate = 300;

// Page serveur : va chercher les vrais sites en base pour la section
// "Ils ont créé leur site avec Sama Site" (mise à jour automatique).
// Passe par la fonction sites_publics() (voir supabase/schema.sql), qui
// n'expose jamais les coordonnées des clients — seulement nom, secteur, statut.
export default async function Home() {
  const { data: sites } = await supabase.rpc("sites_publics");

  // Remis au format attendu par le composant Accueil (issu du prototype).
  const clients = (sites || []).map((s) => ({
    nom: s.nom_entreprise,
    secteurId: s.secteur_id,
    secteur: SECTEURS.find((sec) => sec.id === s.secteur_id)?.label || "",
    statut: s.statut,
  }));

  return (
    <div>
      <NavPublic />
      <Accueil clients={clients} />
    </div>
  );
}
