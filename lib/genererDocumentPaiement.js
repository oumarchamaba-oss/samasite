import { SECTEURS, DOMAINES, DUREES, PAIEMENTS, PRIX } from "./data";

const esc = (value = "") => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Référence lisible et unique dérivée de l'identifiant du site et de sa date de commande.
function reference(site, prefixe) {
  const courte = String(site.id).replace(/-/g, "").slice(0, 6).toUpperCase();
  const date = new Date(site.created_at || Date.now());
  return `${prefixe}-${date.getFullYear()}-${courte}`;
}

function ligneMontant(site) {
  const secteur = SECTEURS.find((s) => s.id === site.secteur_id);
  const ext = DOMAINES.find((d) => d.id === site.extension)?.label || site.extension || "";
  const dur = DUREES.find((d) => d.id === site.duree)?.label || site.duree || "";
  return `Création et hébergement de site Sama Site (${secteur?.label || site.secteur_id}) — domaine ${ext}, ${dur}`;
}

function gabaritDocument({ titre, refDoc, site, statutPaiement }) {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const moyen = PAIEMENTS[site.moyen_paiement]?.label || "Non renseigné";
  const montant = site.montant ? site.montant.toLocaleString("fr-FR") + " F CFA" : "—";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${titre} ${refDoc}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #0F172A; padding: 48px; max-width: 720px; margin: 0 auto; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 32px; }
  .marque { font-size: 22px; font-weight: 800; color: #2563EB; }
  .marque small { display: block; font-size: 12px; font-weight: 500; color: #64748B; margin-top: 2px; }
  .titre-doc { text-align: right; }
  .titre-doc h1 { font-size: 20px; margin: 0; }
  .titre-doc p { font-size: 12px; color: #64748B; margin: 4px 0 0; }
  .infos { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 32px; }
  .bloc h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; margin: 0 0 6px; }
  .bloc p { margin: 0; font-size: 14px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748B; border-bottom: 1.5px solid #E2E8F0; padding: 8px 0; }
  td { padding: 14px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
  .montant-total { display: flex; justify-content: flex-end; gap: 24px; align-items: center; margin-bottom: 32px; }
  .montant-total .valeur { font-size: 22px; font-weight: 800; color: #2563EB; }
  .statut { display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  .statut.paye { background: #EFFCF3; color: #16A34A; }
  .statut.attente { background: #FEF9E7; color: #92650A; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; }
  .no-print { text-align: center; margin-top: 24px; }
  .no-print button { background: #2563EB; color: white; border: none; padding: 10px 24px; border-radius: 999px; font-weight: 700; cursor: pointer; font-size: 14px; }
  @media print { .no-print { display: none; } body { padding: 0; } }
</style>
</head>
<body>
  <div class="entete">
    <div class="marque">Sama Site<small>Dakar, Sénégal — samasite.online</small></div>
    <div class="titre-doc">
      <h1>${titre}</h1>
      <p>Réf. ${refDoc} · ${date}</p>
    </div>
  </div>

  <div class="infos">
    <div class="bloc">
      <h3>Émis par</h3>
      <p><strong>Sama Site</strong><br>Dakar, Sénégal<br>contact@samasite.online</p>
    </div>
    <div class="bloc">
      <h3>Client</h3>
      <p><strong>${esc(site.nom_entreprise)}</strong><br>${esc(site.contact_nom)}<br>${esc(site.whatsapp)}${site.email ? " · " + esc(site.email) : ""}</p>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th style="text-align:right;">Montant</th></tr></thead>
    <tbody>
      <tr><td>${ligneMontant(site)}</td><td style="text-align:right;">${montant}</td></tr>
    </tbody>
  </table>

  <div class="montant-total">
    <span>Total</span>
    <span class="valeur">${montant}</span>
  </div>

  <div class="infos">
    <div class="bloc">
      <h3>Moyen de paiement</h3>
      <p>${moyen}</p>
    </div>
    <div class="bloc">
      <h3>Statut</h3>
      <p><span class="statut ${statutPaiement === "payé" ? "paye" : "attente"}">${statutPaiement === "payé" ? "Payé" : "En attente de paiement"}</span></p>
    </div>
  </div>

  <footer>Document généré automatiquement par le tableau de bord Sama Site.</footer>

  <div class="no-print"><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>
</body>
</html>`;
}

export function genererFacture(site) {
  return gabaritDocument({
    titre: "Facture",
    refDoc: reference(site, "FAC"),
    site,
    statutPaiement: site.paiement_confirme ? "payé" : "attente",
  });
}

export function genererRecu(site) {
  return gabaritDocument({
    titre: "Reçu de paiement",
    refDoc: reference(site, "REC"),
    site,
    statutPaiement: "payé",
  });
}

// Facture envoyée AVANT le renouvellement, pour demander le paiement — jamais
// "payé" même si le site est toujours "actif" (paiement_confirme reste vrai
// depuis l'abonnement en cours, ce n'est pas le renouvellement en lui-même).
// Le montant reflète le tarif actuel pour la même formule (extension + durée)
// que le site a déjà, au cas où les prix auraient changé depuis le dernier
// paiement — pas l'ancien montant historique stocké sur le site.
export function genererFactureRenouvellement(site) {
  const montant = PRIX[site.extension]?.[site.duree] ?? site.montant;
  return gabaritDocument({
    titre: "Facture de renouvellement",
    refDoc: reference(site, "REN"),
    site: { ...site, montant },
    statutPaiement: "attente",
  });
}

export function ouvrirDocument(html) {
  const fenetre = window.open("", "_blank");
  if (!fenetre) return; // bloqueur de pop-up
  fenetre.document.write(html);
  fenetre.document.close();
}
