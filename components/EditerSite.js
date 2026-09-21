"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, RefreshCw, CheckCircle2, Lock, ArrowRight, Clock, Upload, X, Wallet } from "lucide-react";
import { T, SECTEURS, SECTEUR_COULEURS, RESEAUX_SOCIAUX, MODES_LIVRAISON, paletteIdPour, genererSchema, horairesParDefaut, PRIX_MODIFICATION } from "../lib/data";
import { supabase } from "../lib/supabaseClient";
import EditeurHoraires from "./EditeurHoraires";
import PaiementSite from "./PaiementSite";

// Le site n'est plus modifiable : essai terminé sans paiement, ou abonnement expiré.
function estModifiable(site) {
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

// Redimensionne et compresse une image avant de l'enregistrer, pour éviter tout
// dépassement de délai lié à l'envoi d'une photo trop volumineuse.
function lireImage(file, callback, largeurMax = 1000) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new window.Image();
    img.onload = () => {
      const echelle = Math.min(1, largeurMax / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * echelle);
      canvas.height = Math.round(img.height * echelle);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => callback(e.target.result);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Clé localStorage utilisée pour ne pas perdre les modifications en cours si
// la session expire au moment d'enregistrer (voir enregistrer() ci-dessous).
const CLE_BROUILLON = (siteId) => `sama_site_edition_v1_${siteId}`;

export default function EditerSite({ mode, token, site: siteInitial, onSaved }) {
  const [site, setSite] = useState(siteInitial);
  const [nouveauTexte, setNouveauTexte] = useState("");
  const [nouveauPrix, setNouveauPrix] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const router = useRouter();

  // Si une précédente tentative d'enregistrement a échoué à cause d'une
  // session expirée, les modifications en cours ont été mises de côté ici —
  // on les restaure automatiquement au retour (après reconnexion), pour ne
  // jamais faire retaper le travail déjà fait.
  useEffect(() => {
    if (mode === "token" || typeof window === "undefined" || !siteInitial?.id) return;
    try {
      const brouillon = window.localStorage.getItem(CLE_BROUILLON(siteInitial.id));
      if (!brouillon) return;
      const d = JSON.parse(brouillon);
      setSite((s) => ({ ...s, ...d }));
      window.localStorage.removeItem(CLE_BROUILLON(siteInitial.id));
    } catch {
      // Brouillon corrompu ou illisible : on ignore, rien de perdu côté serveur.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secteur = SECTEURS.find((s) => s.id === site.secteur_id);
  const modifiable = estModifiable(site);
  const couleursSecteur = secteur ? SECTEUR_COULEURS[paletteIdPour(secteur, { metierGroupe: site.metier_groupe })] : [];
  const modesDispo = secteur?.modesLivraison || [];

  const majChamp = (champ, valeur) => setSite((s) => ({ ...s, [champ]: valeur }));
  const majReseau = (id, valeur) => setSite((s) => ({ ...s, reseaux: { ...(s.reseaux || {}), [id]: valeur } }));
  const basculerMode = (modeId) => setSite((s) => {
    const actuels = s.modes_livraison || [];
    const nouveaux = actuels.includes(modeId) ? actuels.filter((m) => m !== modeId) : [...actuels, modeId];
    return { ...s, modes_livraison: nouveaux };
  });

  const ajouterProduit = () => {
    if (!nouveauTexte.trim()) return;
    // id persistant (21/09/2026, parité avec CreerSite.js) : voir demande du
    // 21/09/2026, point 6 — un produit garde le même id de sa création à sa
    // suppression, y compris quand il est modifié plusieurs fois ici.
    majChamp("produits", [...(site.produits || []), { id: crypto.randomUUID(), texte: nouveauTexte, prix: nouveauPrix, categorie: "", image: null, description: "" }]);
    setNouveauTexte(""); setNouveauPrix("");
  };
  const retirerProduit = (i) => majChamp("produits", site.produits.filter((_, idx) => idx !== i));
  const imageProduitEdit = (i, file) => lireImage(file, (dataUrl) => {
    majChamp("produits", site.produits.map((p, idx) => (idx === i ? { ...p, image: dataUrl } : p)));
  });
  const champProduitEdit = (i, champ, valeur) => {
    majChamp("produits", site.produits.map((p, idx) => (idx === i ? { ...p, [champ]: valeur } : p)));
  };

  const messageErreur = (err) => {
    const detail = err?.message || "";
    if (detail.toLowerCase().includes("timeout")) {
      return "Le serveur a mis trop de temps à répondre — c'est généralement temporaire. Réessayez dans quelques secondes.";
    }
    return "Impossible d'enregistrer : " + (detail || "erreur inconnue");
  };

  const enregistrer = async () => {
    setEnregistrement(true);
    setErreur("");
    setSucces(false);
    setSessionExpiree(false);

    const champs = {
      nom_entreprise: site.nom_entreprise,
      contact_nom: site.contact_nom,
      whatsapp: site.whatsapp,
      email: site.email,
      adresse: site.adresse,
      lien_google_maps: site.lien_google_maps,
      accroche: site.accroche,
      logo_url: site.logo_url,
      banniere_url: site.banniere_url,
      couleurs: site.couleurs,
      produits: site.produits,
      reseaux: site.reseaux,
      modes_livraison: site.modes_livraison,
      horaires: site.horaires || horairesParDefaut(),
    };

    const etaitActif = site.statut === "actif";

    let error;
    if (mode === "token") {
      const res = await supabase.rpc("modifier_site_par_jeton", { p_token: token, p_champs: champs });
      error = res.error;
    } else {
      const res = await supabase.rpc("modifier_site_proprietaire", { p_site_id: site.id, p_champs: champs });
      error = res.error;
    }

    setEnregistrement(false);
    if (error) {
      // BUG CORRIGÉ (audit sept. 2026, même cause que la publication d'un
      // nouveau site — voir CreerSite.js) : un enregistrement peut survenir
      // longtemps après le chargement de la page, une fois la session réelle
      // expirée. Pour le parcours "owned" (compte requis), on détecte ce cas
      // précis, on conserve les modifications en cours (au lieu de les
      // perdre) et on propose une reconnexion directe. Le parcours par jeton
      // privé ("token") ne dépend d'aucune session utilisateur : rien à faire
      // de spécial pour lui, l'erreur reste affichée telle quelle.
      if (mode !== "token") {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          try {
            window.localStorage.setItem(CLE_BROUILLON(site.id), JSON.stringify(champs));
          } catch {
            // Stockage local indisponible : tant pis, on affiche quand même
            // le message de reconnexion ci-dessous.
          }
          setSessionExpiree(true);
          setErreur("Votre session a expiré. Reconnectez-vous pour continuer — vos modifications ont été conservées.");
          return;
        }
      }
      setErreur(messageErreur(error));
      return;
    }
    setSucces(true);
    if (onSaved) onSaved(site);

    // Le site était déjà payé et en ligne : la modification vient d'être
    // facturée automatiquement côté base (voir modifier_site_proprietaire()/
    // modifier_site_par_jeton() dans schema.sql). On prévient aussi
    // l'administrateur par e-mail — jamais bloquant : si ça échoue (clé pas
    // encore configurée, réseau...), la modification reste enregistrée.
    if (etaitActif) {
      fetch("/api/notifier-modification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomEntreprise: site.nom_entreprise, siteId: site.id }),
      }).catch(() => {});
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: T.encre }}>Modifier mon site</h2>
        {site.statut === "actif"
          ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: T.vertFond, color: T.vert }}><CheckCircle2 size={11} /> Actif</span>
          : <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: T.jauneFond, color: T.jauneFonce }}><Clock size={11} /> Essai</span>}
      </div>

      {!modifiable && (
        <div className="rounded-2xl p-5 mb-6 flex items-start gap-3" style={{ background: T.rougeFond }}>
          <Lock size={18} color={T.rouge} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: T.rouge }}>Ce site n'est plus modifiable</p>
            <p className="text-xs mt-1" style={{ color: T.gris }}>
              {site.statut === "actif"
                ? "Votre abonnement a expiré. Renouvelez-le pour retrouver l'accès à la modification."
                : "Votre essai gratuit de 2 jours est terminé. Il reste dans votre compte : payez ci-dessous pour le publier, à tout moment."}
            </p>
          </div>
        </div>
      )}

      {!modifiable && mode === "owned" && ["essai", "a_livrer"].includes(site.statut) && (
        <div className="mb-6">
          <PaiementSite site={site} />
        </div>
      )}

      <fieldset disabled={!modifiable} style={{ opacity: modifiable ? 1 : 0.6 }}>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Nom du commerce</label>
        <input value={site.nom_entreprise || ""} onChange={(e) => majChamp("nom_entreprise", e.target.value)}
          className="w-full rounded-xl px-4 py-3 mb-4 text-sm outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />

        <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Numéro WhatsApp</label>
        <input value={site.whatsapp || ""} onChange={(e) => majChamp("whatsapp", e.target.value)}
          className="w-full rounded-xl px-4 py-3 mb-4 text-sm outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />

        <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>E-mail</label>
        <input value={site.email || ""} onChange={(e) => majChamp("email", e.target.value)}
          className="w-full rounded-xl px-4 py-3 mb-4 text-sm outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />

        <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Adresse</label>
        <input value={site.adresse || ""} onChange={(e) => majChamp("adresse", e.target.value)}
          className="w-full rounded-xl px-4 py-3 mb-4 text-sm outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />

        <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Lien Google Maps (facultatif)</label>
        <input value={site.lien_google_maps || ""} onChange={(e) => majChamp("lien_google_maps", e.target.value)}
          className="w-full rounded-xl px-4 py-3 mb-4 text-sm outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />

        <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Accroche</label>
        <input value={site.accroche || ""} onChange={(e) => majChamp("accroche", e.target.value)}
          className="w-full rounded-xl px-4 py-3 mb-5 text-sm outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />

        <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Logo</label>
        <div className="flex items-center gap-3 mb-5">
          {site.logo_url && (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ border: `1.5px solid ${T.bleuClairBord}` }}>
              <img src={site.logo_url} alt="Logo" className="w-full h-full object-contain" />
              <button type="button" onClick={() => majChamp("logo_url", null)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: T.rouge }}>
                <X size={10} color="#fff" />
              </button>
            </div>
          )}
          <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer" style={{ background: T.bleuClair, color: T.bleu }}>
            <Upload size={13} /> {site.logo_url ? "Changer le logo" : "Ajouter un logo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => lireImage(e.target.files[0], (url) => majChamp("logo_url", url))} />
          </label>
        </div>

        <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Bannière</label>
        <div className="flex items-center gap-3 mb-5">
          {site.banniere_url && (
            <div className="relative w-24 h-14 rounded-xl overflow-hidden shrink-0" style={{ border: `1.5px solid ${T.bleuClairBord}` }}>
              <img src={site.banniere_url} alt="Bannière" className="w-full h-full object-cover" />
              <button type="button" onClick={() => majChamp("banniere_url", null)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: T.rouge }}>
                <X size={10} color="#fff" />
              </button>
            </div>
          )}
          <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer" style={{ background: T.bleuClair, color: T.bleu }}>
            <Upload size={13} /> {site.banniere_url ? "Changer la bannière" : "Ajouter une bannière"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => lireImage(e.target.files[0], (url) => majChamp("banniere_url", url), 1400)} />
          </label>
        </div>

        {couleursSecteur.length > 0 && (
          <>
            <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Couleur</label>
            <div className="grid grid-cols-6 gap-2 mb-5">
              {couleursSecteur.map((couleur) => {
                // BUG CORRIGÉ (21/09/2026) : couleursSecteur est un tableau
                // d'objets { id, name, hex } (voir SECTEUR_COULEURS dans
                // lib/data.js), pas de tuples [nom, hex] — la déstructuration
                // en tableau faisait planter toute la page "Gérer ce site"
                // dès qu'un secteur avec des couleurs suggérées était trouvé
                // (un objet n'est pas itérable), avec l'erreur générique
                // "Application error: a client-side exception has occurred".
                const selectionne = site.couleurs?.primaire === couleur.hex;
                return (
                  <button key={couleur.id} type="button" onClick={() => majChamp("couleurs", genererSchema(couleur.hex))}
                    className="w-9 h-9 rounded-full" title={couleur.name}
                    style={{ background: couleur.hex, boxShadow: selectionne ? `0 0 0 2px #fff, 0 0 0 4px ${couleur.hex}` : "none" }} />
                );
              })}
            </div>
          </>
        )}

        {modesDispo.length > 0 && (
          <>
            <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Modes de commande proposés</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {modesDispo.map((modeId) => {
                const m = MODES_LIVRAISON[modeId];
                const actif = (site.modes_livraison || []).includes(modeId);
                return (
                  <button key={modeId} type="button" onClick={() => basculerMode(modeId)}
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold"
                    style={{ background: actif ? T.bleu : T.bleuClair, color: actif ? "#fff" : T.bleu }}>
                    <m.icon size={13} /> {m.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Réseaux sociaux (facultatif)</label>
        <div className="space-y-2 mb-5">
          {RESEAUX_SOCIAUX.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-xl px-3.5" style={{ border: `1.5px solid ${T.bleuClairBord}` }}>
              <r.icon size={15} color={T.gris} />
              <input value={site.reseaux?.[r.id] || ""} onChange={(e) => majReseau(r.id, e.target.value)} placeholder={`Lien ${r.label}`}
                className="flex-1 py-2.5 text-sm outline-none bg-transparent" style={{ color: T.encre }} />
            </div>
          ))}
        </div>

        <EditeurHoraires horaires={site.horaires || horairesParDefaut()} onChange={(h) => majChamp("horaires", h)} />

        <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Produits / services</label>
        <div className="flex gap-2 mb-3">
          <input value={nouveauTexte} onChange={(e) => setNouveauTexte(e.target.value)} placeholder="Nom du produit"
            className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />
          <input value={nouveauPrix} onChange={(e) => setNouveauPrix(e.target.value)} placeholder="Prix"
            className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />
          <button type="button" onClick={ajouterProduit} className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: T.bleu }}><Plus size={18} /></button>
        </div>
        {/* Parité avec l'étape 3 de CreerSite.js (21/09/2026, point 5) : ici
            aussi, on peut ajouter une photo, une catégorie et une description
            à un produit déjà créé, sans devoir recréer le site. */}
        <div className="space-y-2 mb-6">
          {(site.produits || []).map((item, i) => (
            <div key={item.id || i} className="rounded-lg p-2.5" style={{ background: T.bleuClair }}>
              <div className="flex items-center gap-2.5">
                <label className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center cursor-pointer" style={{ background: item.image ? "transparent" : T.blanc, border: `1px dashed ${T.bleuClairBord}` }}>
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <Upload size={13} color={T.gris} />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => imageProduitEdit(i, e.target.files[0])} />
                </label>
                <span className="text-sm flex-1" style={{ color: T.encre }}>{item.texte}</span>
                <button type="button" onClick={() => retirerProduit(i)}><Trash2 size={14} color={T.gris} /></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <input value={item.prix || ""} onChange={(e) => champProduitEdit(i, "prix", e.target.value)} placeholder="Prix"
                  className="rounded-lg px-3 py-2 text-xs outline-none" style={{ background: T.blanc, border: `1px solid ${T.bleuClairBord}` }} />
                <input value={item.categorie || ""} onChange={(e) => champProduitEdit(i, "categorie", e.target.value)} placeholder="Catégorie"
                  className="rounded-lg px-3 py-2 text-xs outline-none" style={{ background: T.blanc, border: `1px solid ${T.bleuClairBord}` }} />
              </div>
              <input value={item.description || ""} onChange={(e) => champProduitEdit(i, "description", e.target.value)}
                placeholder="Description détaillée (facultative)"
                className="w-full mt-1.5 rounded-lg px-3 py-2 text-xs outline-none" style={{ background: T.blanc, border: `1px solid ${T.bleuClairBord}` }} />
            </div>
          ))}
        </div>

        {modifiable && site.statut === "actif" && (
          <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: T.gris }}>
            <Wallet size={13} className="shrink-0" /> Votre site est déjà en ligne : chaque enregistrement ci-dessous vous sera facturé {PRIX_MODIFICATION.toLocaleString("fr-FR")} F.
          </p>
        )}

        {erreur && <p className="text-xs mb-3" style={{ color: T.rouge }}>{erreur}</p>}
        {sessionExpiree && (
          <button type="button" onClick={() => router.push(`/connexion?retour=${encodeURIComponent(`/mon-espace/${site.id}`)}`)}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mb-3" style={{ background: T.jaune, color: T.bleuFonce }}>
            Se reconnecter <ArrowRight size={15} />
          </button>
        )}
        {succes && (
          <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: T.vert }}>
            <CheckCircle2 size={13} />
            {site.statut === "actif"
              ? `Enregistré avec succès — ${PRIX_MODIFICATION.toLocaleString("fr-FR")} F ajoutés à votre facturation.`
              : "Enregistré avec succès."}
          </p>
        )}

        <button type="button" onClick={enregistrer} disabled={enregistrement}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold disabled:opacity-50" style={{ background: T.bleu, color: T.blanc }}>
          {enregistrement ? <><RefreshCw size={16} className="animate-spin" /> Enregistrement…</> : "Enregistrer les modifications"}
        </button>
      </fieldset>

      {!modifiable && site.statut === "actif" && (
        <button onClick={() => router.push("/espace")} className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold" style={{ background: T.jaune, color: T.bleuFonce }}>
          Voir les options de renouvellement <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
