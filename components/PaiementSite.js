"use client";
import { useState } from "react";
import { Link2, Wallet, RefreshCw } from "lucide-react";
import { T, DOMAINES, DUREES, PRIX, PAIEMENTS, WHATSAPP_SUPPORT } from "../lib/data";
import { supabase } from "../lib/supabaseClient";

// Formulaire de paiement pour un site EXISTANT, réutilisable depuis le compte
// du client — notamment pour un site en essai dont les 2 jours sont dépassés
// sans avoir été payé : le site reste dans son compte (voir MonEspace.js et
// EditerSite.js), et ce formulaire est le moyen de le payer pour le publier,
// à tout moment, même après coup. Reprend exactement la même mécanique que
// l'étape 5 de CreerSite.js (soumettre_paiement_manuel), mais à partir d'un
// site déjà existant plutôt que d'un site en cours de création.
export default function PaiementSite({ site, onPaye }) {
  const [extensionDomaine, setExtensionDomaine] = useState(null);
  const [duree, setDuree] = useState(null);
  const [domaineDemande, setDomaineDemande] = useState("");
  const [methodePaiement, setMethodePaiement] = useState(null);
  const [contactNom, setContactNom] = useState(site.contact_nom || "");
  const [traitement, setTraitement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [soumis, setSoumis] = useState(false);

  const messageErreur = (err) => {
    const detail = err?.message || "";
    if (detail.toLowerCase().includes("timeout")) {
      return "Le serveur a mis trop de temps à répondre. Réessayez dans quelques secondes.";
    }
    return "Impossible d'enregistrer : " + (detail || "erreur inconnue");
  };

  const soumettre = async () => {
    setTraitement(true);
    setErreur("");
    const slug = (site.nom_entreprise || "moncommerce").toLowerCase().replace(/\s+/g, "");
    const { error } = await supabase.rpc("soumettre_paiement_manuel", {
      p_site_id: site.id,
      p_contact_nom: contactNom,
      p_extension: extensionDomaine,
      p_duree: duree,
      p_montant: PRIX[extensionDomaine][duree],
      p_moyen_paiement: methodePaiement,
      p_domaine: domaineDemande || `${slug}.${extensionDomaine}`,
    });
    setTraitement(false);
    if (error) { setErreur(messageErreur(error)); return; }
    setSoumis(true);
    if (onPaye) onPaye();
  };

  if (soumis) {
    return (
      <div className="rounded-2xl p-5" style={{ background: T.vertFond, border: "1.5px solid #B7E4C7" }}>
        <p className="text-sm font-semibold mb-2" style={{ color: T.encre }}>Commande enregistrée</p>
        <p className="text-xs mb-4" style={{ color: T.gris }}>
          Il ne reste qu'une étape : envoyez <strong style={{ color: T.encre }}>{PRIX[extensionDomaine][duree].toLocaleString("fr-FR")} F</strong> via <strong style={{ color: T.encre }}>{PAIEMENTS[methodePaiement]?.label}</strong>, en indiquant le nom de votre commerce en référence. Dès réception, votre site est activé.
        </p>
        <a href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(`Bonjour, je viens de commander mon site "${site.nom_entreprise}" et je vous envoie la preuve de paiement.`)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full text-sm font-bold" style={{ background: "#25D366", color: "#fff" }}>
          Envoyer ma preuve de paiement sur WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
      <p className="text-sm font-semibold mb-1" style={{ color: T.encre }}>Payer pour publier ce site</p>
      <p className="text-xs mb-4" style={{ color: T.gris }}>Votre site reste dans votre compte — payez à tout moment pour l'activer avec votre propre nom de domaine.</p>

      <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Extension du domaine</label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {DOMAINES.map((d) => {
          const selected = extensionDomaine === d.id;
          return (
            <button key={d.id} type="button" onClick={() => setExtensionDomaine(d.id)} className="text-left rounded-xl p-3" style={{ background: T.blanc, border: `2px solid ${selected ? T.bleu : T.bleuClairBord}` }}>
              <div className="font-bold text-sm" style={{ color: T.encre }}>{d.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: T.gris }}>{d.note}</div>
            </button>
          );
        })}
      </div>

      {extensionDomaine && (
        <>
          <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Durée</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {DUREES.map((d) => {
              const selected = duree === d.id;
              const prix = PRIX[extensionDomaine][d.id];
              return (
                <button key={d.id} type="button" onClick={() => setDuree(d.id)} className="text-left rounded-xl p-3" style={{ background: T.blanc, border: `2px solid ${selected ? T.bleu : T.bleuClairBord}` }}>
                  <div className="font-bold text-sm" style={{ color: T.encre }}>{d.label}</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: T.bleu }}>{prix.toLocaleString("fr-FR")} F</div>
                </button>
              );
            })}
          </div>

          <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Nom de domaine souhaité</label>
          <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 mb-4" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
            <Link2 size={14} color={T.gris} />
            <input value={domaineDemande} onChange={(e) => setDomaineDemande(e.target.value)}
              placeholder={`${(site.nom_entreprise || "moncommerce").toLowerCase().replace(/\s+/g, "")}.${extensionDomaine}`}
              className="text-sm outline-none flex-1 bg-transparent" />
          </div>
        </>
      )}

      {duree && (
        <>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Votre nom complet</label>
          <input value={contactNom} onChange={(e) => setContactNom(e.target.value)} placeholder="Votre nom complet"
            className="w-full rounded-xl px-3.5 py-2.5 mb-4 text-sm outline-none" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }} />

          <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Moyen de paiement</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Object.entries(PAIEMENTS).map(([id, p]) => {
              const Icon = p.icon;
              const selected = methodePaiement === id;
              return (
                <button key={id} type="button" onClick={() => setMethodePaiement(id)} className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-1"
                  style={{ background: selected ? p.bg : T.blanc, border: `2px solid ${selected ? p.color : T.bleuClairBord}` }}>
                  <Icon size={18} color={p.color} strokeWidth={2} />
                  <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: T.encre }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {erreur && <p className="text-xs font-medium mb-3" style={{ color: T.rouge }}>{erreur}</p>}

      <button disabled={!duree || !methodePaiement || !contactNom || traitement}
        onClick={soumettre}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold disabled:opacity-30" style={{ background: T.bleu, color: T.blanc }}>
        {traitement ? (<><RefreshCw size={15} className="animate-spin" /> Enregistrement…</>) : (<><Wallet size={15} /> J'ai déjà envoyé l'argent</>)}
      </button>
    </div>
  );
}
