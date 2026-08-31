"use client";
import { useState } from "react";
import { MessageCircle, Mail, MapPin, ExternalLink, Menu } from "lucide-react";
import { T, SECTEUR_COULEURS, RESEAUX_SOCIAUX, MODES_LIVRAISON, genererSchema, trouverMetier, trouverIconeMetier, assombrir, paletteIdPour } from "../lib/data";

function normaliserItems(rawItems) {
  return (rawItems || []).map((it) => typeof it === "string" ? { texte: it, image: null, description: "", prix: "", categorie: "" } : { image: null, description: "", prix: "", categorie: "", ...it });
}
function wa(number, message = "") {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "#";
  const full = digits.startsWith("221") ? digits : `221${digits.replace(/^0/, "")}`;
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export default function ApercuSite({ secteur, business, paye }) {
  const [categorieActive, setCategorieActive] = useState("Tous");
  const modesDispo = (business.modesLivraison && business.modesLivraison.length ? business.modesLivraison : secteur.modesLivraison) || [];
  const [modeCommande, setModeCommande] = useState(modesDispo[0] || null);
  const reseauxActifs = RESEAUX_SOCIAUX.filter((r) => business.reseaux?.[r.id]?.trim());
  const demoMetier = business.metier ? trouverMetier(business.metier)?.demo : null;
  const demoActif = demoMetier || secteur.demo;
  const p = business.couleurs || genererSchema(SECTEUR_COULEURS[paletteIdPour(secteur, business)][0].hex);
  const nom = business.nom || demoActif.nom;
  const accroche = business.accroche || demoActif.accroche;
  const items = normaliserItems(business.produits?.length ? business.produits : demoActif.produits);
  const Icon = business.metier ? trouverIconeMetier(business.metier) : secteur.icon;
  const estService = secteur.type === "service";
  const catalogueLabel = secteur.libelleCatalogue || (estService ? "Services" : "Produits");
  const actionLabel = secteur.libelleAction || (estService ? "Demander" : "Commander");
  const heroFonce = assombrir(p.primaire, -45);
  const footerFonce = assombrir(p.primaire, -60);
  const categories = ["Tous", ...new Set(items.map((it) => it.categorie).filter(Boolean))];
  const itemsAffiches = categorieActive === "Tous" ? items : items.filter((it) => it.categorie === categorieActive);
  const suffixeMode = modeCommande ? ` (${MODES_LIVRAISON[modeCommande]?.label})` : "";
  const generalWa = wa(business.whatsapp, `Bonjour ${nom}, je souhaite ${actionLabel.toLowerCase()} via votre site${suffixeMode}.`);
  const words = accroche.trim().split(/\s+/); const split = Math.max(0, words.length - 2);

  return (
    <div className="mx-auto" style={{ width: 320 }}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-2xl" style={{ background: "#E2E8F0" }}>
        <div className="flex gap-1"><i className="w-2 h-2 rounded-full bg-slate-400" /><i className="w-2 h-2 rounded-full bg-slate-400" /><i className="w-2 h-2 rounded-full bg-slate-400" /></div>
        <div className="flex-1 rounded-full px-3 py-1 bg-white text-[9px] text-slate-500 truncate">www.{nom.toLowerCase().replace(/\s+/g, "") || "monsite"}.samasite.com</div>
      </div>
      <div className="overflow-hidden shadow-xl" style={{ height: 610, borderRadius: "0 0 1.25rem 1.25rem", background: T.blanc }}>
        <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {/* HEADER */}
          <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/95" style={{ borderBottom: `1px solid ${T.bleuClairBord}`, backdropFilter: "blur(8px)" }}>
            <div className="flex items-center gap-1.5 min-w-0">
              {business.logo ? <img src={business.logo} alt="" className="w-7 h-7 rounded-lg object-contain" style={{ background: p.fond }} /> : <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: p.fond }}><Icon size={13} color={p.primaire} /></div>}
              <span className="text-xs font-bold truncate" style={{ color: T.encre }}>{nom}</span>
            </div>
            <div className="flex items-center gap-2"><a href={generalWa} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#25D366" }}><MessageCircle size={14} color="#fff" /></a><Menu size={18} color={T.encre} /></div>
          </header>

          {/* HERO */}
          <section id="accueil" className="relative overflow-hidden" style={{ minHeight: 310 }}>
            {business.banniere ? <img src={business.banniere} alt={nom} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background: `linear-gradient(140deg, ${p.fond}, ${p.primaire}22)` }}><div className="absolute right-6 bottom-6"><Icon size={70} color={p.primaire} strokeWidth={1.2} /></div></div>}
            <div className="absolute inset-0" style={{ background: business.banniere ? "linear-gradient(90deg, rgba(255,255,255,.96) 0%, rgba(255,255,255,.78) 58%, rgba(255,255,255,.05) 100%)" : "none" }} />
            <div className="relative px-5 py-10 max-w-[270px]">
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: p.primaire }}>Bienvenue chez {nom}</p>
              <h1 className="text-2xl font-extrabold leading-tight mt-2" style={{ color: T.encre }}>{words.slice(0, split).join(" ")}{split ? " " : ""}<span style={{ color: p.primaire }}>{words.slice(split).join(" ")}</span></h1>
              <p className="text-xs leading-relaxed mt-3" style={{ color: T.gris }}>{business.metier ? `${business.metier} — ` : ""}{estService ? "Des services pensés pour répondre à vos besoins." : "Des produits sélectionnés avec soin pour vous."}</p>
              <a href={generalWa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 rounded-full px-4 py-2.5 text-[10px] font-bold text-white" style={{ background: heroFonce }}><MessageCircle size={12} /> {actionLabel} sur WhatsApp</a>
            </div>
            {!paye && <div className="absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-[8px] font-semibold text-white" style={{ background: "rgba(15,23,42,.55)" }}>Créé avec Sama Site</div>}
          </section>

          {/* PRODUITS / SERVICES */}
          <section id="produits" className="px-4 py-7">
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: p.primaire }}>Notre sélection</p>
            <h2 className="text-lg font-extrabold mt-1" style={{ color: T.encre }}>{catalogueLabel}</h2>
            {modesDispo.length > 1 && (
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {modesDispo.map((modeId) => {
                  const m = MODES_LIVRAISON[modeId]; const MIcon = m.icon;
                  const actif = modeCommande === modeId;
                  return (
                    <button key={modeId} onClick={() => setModeCommande(modeId)} className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[9px] font-semibold"
                      style={{ background: actif ? p.fond : T.blanc, color: actif ? p.primaire : T.gris, border: `1px solid ${actif ? p.primaire : T.bleuClairBord}` }}>
                      <MIcon size={10} /> {m.label}
                    </button>
                  );
                })}
              </div>
            )}
            {categories.length > 1 && <div className="flex gap-5 overflow-x-auto mt-4 pb-2 border-b" style={{ borderColor: T.bleuClairBord, scrollbarWidth: "none" }}>{categories.map(cat => <button key={cat} onClick={() => setCategorieActive(cat)} className="shrink-0 text-[10px] font-medium pb-2 -mb-2 border-b-2" style={{ color: categorieActive === cat ? p.primaire : T.gris, borderColor: categorieActive === cat ? p.primaire : "transparent" }}>{cat}</button>)}</div>}
            <div className="flex gap-3 overflow-x-auto mt-4 pb-2" style={{ scrollbarWidth: "none" }}>
              {itemsAffiches.map((item, i) => <article key={`${item.texte}-${i}`} className="shrink-0 w-[155px] rounded-xl overflow-hidden" style={{ border: `1px solid ${T.bleuClairBord}`, background: "#fff" }}>
                {item.image ? <img src={item.image} alt={item.texte} className="w-full h-24 object-cover" /> : <div className="w-full h-24 flex items-center justify-center" style={{ background: p.fond }}><Icon size={27} color={p.primaire} strokeWidth={1.4} /></div>}
                <div className="p-2.5"><h3 className="text-[10px] font-bold leading-snug" style={{ color: T.encre }}>{item.texte}</h3>{item.description && <p className="text-[9px] leading-snug mt-1 line-clamp-2" style={{ color: T.gris }}>{item.description}</p>}{item.prix && <p className="text-[10px] font-extrabold mt-1.5" style={{ color: p.primaire }}>{item.prix}</p>}<a href={wa(business.whatsapp, `Bonjour ${nom}, je souhaite ${actionLabel.toLowerCase()} : ${item.texte}${item.prix ? ` (${item.prix})` : ""}${suffixeMode}.`)} target="_blank" rel="noopener noreferrer" className="mt-2.5 flex items-center justify-center gap-1 rounded-full py-1.5 text-[9px] font-bold text-white" style={{ background: "#25D366" }}><MessageCircle size={10} /> {actionLabel}</a></div>
              </article>)}
            </div>
          </section>

          {/* FOOTER */}
          <footer id="contact" className="px-4 py-7" style={{ background: footerFonce }}>
            <div className="flex items-center gap-2">{business.logo ? <img src={business.logo} alt="" className="w-7 h-7 rounded-lg object-contain bg-white/10" /> : <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10"><Icon size={13} color="#fff" /></div>}<span className="text-sm font-bold text-white">{nom}</span></div>
            <div className="flex gap-4 mt-4 text-[10px] text-white/70"><a href="#accueil">Accueil</a><a href="#produits">{catalogueLabel}</a><a href="#contact">Contact</a></div>
            <div className="mt-4 space-y-2">{business.whatsapp && <a href={generalWa} target="_blank" rel="noopener noreferrer" className="flex gap-2 items-center text-[10px] text-white/80"><MessageCircle size={11} />{business.whatsapp}</a>}{business.email && <a href={`mailto:${business.email}`} className="flex gap-2 items-center text-[10px] text-white/80"><Mail size={11} />{business.email}</a>}{business.adresse && <div className="flex gap-2 items-start text-[10px] text-white/80"><MapPin size={11} className="mt-0.5" />{business.adresse}</div>}{business.lienGoogleMaps && <a href={business.lienGoogleMaps} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1 items-center mt-1 text-[9px] text-white/65"><ExternalLink size={10} /> Google Maps</a>}</div>
            {reseauxActifs.length > 0 && <div className="flex gap-2 mt-4">{reseauxActifs.map((r) => { const RIcon = r.icon; return <a key={r.id} href={business.reseaux[r.id]} target="_blank" rel="noopener noreferrer" aria-label={r.label || r.id} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10"><RIcon size={13} color="#fff" /></a>; })}</div>}
            <p className="mt-6 pt-4 border-t border-white/10 text-[9px] text-white/40">© {new Date().getFullYear()} {nom}. Tous droits réservés.{!paye ? " · Créé avec Sama Site" : ""}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
