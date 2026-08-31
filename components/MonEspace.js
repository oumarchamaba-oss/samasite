"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Clock, CheckCircle2, ArrowRight, Globe, Link2, Edit3, RefreshCw } from "lucide-react";
import { T, SECTEURS, DOMAINES, DUREES, PRIX, WHATSAPP_SUPPORT, WHATSAPP_AVATAR, Badge } from "../lib/data";
import { supabase } from "../lib/supabaseClient";

export default function MonEspace() {
  const [site, setSite] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [renouvele, setRenouvele] = useState(false);
  const [upgradeOuvert, setUpgradeOuvert] = useState(false);
  const [domaineDemande, setDomaineDemande] = useState("");

  useEffect(() => {
    const id = typeof window !== "undefined" ? window.localStorage.getItem("sama_site_id") : null;
    if (!id) { setChargement(false); return; }
    supabase.from("sites").select("*").eq("id", id).single().then(({ data }) => {
      setSite(data);
      setChargement(false);
    });
  }, []);

  if (chargement) {
    return <p className="text-center py-20" style={{ color: T.gris }}>Chargement…</p>;
  }

  const secteur = site ? SECTEURS.find((s) => s.id === site.secteur_id) : null;

  if (!site || !secteur) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: T.bleuClair }}>
          <Globe size={24} color={T.bleu} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: T.encre }}>Vous n'avez pas encore de site</h2>
        <p className="text-sm mb-6" style={{ color: T.gris }}>Créez votre site en quelques minutes pour voir apparaître son statut ici.</p>
        <Link href="/creer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold" style={{ background: T.bleu, color: T.blanc }}>
          Créer mon site <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const nom = site.nom_entreprise || secteur.demo.nom;
  const paye = site.statut === "actif";
  const lienEssai = `www.${nom.toLowerCase().replace(/\s+/g, "")}.samasite.com`;
  const domaineFinal = paye ? (site.domaine || `${nom.toLowerCase().replace(/\s+/g, "")}.${site.extension || "com"}`) : null;

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <h2 className="text-2xl font-bold mb-6" style={{ color: T.encre }}>Mon espace</h2>

      <div className="rounded-2xl p-5 mb-4" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-lg" style={{ color: T.encre }}>{nom}</div>
            <div className="text-xs mt-0.5" style={{ color: T.gris }}>{secteur.label}</div>
          </div>
          {paye ? <Badge tone="vert"><CheckCircle2 size={11} /> Actif</Badge>
            : site.statut === "a_livrer" ? <Badge tone="jaune"><Clock size={11} /> Paiement en attente de confirmation</Badge>
            : <Badge tone="jaune"><Clock size={11} /> Essai en cours</Badge>}
        </div>

        <div className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-lg mb-4" style={{ background: T.bleuClair, color: T.bleu }}>
          <Globe size={14} /> {paye && domaineFinal ? domaineFinal : lienEssai}
        </div>

        {paye && (
          <div className="text-xs mb-4" style={{ color: T.gris }}>
            Domaine <strong style={{ color: T.encre }}>{DOMAINES.find((d) => d.id === site.extension)?.label}</strong> · Renouvellement dans {DUREES.find((d) => d.id === site.duree)?.label}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Link href="/creer" className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ background: T.bleuClair, color: T.bleu }}>
            <Edit3 size={13} /> Créer un nouveau site
          </Link>
          {paye && !renouvele && (
            <button onClick={() => setRenouvele(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ background: T.bleuClair, color: T.bleu }}>
              <RefreshCw size={13} /> Renouveler mon abonnement
            </button>
          )}
          {renouvele && <Badge tone="vert"><CheckCircle2 size={11} /> Demande de renouvellement envoyée</Badge>}
          {paye && site.extension === "com" && (
            <button onClick={() => setUpgradeOuvert((v) => !v)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ background: T.jauneFond, color: T.jauneFonce }}>
              <Sparkles size={13} /> Passer en domaine .sn
            </button>
          )}
        </div>

        {upgradeOuvert && (
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.bleuClairBord}` }}>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Nom de domaine .sn souhaité</label>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 max-w-sm mb-2" style={{ background: T.bleuClair, border: `1.5px solid ${T.bleuClairBord}` }}>
              <Link2 size={15} color={T.gris} />
              <input value={domaineDemande} onChange={(e) => setDomaineDemande(e.target.value)} placeholder={`${nom.toLowerCase().replace(/\s+/g, "")}.sn`} className="text-sm outline-none flex-1 bg-transparent" />
            </div>
            <a href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(`Bonjour, je souhaite passer mon site "${nom}" en domaine .sn (${domaineDemande || ""}).`)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-block px-4 py-2.5 rounded-full text-xs font-bold" style={{ background: T.jaune, color: T.bleuFonce }}>
              Demander le passage au .sn sur WhatsApp
            </a>
            <p className="text-xs mt-2" style={{ color: T.gris }}>
              Nouveau tarif à partir du prochain renouvellement : <strong style={{ color: T.encre }}>{PRIX.sn[site.duree || "semestre"].toLocaleString("fr-FR")} F / {DUREES.find((d) => d.id === site.duree)?.label}</strong>
            </p>
          </div>
        )}
      </div>

      <a href={`https://wa.me/${WHATSAPP_SUPPORT}`} target="_blank" rel="noopener noreferrer"
        className="rounded-2xl p-5 flex items-center gap-3" style={{ background: T.bleuClair }}>
        <img src={WHATSAPP_AVATAR} alt="Assistance Sama Site" className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid #25D366" }} />
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: T.encre }}>Contactez-nous sur WhatsApp</div>
          <div className="text-xs mt-0.5" style={{ color: T.gris }}>Besoin d'être assisté ? Écrivez-nous, on répond vite.</div>
        </div>
        <ArrowRight size={16} color={T.bleu} className="shrink-0" />
      </a>
    </div>
  );
}
