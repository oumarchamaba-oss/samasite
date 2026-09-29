// Route serveur — incrémente le compteur de clics WhatsApp d'un site public
// (preuve sociale, audit sept. 2026). Appelée en tâche de fond depuis
// SiteDesktop.js (voir suivreClicWhatsapp()) : ne bloque jamais l'ouverture
// du lien WhatsApp lui-même, et son échec n'est jamais visible du client.
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erreur: "Requête invalide." }, { status: 400 });
  }

  const { slug } = body || {};
  if (!slug || typeof slug !== "string") {
    return Response.json({ erreur: "Slug manquant." }, { status: 400 });
  }

  const { error } = await supabase.rpc("incrementer_clic_whatsapp", { p_slug: slug });
  if (error) {
    console.warn("clic-whatsapp: échec incrément", error.message);
    return Response.json({ ok: false });
  }
  return Response.json({ ok: true });
}
