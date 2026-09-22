// Route serveur — ne s'exécute jamais dans le navigateur.
// C'est ici, et seulement ici, que la clé de service Supabase
// (SUPABASE_SERVICE_ROLE_KEY) est utilisée pour lire la clé API Versus d'un
// site dans sama_site.paiements_boutique_config — une table volontairement
// SANS AUCUN grant à anon/authenticated (voir
// supabase/migration_selfhosted_20260922_paiement_en_ligne.sql). Cette clé
// de service ne doit JAMAIS apparaître dans du code exécuté côté client.
//
// Tant que la documentation d'API de Versus Finances Tech n'a pas été
// fournie, cette route valide simplement que le site a bien le paiement en
// ligne actif, puis renvoie "automatique: false" — voir la grande zone
// commentée plus bas pour l'endroit exact où brancher le vrai appel API.

import { createClient } from "@supabase/supabase-js";

function clientServeur() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cleService) return null;
  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "public";
  return createClient(url, cleService, { db: { schema } });
}

export async function POST(request) {
  const { slug, produitId, produitTexte, montant, moyenPaiement } = await request.json();

  if (!slug) {
    return Response.json({ erreur: "Site manquant." }, { status: 400 });
  }

  const supabaseServeur = clientServeur();
  if (!supabaseServeur) {
    console.error("[paiement-boutique] SUPABASE_SERVICE_ROLE_KEY est absente ou vide côté serveur.");
    return Response.json({ automatique: false, lienPaiement: null, reference: null });
  }

  // 1) Le site existe, est bien payé (actif) et a le paiement en ligne actif ?
  const { data: site, error: erreurSite } = await supabaseServeur
    .from("sites")
    .select("id, statut, paiement_en_ligne_actif")
    .eq("slug", slug)
    .is("supprime_le", null)
    .maybeSingle();

  if (erreurSite || !site || site.statut !== "actif" || !site.paiement_en_ligne_actif) {
    return Response.json({ automatique: false, lienPaiement: null, reference: null });
  }

  // 2) Clé API Versus propre à ce site (jamais renvoyée au client).
  const { data: config } = await supabaseServeur
    .from("paiements_boutique_config")
    .select("api_key, fournisseur")
    .eq("site_id", site.id)
    .maybeSingle();

  if (!config?.api_key) {
    return Response.json({ automatique: false, lienPaiement: null, reference: null });
  }

  // --- ZONE À REMPLACER quand la documentation d'API Versus sera fournie ---
  //
  // Exemple (à adapter au vrai contrat Versus Finances Tech) :
  // const reponse = await fetch("https://api.Versus.sn/v1/paiements", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${config.api_key}`,
  //   },
  //   body: JSON.stringify({
  //     montant,
  //     devise: "XOF",
  //     moyen: moyenPaiement, // orange_money | wave | free_money | visa | mastercard
  //     reference: `${site.id}-${produitId}-${Date.now()}`,
  //     description: produitTexte,
  //   }),
  // });
  // const data = await reponse.json();
  // return Response.json({
  //   automatique: true,
  //   lienPaiement: data.lien_paiement,
  //   reference: data.reference,
  // });
  //
  // --- FIN DE LA ZONE À REMPLACER ---

  return Response.json({ automatique: false, lienPaiement: null, reference: null });
}
