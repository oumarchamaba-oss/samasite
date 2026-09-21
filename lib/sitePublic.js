// Logique partagée entre les pages qui affichent le rendu public d'un site
// (app/site/[token]/page.js et app/s/[slug]/page.js) — un seul endroit pour
// décider si un site est publié et pour construire l'objet "business" que
// SiteDesktop/ApercuSite attendent, afin que les deux pages restent
// TOUJOURS d'accord entre elles (c'est un décalage entre deux copies de
// cette même logique qui avait cassé l'affichage du site la première fois).

// Même règle que estModifiable() dans EditerSite.js — un site n'est publié
// publiquement que si son essai gratuit ou son abonnement payé n'a pas
// dépassé sa date d'expiration. Rien n'écrit cette expiration en base
// automatiquement : elle est donc recalculée ici à chaque affichage.
export function estPublie(site) {
  if (!site) return false;
  const maintenant = new Date();
  if (["essai", "a_livrer"].includes(site.statut)) {
    return site.essai_expire_le && new Date(site.essai_expire_le) > maintenant;
  }
  if (site.statut === "actif") {
    return !site.abonnement_expire_le || new Date(site.abonnement_expire_le) > maintenant;
  }
  return false;
}

// Les composants de rendu (SiteDesktop, ApercuSite) attendent un objet
// "business" en camelCase, construit à l'origine depuis le formulaire de
// création (voir CreerSite.js) — on refait ici exactement le même objet à
// partir des colonnes (snake_case) renvoyées par la base.
export function businessDepuisSite(site) {
  return {
    nom: site.nom_entreprise || "",
    accroche: site.accroche || "",
    whatsapp: site.whatsapp || "",
    adresse: site.adresse || "",
    email: site.email || "",
    banniere: site.banniere_url || null,
    texteBanniere: "",
    lienGoogleMaps: site.lien_google_maps || "",
    logo: site.logo_url || null,
    couleurs: site.couleurs || null,
    produits: site.produits || [],
    reseaux: site.reseaux || {},
    modesLivraison: site.modes_livraison || [],
    metier: site.metier || "",
    metierGroupe: site.metier_groupe || "",
    horaires: site.horaires || null,
  };
}
