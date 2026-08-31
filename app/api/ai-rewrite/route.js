// Route serveur — ne s'exécute jamais dans le navigateur du client.
// C'est ici, et seulement ici, que la clé ANTHROPIC_API_KEY est utilisée :
// elle n'est donc jamais visible ni exposée côté client.
export async function POST(request) {
  const { entreprise, secteurLabel, champLabel, texte, consigne } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { erreur: "L'assistant IA n'est pas configuré (ANTHROPIC_API_KEY manquante côté serveur)." },
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

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return Response.json({ erreur: "Erreur de l'API Anthropic : " + detail }, { status: 502 });
    }

    const data = await response.json();
    const resultat = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim()
      .replace(/^"|"$/g, "");

    if (!resultat) {
      return Response.json({ erreur: "Réponse vide de l'IA." }, { status: 502 });
    }

    return Response.json({ resultat });
  } catch (e) {
    return Response.json({ erreur: "Impossible de joindre l'assistant IA." }, { status: 500 });
  }
}
