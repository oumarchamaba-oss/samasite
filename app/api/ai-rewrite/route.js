// Route serveur — ne s'exécute jamais dans le navigateur du client.
// C'est ici, et seulement ici, que la clé GEMINI_API_KEY est utilisée :
// elle n'est donc jamais visible ni exposée côté client.

// Limite de fréquence simple, par IP, en mémoire : évite qu'un script
// (ou un abus) épuise le quota gratuit Gemini (1500 requêtes/jour) en
// appelant cette route en boucle, sans passer par l'interface.
// Limite volontaire : cette protection se réinitialise à chaque redémarrage
// de la fonction serverless (Vercel) — elle ralentit les abus grossiers,
// ce n'est pas une protection parfaite. Si les abus persistent malgré
// cette limite, remplacer par Vercel KV / Upstash Redis (partagé entre
// toutes les instances serverless).
const appelsParIp = new Map();
const LIMITE_APPELS = 10;
const FENETRE_MS = 60 * 60 * 1000; // 1 heure

function estAutorise(ip) {
  const maintenant = Date.now();
  const historique = (appelsParIp.get(ip) || []).filter((t) => maintenant - t < FENETRE_MS);
  if (historique.length >= LIMITE_APPELS) {
    appelsParIp.set(ip, historique);
    return false;
  }
  historique.push(maintenant);
  appelsParIp.set(ip, historique);
  return true;
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";
  if (!estAutorise(ip)) {
    return Response.json(
      { erreur: "Trop de requêtes envoyées à l'assistant IA. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const { entreprise, secteurLabel, champLabel, texte, consigne } = await request.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[ai-rewrite] GEMINI_API_KEY est absente ou vide côté serveur.");
    return Response.json(
      { erreur: "L'assistant IA n'est pas configuré (GEMINI_API_KEY manquante côté serveur)." },
      { status: 500 }
    );
  }

  const prompt = `Tu es un rédacteur publicitaire senior spécialisé dans les petites entreprises sénégalaises.

Entreprise : ${entreprise || "cette entreprise"}
Secteur d'activité : ${secteurLabel}
Ce texte apparaît : ${champLabel}

Texte actuel : ${texte && texte.trim() ? `"${texte}"` : "(vide, à créer entièrement)"}

Consigne : ${consigne}

Règles strictes :
- Ne jamais inventer de chiffres, prix, avis clients, certifications ou informations non fournies.
- Rester en français, ton naturel adapté à une petite entreprise au Sénégal.
- Réponds UNIQUEMENT avec le texte final, sans guillemets, sans explication, sans préambule.`;

  // Modèle gratuit chez Google. Google fait évoluer régulièrement les noms de
  // modèles disponibles sur le tarif gratuit — si ce modèle venait à disparaître
  // à son tour, l'erreur renvoyée par Gemini indique généralement directement
  // le nom du modèle de remplacement à utiliser (voir aussi ai.google.dev).
  const modele = "gemini-3.6-flash";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300 },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("[ai-rewrite] Gemini a répondu avec une erreur (statut " + response.status + ") :", detail);
      return Response.json({ erreur: "Erreur de l'API Gemini : " + detail }, { status: 502 });
    }

    const data = await response.json();
    const resultat = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("\n")
      .trim()
      .replace(/^"|"$/g, "");

    if (!resultat) {
      return Response.json({ erreur: "Réponse vide de l'IA." }, { status: 502 });
    }

    return Response.json({ resultat });
  } catch (e) {
    console.error("[ai-rewrite] Exception lors de l'appel à Gemini :", e);
    return Response.json({ erreur: "Impossible de joindre l'assistant IA." }, { status: 500 });
  }
}
