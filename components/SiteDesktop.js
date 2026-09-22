"use client";
import { useState, useEffect } from "react";
import { MessageCircle, Phone, Mail, MapPin, ExternalLink, Clock, X, Maximize2, CreditCard } from "lucide-react";
import { T, SECTEURS, SECTEUR_COULEURS, RESEAUX_SOCIAUX, MODES_LIVRAISON, genererSchema, trouverMetier, trouverIconeMetier, assombrir, paletteIdPour, formaterHoraires } from "../lib/data";
import { useReveal } from "../lib/useReveal";
import { initierPaiementBoutique } from "../lib/paiementBoutiqueGateway";

function normaliserItems(rawItems) {
  return (rawItems || []).map((it) => typeof it === "string"
    ? { texte: it, image: null, description: "", prix: "", categorie: "" }
    : { image: null, description: "", prix: "", categorie: "", ...it });
}

function whatsappHref(number, message = "") {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "#";
  const full = digits.startsWith("221") ? digits : `221${digits.replace(/^0/, "")}`;
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

// Carte produit/service individuelle — s'anime à l'entrée dans le viewport,
// avec un léger décalage (stagger) selon sa position dans la liste.
function CarteProduit({ item, index, p, Icon, nom, actionLabel, whatsapp, suffixeMode, onOuvrirImage, paiementActif, slug }) {
  const [ref, visible] = useReveal();
  const [paiementEnCours, setPaiementEnCours] = useState(false);
  const [paiementNote, setPaiementNote] = useState("");
  const message = `Bonjour ${nom}, je souhaite ${actionLabel.toLowerCase()} : ${item.texte}${item.prix ? ` (${item.prix})` : ""}${suffixeMode}.`;

  // Paiement en ligne (Versus) — voir lib/paiementBoutiqueGateway.js. Tant que
  // l'API Versus n'est pas branchée, "automatique" vaut toujours false : on
  // affiche alors un message clair au lieu de simuler un paiement réussi, et
  // le client garde la commande WhatsApp ci-dessus comme solution immédiate.
  const payerEnLigne = async () => {
    setPaiementEnCours(true);
    setPaiementNote("");
    const { automatique, lienPaiement } = await initierPaiementBoutique({
      slug, produitId: item.id, produitTexte: item.texte, montant: item.prix, moyenPaiement: null,
    });
    setPaiementEnCours(false);
    if (automatique && lienPaiement) { window.location.href = lienPaiement; return; }
    setPaiementNote("Paiement en ligne bientôt disponible — commandez via WhatsApp en attendant.");
  };

  return (
    <article
      ref={ref}
      style={{ background: T.blanc, border: `1px solid ${T.bleuClairBord}`, boxShadow: "0 2px 8px rgba(15,23,42,.06)", transitionDelay: `${Math.min(index, 6) * 70}ms` }}
      className={`reveal ${visible ? "reveal-visible" : ""} carte-hover snap-start shrink-0 w-[250px] sm:w-[270px] rounded-2xl overflow-hidden flex flex-col`}
    >
      {item.image ? (
        // Vignette recadrée (object-cover) pour garder des cartes homogènes,
        // quelle que soit l'orientation de la photo (verticale, horizontale,
        // carrée) — la photo complète, non recadrée, s'affiche au clic dans
        // le lightbox ci-dessous (voir demande du 21/09/2026, points 2 et 3).
        <button type="button" onClick={() => onOuvrirImage?.(item)} className="relative w-full h-40 block group overflow-hidden" aria-label={`Voir la photo complète de ${item.texte}`}>
          <img src={item.image} alt={item.texte} className="image-zoom-hover w-full h-40 object-cover" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: "rgba(15,23,42,.35)" }}>
            <Maximize2 size={20} color="#fff" />
          </div>
        </button>
      ) : (
        <div className="w-full h-40 flex items-center justify-center" style={{ background: p.fond }}><Icon size={42} color={p.primaire} strokeWidth={1.35} /></div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-bold leading-snug" style={{ color: T.encre }}>{item.texte}</h3>
        {item.description && <p className="text-xs leading-relaxed mt-1.5 line-clamp-2" style={{ color: T.gris }}>{item.description}</p>}
        {item.prix && <p className="text-sm font-extrabold mt-2" style={{ color: p.primaire }}>{item.prix}</p>}
        <a href={whatsappHref(whatsapp, message)} target="_blank" rel="noopener noreferrer" className="bouton-hover mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold text-white" style={{ background: "#25D366" }}>
          <MessageCircle size={14} /> {actionLabel}
        </a>
        {paiementActif && (
          <>
            <button type="button" onClick={payerEnLigne} disabled={paiementEnCours}
              className="shine-hover mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold disabled:opacity-60"
              style={{ background: T.blanc, border: `1.5px solid ${p.primaire}`, color: p.primaire }}>
              <CreditCard size={14} /> {paiementEnCours ? "…" : "Payer en ligne"}
            </button>
            <p className="text-[10px] mt-1.5 text-center leading-snug" style={{ color: T.gris }}>Orange Money · Wave · Free Money · Visa · Mastercard</p>
            {paiementNote && <p className="text-[10px] mt-1 text-center leading-snug" style={{ color: p.primaire }}>{paiementNote}</p>}
          </>
        )}
      </div>
    </article>
  );
}

export default function SiteDesktop({ secteur: secteurRecu, secteurId, business, paye }) {
  // secteur peut arriver soit en objet complet (appel depuis un composant déjà
  // "use client", ex. app/site/[token]/page.js), soit en simple secteurId
  // (appel depuis un Composant Serveur, ex. app/s/[slug]/page.js) — un objet
  // secteur contient des composants d'icône lucide-react (des fonctions), non
  // sérialisables à travers la frontière Serveur → Client : il doit donc être
  // retrouvé ICI, côté client, plutôt que reçu tel quel d'un Composant Serveur.
  const secteur = secteurRecu || SECTEURS.find((s) => s.id === secteurId);
  const [categorieActive, setCategorieActive] = useState("Tous");
  // Lightbox photo produit (21/09/2026, point 3) : null = fermé, sinon
  // l'item dont on affiche la photo en plein format, ratio d'origine.
  const [imageOuverte, setImageOuverte] = useState(null);
  useEffect(() => {
    if (!imageOuverte) return;
    const surEchap = (e) => { if (e.key === "Escape") setImageOuverte(null); };
    window.addEventListener("keydown", surEchap);
    const overflowPrecedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", surEchap); document.body.style.overflow = overflowPrecedent; };
  }, [imageOuverte]);
  // En-tête sticky : une ombre discrète apparaît dès que la page est
  // défilée, pour la détacher visuellement du contenu qui passe dessous.
  const [defile, setDefile] = useState(false);
  useEffect(() => {
    const surScroll = () => setDefile(window.scrollY > 8);
    surScroll();
    window.addEventListener("scroll", surScroll, { passive: true });
    return () => window.removeEventListener("scroll", surScroll);
  }, []);
  const modesDispo = (business.modesLivraison && business.modesLivraison.length ? business.modesLivraison : secteur.modesLivraison) || [];
  const [modeCommande, setModeCommande] = useState(modesDispo[0] || null);
  const demoMetier = business.metier ? trouverMetier(business.metier)?.demo : null;
  const demoActif = demoMetier || secteur.demo;
  const horairesFormates = formaterHoraires(business.horaires);
  const p = business.couleurs || genererSchema(SECTEUR_COULEURS[paletteIdPour(secteur, business)][0].hex);
  const nom = business.nom || demoActif.nom;
  const accroche = business.accroche || demoActif.accroche;
  // BUG CORRIGÉ (21/09/2026) : le site publié affichait les produits de démo du
  // secteur quand l'entreprise réelle n'avait encore rempli aucun produit —
  // du contenu fictif apparaissait comme si c'était le catalogue du client.
  // Le site publié ne doit montrer QUE ce que l'utilisateur a lui-même rempli.
  const items = normaliserItems(business.produits || []);
  const Icon = business.metier ? trouverIconeMetier(business.metier) : secteur.icon;
  const estService = secteur.type === "service";
  const heroFonce = assombrir(p.primaire, -45);
  const footerFonce = assombrir(p.primaire, -60);
  const reseauxActifs = RESEAUX_SOCIAUX.filter((r) => business.reseaux?.[r.id]?.trim());
  const categories = ["Tous", ...new Set(items.map((it) => it.categorie).filter(Boolean))];
  const itemsAffiches = categorieActive === "Tous" ? items : items.filter((it) => it.categorie === categorieActive);
  const catalogueLabel = secteur.libelleCatalogue || (estService ? "Services" : "Produits");
  const actionLabel = secteur.libelleAction || (estService ? "Demander" : "Commander");
  const suffixeMode = modeCommande ? ` (${MODES_LIVRAISON[modeCommande]?.label})` : "";
  const waGeneral = whatsappHref(business.whatsapp, `Bonjour ${nom}, je souhaite ${actionLabel.toLowerCase()} via votre site${suffixeMode}.`);
  const highlightWords = accroche.trim().split(/\s+/);
  const highlightStart = Math.max(0, highlightWords.length - 2);
  const titreAvant = highlightWords.slice(0, highlightStart).join(" ");
  const titreHighlight = highlightWords.slice(highlightStart).join(" ");

  const [heroTexteRef, heroTexteVisible] = useReveal();
  const [produitsHeadRef, produitsHeadVisible] = useReveal();
  const [footerRef, footerVisible] = useReveal();

  return (
    <div className="w-full overflow-hidden" style={{ background: T.blanc }}>
      {/* 1. BANNIÈRE / HEADER */}
      <header className={`entete-flottant ${defile ? "entete-flottant-actif" : ""} sticky top-0 z-20 px-5 md:px-10 py-3.5`} style={{ background: "rgba(255,255,255,0.96)", borderBottom: `1px solid ${T.bleuClairBord}`, backdropFilter: "blur(10px)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <a href="#accueil" className="flex items-center gap-2.5 min-w-0">
            {business.logo ? (
              <img src={business.logo} alt={`Logo ${nom}`} className="w-10 h-10 rounded-xl object-contain" style={{ background: p.fond }} />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: p.fond }}><Icon size={20} color={p.primaire} strokeWidth={1.8} /></div>
            )}
            <span className="font-bold text-base truncate" style={{ color: T.encre }}>{nom}</span>
          </a>
          <nav className="hidden md:flex items-center gap-7">
            <a href="#accueil" className="lien-nav-anime text-sm font-medium transition-opacity duration-200 hover:opacity-60" style={{ color: T.encre }}>Accueil</a>
            <a href="#produits" className="lien-nav-anime text-sm font-medium transition-opacity duration-200 hover:opacity-60" style={{ color: T.gris }}>{catalogueLabel}</a>
            <a href="#contact" className="lien-nav-anime text-sm font-medium transition-opacity duration-200 hover:opacity-60" style={{ color: T.gris }}>Contact</a>
          </nav>
          <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="bouton-hover shine-hover shrink-0 flex items-center gap-2 rounded-full px-4 py-2.5 text-xs md:text-sm font-bold text-white" style={{ background: "#25D366" }}>
            <MessageCircle size={15} /> <span className="hidden sm:inline">{actionLabel}</span><span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* 2. HERO */}
      {/* CORRIGÉ (21/09/2026) : le nom et l'accroche doivent être superposés sur
          la photo de bannière, exactement comme dans l'aperçu montré pendant la
          création (ApercuSite.js) — même traitement sur mobile et sur desktop,
          au lieu de l'ancienne mise en page à deux colonnes où le texte et la
          photo étaient séparés. */}
      <section id="accueil" className="scroll-mt-20 relative overflow-hidden min-h-[460px] md:min-h-[560px] flex items-center" style={{ background: p.fond }}>
        {business.banniere ? (
          <>
            <img src={business.banniere} alt={nom} className="hero-media-anim absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(255,255,255,.97) 0%, rgba(255,255,255,.90) 38%, rgba(255,255,255,.55) 62%, rgba(255,255,255,.12) 100%)" }} />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-end pr-10" style={{ background: `linear-gradient(140deg, ${p.fond}, ${p.primaire}22)` }}>
            <Icon size={110} color={p.primaire} strokeWidth={1.1} className="hidden md:block" />
          </div>
        )}
        <div ref={heroTexteRef} className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-10 py-16 md:py-24">
          <div className="max-w-xl">
            <p className={`reveal ${heroTexteVisible ? "reveal-visible" : ""} text-xs font-bold uppercase tracking-wider mb-4`} style={{ color: p.primaire }}>Bienvenue chez {nom}</p>
            <h1 className={`reveal ${heroTexteVisible ? "reveal-visible" : ""} text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tight`} style={{ color: T.encre, transitionDelay: "90ms" }}>
              {titreAvant}{titreAvant ? " " : ""}<span style={{ color: p.primaire }}>{titreHighlight}</span>
            </h1>
            <p className={`reveal ${heroTexteVisible ? "reveal-visible" : ""} text-base md:text-lg leading-relaxed mt-5`} style={{ color: T.gris, transitionDelay: "170ms" }}>
              {business.metier ? `${business.metier} — ` : ""}{estService ? "Des services pensés pour répondre simplement à vos besoins." : "Des produits sélectionnés avec soin pour vous."}
            </p>
            <div className={`reveal ${heroTexteVisible ? "reveal-visible" : ""} mt-7 flex flex-wrap gap-3`} style={{ transitionDelay: "250ms" }}>
              <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="bouton-hover shine-hover inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white" style={{ background: heroFonce }}>
                <MessageCircle size={17} /> {actionLabel} sur WhatsApp
              </a>
            </div>
          </div>
        </div>
        {!paye && <div className="absolute z-10 bottom-4 right-4 rounded-full px-3 py-1.5 text-[10px] font-semibold text-white" style={{ background: "rgba(15,23,42,.55)" }}>Créé avec Sama Site</div>}
      </section>

      {/* 3. PRODUITS / SERVICES */}
      <section id="produits" className="scroll-mt-20 border-t" style={{ borderColor: T.bleuClairBord }}>
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-14 md:py-16">
          <div ref={produitsHeadRef} className={`reveal ${produitsHeadVisible ? "reveal-visible" : ""} mb-7`}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: p.primaire }}>Notre sélection</p>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-1" style={{ color: T.encre }}>{catalogueLabel}</h2>
          </div>

          {modesDispo.length > 1 && items.length > 0 && (
            <div className="flex flex-col gap-2 mb-6">
              <span className="text-xs font-semibold" style={{ color: T.gris }}>Comment souhaitez-vous être servi ?</span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                {modesDispo.map((modeId) => {
                  const m = MODES_LIVRAISON[modeId];
                  const MIcon = m.icon;
                  const actif = modeCommande === modeId;
                  return (
                    <button key={modeId} onClick={() => setModeCommande(modeId)}
                      className="shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200"
                      style={{ background: actif ? p.fond : T.blanc, color: actif ? p.primaire : T.gris, border: `1.5px solid ${actif ? p.primaire : T.bleuClairBord}` }}>
                      <MIcon size={12} /> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {categories.length > 1 && (
            <div className="flex items-center gap-7 overflow-x-auto pb-3 mb-8 border-b" style={{ borderColor: T.bleuClairBord, scrollbarWidth: "none" }}>
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCategorieActive(cat)} className="shrink-0 text-sm font-medium pb-3 -mb-3 border-b-2 transition-colors duration-200" style={{ color: categorieActive === cat ? p.primaire : T.gris, borderColor: categorieActive === cat ? p.primaire : "transparent" }}>{cat}</button>
              ))}
            </div>
          )}

          {items.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto pb-3 snap-x" style={{ scrollbarWidth: "none" }}>
              {itemsAffiches.map((item, i) => (
                <CarteProduit key={item.id || `${item.texte}-${i}`} item={item} index={i} p={p} Icon={Icon} nom={nom} actionLabel={actionLabel} whatsapp={business.whatsapp} suffixeMode={suffixeMode} onOuvrirImage={setImageOuverte} paiementActif={paye && !!business.paiement_en_ligne_actif} slug={business.slug} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl" style={{ background: p.fond, border: `1px solid ${T.bleuClairBord}` }}>
              <Icon size={36} color={p.primaire} strokeWidth={1.2} />
              <p className="mt-4 text-sm font-semibold" style={{ color: T.encre }}>{estService ? "Aucun service pour le moment" : "Aucun produit pour le moment"}</p>
              <p className="mt-1 text-xs max-w-xs" style={{ color: T.gris }}>{nom} n'a pas encore ajouté de {estService ? "service" : "produit"}. Revenez bientôt, ou contactez-nous directement.</p>
              {business.whatsapp && (
                <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="bouton-hover shine-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 mt-5 text-xs font-bold text-white" style={{ background: heroFonce }}>
                  <MessageCircle size={14} /> Nous contacter sur WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer id="contact" ref={footerRef} className={`reveal ${footerVisible ? "reveal-visible" : ""} scroll-mt-20`} style={{ background: footerFonce }}>
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-12">
          <div className="grid md:grid-cols-[1.5fr_1fr_1.2fr] gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                {business.logo ? <img src={business.logo} alt={`Logo ${nom}`} className="w-9 h-9 rounded-lg object-contain bg-white/10" /> : <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10"><Icon size={18} color="#fff" /></div>}
                <span className="font-bold text-lg text-white">{nom}</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,.65)" }}>{accroche}</p>
              {reseauxActifs.length > 0 && <div className="flex gap-2 mt-5">{reseauxActifs.map((r) => { const RIcon = r.icon; return <a key={r.id} href={business.reseaux[r.id]} target="_blank" rel="noopener noreferrer" aria-label={r.label || r.id} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 transition-transform duration-200 hover:scale-110 hover:bg-white/20"><RIcon size={15} color="#fff" /></a>; })}</div>}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/45 mb-4">Navigation</p>
              <div className="flex flex-col gap-2.5"><a href="#accueil" className="text-sm text-white/75 transition-opacity duration-200 hover:opacity-100 hover:text-white">Accueil</a><a href="#produits" className="text-sm text-white/75 transition-opacity duration-200 hover:opacity-100 hover:text-white">{catalogueLabel}</a><a href="#contact" className="text-sm text-white/75 transition-opacity duration-200 hover:opacity-100 hover:text-white">Contact</a></div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/45 mb-4">Contact</p>
              <div className="space-y-3">
                {business.whatsapp && <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/80 transition-opacity duration-200 hover:opacity-100 hover:text-white"><MessageCircle size={15} /> {business.whatsapp}</a>}
                {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-sm text-white/80 transition-opacity duration-200 hover:opacity-100 hover:text-white"><Mail size={15} /> {business.email}</a>}
                {business.adresse && <div className="flex items-start gap-2 text-sm text-white/80"><MapPin size={15} className="mt-0.5 shrink-0" /> {business.adresse}</div>}
              </div>
              {business.lienGoogleMaps && <a href={business.lienGoogleMaps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-white/70 transition-opacity duration-200 hover:opacity-100 hover:text-white"><ExternalLink size={12} /> Voir sur Google Maps</a>}
              {horairesFormates.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/45 mb-2"><Clock size={12} /> Horaires</p>
                  {horairesFormates.map((h, i) => (
                    <div key={i} className="flex justify-between gap-3 text-xs text-white/75 py-0.5">
                      <span>{h.label}</span><span>{h.texte}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-10 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} {nom}. Tous droits réservés.</p>
            {/* Crédit permanent (pas conditionné à !paye) : demandé sur TOUS les
                sites créés, payés ou non — voir demande du 21/09/2026. */}
            <a href="https://samasite.online" target="_blank" rel="noopener noreferrer" className="text-xs text-white/45 transition-opacity duration-200 hover:opacity-80">Développé par <strong className="text-white/70">Sama Site</strong></a>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX PHOTO PRODUIT (21/09/2026, point 3) : photo affichée en
          entier avec son ratio d'origine (object-contain, jamais recadrée),
          fermeture par la croix, un clic en dehors de la photo, ou Échap. */}
      {imageOuverte && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-8 entree-douce"
          style={{ background: "rgba(15,23,42,.92)" }}
          onClick={() => setImageOuverte(null)}
        >
          <button
            type="button"
            onClick={() => setImageOuverte(null)}
            aria-label="Fermer"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white/20"
            style={{ background: "rgba(255,255,255,.12)" }}
          >
            <X size={20} color="#fff" />
          </button>
          <img
            src={imageOuverte.image}
            alt={imageOuverte.texte}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {(imageOuverte.texte || imageOuverte.prix) && (
            <div className="mt-4 text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-white font-bold text-sm sm:text-base">{imageOuverte.texte}</p>
              {imageOuverte.prix && <p className="text-white/70 text-xs sm:text-sm mt-1">{imageOuverte.prix}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
