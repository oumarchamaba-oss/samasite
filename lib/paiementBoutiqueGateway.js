// ============================================================
// Passerelle de paiement — Boutique (paiement en ligne des clients finaux)
// ============================================================
// À NE PAS CONFONDRE avec lib/paiementGateway.js : celui-ci gère le paiement
// du CLIENT SAMA SITE pour SON site (l'abonnement). Ce fichier-ci gère le
// paiement des CLIENTS FINAUX d'un commerçant pour SES produits/services,
// via le fournisseur Versus Finances Tech (choisi le 22/09/2026). L'argent va
// directement sur le compte marchand du commerçant chez Versus — jamais sur
// un compte Sama Site.
//
// Aujourd'hui : aucune documentation d'API Versus n'a encore été fournie.
// Cette fonction est donc, comme paiementGateway.js, un appel à une route
// serveur qui renvoie systématiquement "automatique: false" tant que le vrai
// contrat d'API (endpoints, authentification, format de requête/réponse,
// webhook de confirmation) n'est pas connu. Le reste du parcours client
// (SiteDesktop.js, genererFichierSite.js) est déjà écrit comme si l'API
// existait, et se rabat proprement sur la commande WhatsApp existante
// lorsque "automatique" vaut false — jamais de fausse confirmation de
// paiement affichée à un client final.
//
// Le jour où Oumar fournit la documentation Versus, seule la route serveur
// app/api/paiement-boutique/initier/route.js doit être complétée — rien
// d'autre dans l'application n'aura besoin de changer.

export async function initierPaiementBoutique({ slug, produitId, produitTexte, montant, moyenPaiement }) {
  try {
    const reponse = await fetch("/api/paiement-boutique/initier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, produitId, produitTexte, montant, moyenPaiement }),
    });
    if (!reponse.ok) {
      return { automatique: false, lienPaiement: null, reference: null };
    }
    const data = await reponse.json();
    return {
      automatique: !!data.automatique,
      lienPaiement: data.lienPaiement || null,
      reference: data.reference || null,
    };
  } catch {
    // Réseau indisponible, route pas encore déployée, etc. : on ne bloque
    // jamais le client final, il garde toujours la commande WhatsApp.
    return { automatique: false, lienPaiement: null, reference: null };
  }
}

// Moyens de paiement affichés côté boutique (icônes/labels uniquement — la
// disponibilité réelle dépend de ce que Versus active pour ce commerçant).
export const MOYENS_PAIEMENT_BOUTIQUE = [
  { id: "orange_money", label: "Orange Money" },
  { id: "wave", label: "Wave" },
  { id: "free_money", label: "Free Money" },
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
];
