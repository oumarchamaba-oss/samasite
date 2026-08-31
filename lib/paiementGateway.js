// ============================================================
// Passerelle de paiement — Sama Site
// ============================================================
// Aujourd'hui : aucun fournisseur (Wave for Business, CinetPay, PayTech...) n'est
// encore branché. Cette fonction simule ce que ferait un vrai appel API, pour que
// le reste du code (parcours client + dashboard) soit déjà écrit comme si l'API
// existait. Le jour où vous fournissez une vraie clé API, il suffira de remplacer
// le corps de cette seule fonction — rien d'autre dans l'application n'aura besoin
// de changer.
//
// Ce que ferait un vrai appel API à cet endroit :
//   1) Créer une "intention de paiement" chez le fournisseur (Wave/CinetPay/PayTech).
//   2) Recevoir en retour une URL de paiement à laquelle rediriger le client,
//      et une référence de transaction à conserver.
//   3) Le fournisseur appelle ensuite votre serveur (webhook) quand le client a
//      réellement payé, ce qui confirme automatiquement la ligne "paiements".
//
// En attendant : on crée la ligne "paiements" avec le statut "en_attente" et on
// laisse l'admin la confirmer manuellement dans le dashboard une fois l'argent
// reçu (Wave, Orange Money, virement...).

export async function demarrerPaiement({ montant, moyenPaiement, siteId, description }) {
  // --- ZONE À REMPLACER quand l'API réelle sera fournie ---
  //
  // Exemple (CinetPay) :
  // const reponse = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     apikey: process.env.CINETPAY_API_KEY,
  //     site_id: process.env.CINETPAY_SITE_ID,
  //     transaction_id: siteId + "-" + Date.now(),
  //     amount: montant,
  //     currency: "XOF",
  //     description,
  //   }),
  // });
  // const data = await reponse.json();
  // return { lienPaiement: data.data.payment_url, reference: data.data.token, automatique: true };
  //
  // --- FIN DE LA ZONE À REMPLACER ---

  return {
    lienPaiement: null, // pas de vraie redirection tant qu'aucune API n'est branchée
    reference: null,
    automatique: false, // false = confirmation manuelle par l'admin ; true = confirmée par l'API/webhook
  };
}

// Sera appelée automatiquement par le webhook du fournisseur, une fois branché,
// pour confirmer un paiement sans intervention de l'admin. Pour l'instant, seule
// la confirmation manuelle (bouton du dashboard) est utilisée.
export async function confirmerPaiementAutomatique(referenceTransaction) {
  throw new Error(
    "Aucune API de paiement n'est encore branchée. Confirmez les paiements manuellement depuis le dashboard en attendant."
  );
}
