import { supabase } from "../lib/supabaseClient";
import { SECTEURS } from "../lib/data";
import NavPublic from "../components/NavPublic";
import Accueil from "../components/Accueil";

// Page serveur : va chercher les vrais sites en base pour la section
// "Ils ont créé leur site avec Sama Site" (mise à jour automatique).
export default async function Home() {
  const { data: sites } = await supabase
    .from("sites")
    .select("nom_entreprise, secteur_id, statut")
    .neq("statut", "expire")
    .order("created_at", { ascending: false })
    .limit(30);

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
