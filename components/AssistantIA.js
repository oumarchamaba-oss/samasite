"use client";
import { useState } from "react";
import { ArrowRight, RefreshCw, Wand2, Undo2, Loader2 } from "lucide-react";
import { T } from "../lib/data";

const ACTIONS_IA = [
  { id: "reformuler", label: "Reformuler", consigne: "Reformule ce texte en gardant le même sens et les mêmes informations." },
  { id: "corriger", label: "Corriger les fautes", consigne: "Corrige uniquement les fautes d'orthographe et de grammaire, sans changer le style ni le sens." },
  { id: "pro", label: "Plus professionnel", consigne: "Rends ce texte plus professionnel et soigné." },
  { id: "convaincant", label: "Plus convaincant", consigne: "Rends ce texte plus convaincant et commercial, sans inventer d'informations." },
  { id: "court", label: "Plus court", consigne: "Rends ce texte nettement plus court et percutant." },
  { id: "developper", label: "Développer", consigne: "Développe légèrement ce texte, sans inventer d'informations nouvelles." },
];

export default function AssistantIA({ texte, onAppliquer, entreprise, secteurLabel, champLabel }) {
  const [ouvert, setOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [propose, setPropose] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [instructionPerso, setInstructionPerso] = useState("");
  const [derniereConsigne, setDerniereConsigne] = useState(null);

  const appelerIA = async (consigne) => {
    setChargement(true); setErreur(null); setDerniereConsigne(consigne);
    try {
const response = await fetch("/api/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entreprise, secteurLabel, champLabel, texte, consigne }),
      });
      const data = await response.json();
      if (!data.resultat) throw new Error(data.erreur || "vide");
      setPropose(data.resultat);
    } catch (e) {
      setErreur("La génération a échoué. Réessayez.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOuvert((v) => !v)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: T.bleu }}>
        <Wand2 size={12} /> Améliorer avec l'IA
      </button>

      {ouvert && (
        <div className="absolute z-20 mt-2 rounded-2xl p-4 shadow-xl" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}`, width: 300, left: 0 }}>
          {!propose ? (
            <>
              <p className="text-xs font-semibold mb-2" style={{ color: T.gris }}>Choisir une action</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {ACTIONS_IA.map((a) => (
                  <button key={a.id} type="button" disabled={chargement} onClick={() => appelerIA(a.consigne)}
                    className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold disabled:opacity-40" style={{ background: T.bleuClair, color: T.bleu }}>
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input value={instructionPerso} onChange={(e) => setInstructionPerso(e.target.value)} placeholder="Instruction personnalisée…"
                  className="flex-1 rounded-lg px-2.5 py-2 text-xs outline-none" style={{ background: "#F1F5F9", border: `1px solid ${T.bleuClairBord}` }} />
                <button type="button" disabled={chargement || !instructionPerso.trim()} onClick={() => appelerIA(instructionPerso.trim())}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: T.bleu }}>
                  <ArrowRight size={14} color="#fff" />
                </button>
              </div>
              {chargement && <p className="text-xs mt-2.5 flex items-center gap-1.5" style={{ color: T.gris }}><Loader2 size={12} className="animate-spin" /> Génération en cours…</p>}
              {erreur && <p className="text-xs mt-2.5" style={{ color: T.rouge }}>{erreur}</p>}
              <button type="button" onClick={() => setOuvert(false)} className="text-xs mt-3 font-semibold" style={{ color: T.gris }}>Fermer</button>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Texte actuel</p>
              <p className="text-xs mb-3 p-2 rounded-lg leading-relaxed" style={{ background: "#F1F5F9", color: T.gris }}>{texte || "(vide)"}</p>
              <p className="text-xs font-semibold mb-1.5" style={{ color: T.bleu }}>Proposition de l'IA</p>
              <p className="text-xs mb-3 p-2 rounded-lg leading-relaxed" style={{ background: T.bleuClair, color: T.encre }}>{propose}</p>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => { onAppliquer(propose); setPropose(null); setOuvert(false); }}
                  className="flex-1 rounded-lg py-2 text-xs font-bold text-white" style={{ background: T.vert }}>Remplacer</button>
                <button type="button" disabled={chargement} onClick={() => appelerIA(derniereConsigne)}
                  className="rounded-lg py-2 px-3 text-xs font-semibold disabled:opacity-40" style={{ background: T.bleuClair, color: T.bleu }} title="Réessayer">
                  <RefreshCw size={12} className={chargement ? "animate-spin" : ""} />
                </button>
                <button type="button" onClick={() => setPropose(null)} className="rounded-lg py-2 px-3 text-xs font-semibold" style={{ background: "#F1F5F9", color: T.gris }} title="Annuler">
                  <Undo2 size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

