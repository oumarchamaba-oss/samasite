// Route serveur — envoie un e-mail à l'administrateur quand un client modifie
// un site déjà payé et en ligne ("actif"). Ne s'exécute jamais dans le
// navigateur du client : c'est ici, et seulement ici, que la clé
// RESEND_API_KEY est utilisée (jamais exposée côté client).
//
// Utilise l'API HTTP de Resend directement (pas de SDK npm à installer) :
// https://resend.com/docs/api-reference/emails/send-email
//
// Configuration requise (voir .env.local / variables d'environnement Vercel) :
//   RESEND_API_KEY           — clé API créée sur https://resend.com (compte gratuit,
//                               100 e-mails/jour). Oumar doit créer ce compte
//                               lui-même — impossible pour Claude de le faire à sa place.
//   RESEND_FROM (optionnel)  — adresse d'expédition vérifiée sur Resend.
//                               Par défaut : "Sama Site <onboarding@resend.dev>"
//                               (adresse de test fournie par Resend, qui fonctionne
//                               sans domaine vérifié, mais uniquement pour vous
//                               envoyer des e-mails à VOUS-même).
//   ADMIN_NOTIFICATION_EMAIL (optionnel) — par défaut oumarchamaba@gmail.com.
//
// Tant que RESEND_API_KEY n'est pas configurée, cette route ne fait rien
// (ne bloque jamais l'enregistrement de la modification côté client — voir
// EditerSite.js, l'appel est "fire and forget").
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erreur: "Requête invalide." }, { status: 400 });
  }

  const { nomEntreprise, siteId } = body || {};
  if (!nomEntreprise || !siteId) {
    return Response.json({ erreur: "Paramètres manquants." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Pas encore configuré : on le note côté serveur (visible dans les logs
    // Vercel) mais on ne fait jamais échouer l'appel — l'e-mail est une
    // notification "en plus", jamais bloquante pour le client.
    console.warn("notifier-modification: RESEND_API_KEY non configurée, e-mail non envoyé.");
    return Response.json({ envoye: false, raison: "RESEND_API_KEY non configurée" });
  }

  const destinataire = process.env.ADMIN_NOTIFICATION_EMAIL || "oumarchamaba@gmail.com";
  const expediteur = process.env.RESEND_FROM || "Sama Site <onboarding@resend.dev>";

  try {
    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: expediteur,
        to: [destinataire],
        subject: `Modification à facturer — ${nomEntreprise}`,
        text:
          `Le client "${nomEntreprise}" vient de modifier son site (déjà payé et en ligne).\n\n` +
          `Une facturation de 500 F a été enregistrée automatiquement — retrouvez-la dans ` +
          `l'onglet "Abonnements actifs" de votre tableau de bord.\n\n` +
          `Identifiant du site : ${siteId}`,
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text().catch(() => "");
      console.warn("notifier-modification: échec envoi Resend", reponse.status, detail);
      return Response.json({ envoye: false, raison: `Resend a répondu ${reponse.status}` });
    }

    return Response.json({ envoye: true });
  } catch (err) {
    console.warn("notifier-modification: erreur réseau", err?.message);
    return Response.json({ envoye: false, raison: "erreur réseau" });
  }
}
