"use client";
// Avis clients sur le mini-site public (audit sept. 2026, recommandation
// "preuve sociale") — n'importe quel visiteur peut déposer une note + un
// commentaire ; seuls les avis APPROUVÉS par le commerçant (voir MonEspace)
// sont visibles ici. Toujours en lecture anonyme (aucune session requise).
import { useEffect, useState } from "react";
import { Star, MessageSquarePlus, CheckCircle2 } from "lucide-react";
import { T } from "../lib/data";
import { supabase } from "../lib/supabaseClient";

function Etoiles({ valeur, taille = 14, couleur = "#F59E0B" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={taille} color={couleur} fill={n <= Math.round(valeur) ? couleur : "none"} strokeWidth={1.5} />
      ))}
    </div>
  );
}

export default function AvisClients({ slug, primaire, fond }) {
  const [avis, setAvis] = useState([]);
  const [charge, setCharge] = useState(false);
  const [nom, setNom] = useState("");
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!slug) return;
    supabase.rpc("obtenir_avis_public", { p_slug: slug }).then(({ data }) => {
      setAvis(data || []);
      setCharge(true);
    });
  }, [slug]);

  const moyenne = avis.length ? avis.reduce((s, a) => s + a.note, 0) / avis.length : null;

  const envoyer = async () => {
    setErreur("");
    if (!nom.trim()) { setErreur("Votre nom est requis."); return; }
    if (!note) { setErreur("Choisissez une note."); return; }
    setEnvoi(true);
    const { error } = await supabase.rpc("deposer_avis", { p_slug: slug, p_auteur_nom: nom.trim(), p_note: note, p_commentaire: commentaire.trim() || null });
    setEnvoi(false);
    if (error) { setErreur("Impossible d'envoyer votre avis pour le moment."); return; }
    setEnvoye(true);
  };

  if (!slug) return null;

  return (
    <section className="border-t" style={{ borderColor: T.bleuClairBord }}>
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-16">
        <div className="mb-7 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: primaire }}>Ce qu'ils en pensent</p>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-1" style={{ color: T.encre }}>Avis clients</h2>
          </div>
          {moyenne !== null && (
            <div className="flex items-center gap-2">
              <Etoiles valeur={moyenne} taille={17} />
              <span className="text-sm font-bold" style={{ color: T.encre }}>{moyenne.toFixed(1)}/5</span>
              <span className="text-xs" style={{ color: T.gris }}>({avis.length} avis)</span>
            </div>
          )}
        </div>

        {charge && avis.length === 0 && (
          <p className="text-sm mb-8" style={{ color: T.gris }}>Aucun avis pour le moment — soyez le premier à en laisser un.</p>
        )}

        {avis.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {avis.slice(0, 6).map((a) => (
              <div key={a.id} className="rounded-2xl p-4" style={{ background: fond, border: `1px solid ${T.bleuClairBord}` }}>
                <Etoiles valeur={a.note} />
                {a.commentaire && <p className="text-sm mt-2 leading-relaxed" style={{ color: T.encre }}>{a.commentaire}</p>}
                <p className="text-xs mt-2 font-semibold" style={{ color: T.gris }}>{a.auteur_nom}</p>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-md rounded-2xl p-5" style={{ background: fond, border: `1px solid ${T.bleuClairBord}` }}>
          {envoye ? (
            <p className="text-sm font-semibold flex items-center gap-2" style={{ color: T.vert }}><CheckCircle2 size={16} /> Merci ! Votre avis sera visible après validation.</p>
          ) : (
            <>
              <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: T.encre }}><MessageSquarePlus size={15} /> Laisser un avis</p>
              <div className="flex items-center gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setNote(n)} aria-label={`${n} étoile(s)`}>
                    <Star size={22} color="#F59E0B" fill={n <= note ? "#F59E0B" : "none"} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom"
                className="w-full rounded-xl px-3.5 py-2.5 mb-2 text-sm outline-none" style={{ border: `1.5px solid ${T.bleuClairBord}`, background: T.blanc }} maxLength={80} />
              <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Votre commentaire (facultatif)" rows={3}
                className="w-full rounded-xl px-3.5 py-2.5 mb-2 text-sm outline-none resize-none" style={{ border: `1.5px solid ${T.bleuClairBord}`, background: T.blanc }} maxLength={500} />
              {erreur && <p className="text-xs mb-2" style={{ color: T.rouge }}>{erreur}</p>}
              <button type="button" onClick={envoyer} disabled={envoi}
                className="bouton-hover w-full rounded-full py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: primaire }}>
                {envoi ? "Envoi…" : "Envoyer mon avis"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
