"use client";
import { Clock } from "lucide-react";
import { T, JOURS_SEMAINE } from "../lib/data";

export default function EditeurHoraires({ horaires, onChange }) {
  const majJour = (jourId, champ, valeur) => {
    onChange({ ...horaires, [jourId]: { ...horaires[jourId], [champ]: valeur } });
  };

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: T.gris }}>
        <Clock size={13} /> Horaires d'ouverture
      </label>
      <div className="space-y-2 mb-5">
        {JOURS_SEMAINE.map((j) => {
          const h = horaires[j.id] || { ouvert: false, debut: "", fin: "" };
          return (
            <div key={j.id} className="flex items-center gap-2">
              <button type="button" onClick={() => majJour(j.id, "ouvert", !h.ouvert)}
                className="w-24 shrink-0 text-left text-xs font-semibold px-2 py-2 rounded-lg"
                style={{ background: h.ouvert ? T.bleuClair : "#F1F5F9", color: h.ouvert ? T.bleu : T.gris }}>
                {j.label}
              </button>
              {h.ouvert ? (
                <>
                  <input type="time" value={h.debut || ""} onChange={(e) => majJour(j.id, "debut", e.target.value)}
                    className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />
                  <span className="text-xs" style={{ color: T.gris }}>à</span>
                  <input type="time" value={h.fin || ""} onChange={(e) => majJour(j.id, "fin", e.target.value)}
                    className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}` }} />
                </>
              ) : (
                <span className="text-xs" style={{ color: T.gris }}>Fermé</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
