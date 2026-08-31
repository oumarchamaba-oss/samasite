"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, ArrowRight, Briefcase, Phone, Lock, ChevronDown, LayoutTemplate, Palette as PaletteIcon, ShoppingCart, Headphones, Smartphone, ShieldCheck } from "lucide-react";
import {
  T, SECTEURS, CLIENTS_CONFIANCE, FAQ, COMMENT_CA_MARCHE,
  WHATSAPP_SUPPORT, WHATSAPP_AVATAR, LOGO_SAMASITE, DrapeauSenegal, Badge,
} from "../lib/data";
import { IMG_HERO, IMG_TRUST1, IMG_TRUST2, IMG_TRUST3, IMG_TRUST4 } from "../lib/images";

export default function Accueil({ clients }) {
  const [faqOuverte, setFaqOuverte] = useState(null);

  const confianceComplete = useMemo(() => {
    const nomsStatiques = new Set(CLIENTS_CONFIANCE.map((c) => c.nom));
    const dynamiques = clients
      .filter((c) => c.statut !== "expire" && !nomsStatiques.has(c.nom))
      .map((c) => {
        const secteurObj = SECTEURS.find((s) => s.id === c.secteurId) || SECTEURS.find((s) => s.label === c.secteur);
        return {
          nom: c.nom,
          secteur: c.secteur,
          icon: secteurObj ? secteurObj.icon : Briefcase,
          description: secteurObj ? secteurObj.description : "Un site créé avec Sama Site.",
          domaine: c.domaine,
        };
      });
    const statiquesAvecDescription = CLIENTS_CONFIANCE.map((c) => {
      const secteurObj = SECTEURS.find((s) => s.label === c.secteur);
      return { ...c, description: secteurObj ? secteurObj.description : "Un site créé avec Sama Site." };
    });
    return [...statiquesAvecDescription, ...dynamiques];
  }, [clients]);

  return (
    <div>
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-5 pt-14 pb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 mb-5">
              <Badge tone="jaune"><Sparkles size={11} /> 2 jours d'essai gratuit, sans carte bancaire</Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight" style={{ color: T.encre }}>
              Votre site de vente, prêt en <span style={{ color: T.bleu }}>10 minutes</span>
            </h1>
            <p className="mt-5 text-base max-w-lg mx-auto md:mx-0" style={{ color: T.gris }}>
              Sama Site crée le mini-site de votre commerce, avec commande directe sur WhatsApp — sans savoir coder, sans agence.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start items-center">
              <Link href="/creer" className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold" style={{ background: T.bleu, color: T.blanc }}>
                Créer mon site gratuitement <ArrowRight size={16} />
              </Link>
              <button onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
                className="px-7 py-3.5 rounded-full text-sm font-semibold" style={{ background: T.bleuClair, color: T.bleu }}>
                Voir les catégories
              </button>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden flex items-center justify-center p-4" style={{ background: T.bleuClair }}>
            <img src={IMG_HERO} alt="Entrepreneure sénégalaise gérant son catalogue de produits sur Sama Site, depuis son téléphone et son ordinateur" className="w-full h-auto object-contain rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Pourquoi Sama Site */}
      <div className="max-w-5xl mx-auto px-5 py-14">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ color: T.encre }}>Pourquoi Sama Site</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {[
            { icon: LayoutTemplate, titre: "Modèles professionnels", texte: "9 secteurs d'activité, chacun avec son style adapté." },
            { icon: PaletteIcon, titre: "Personnalisation facile", texte: "Couleurs, logo, produits et contenu, sans coder." },
            { icon: ShoppingCart, titre: "Commande WhatsApp intégrée", texte: "Vos clients commandent en un clic, où qu'ils soient." },
            { icon: Headphones, titre: "Support client 7j/7", texte: "Une question ? Une équipe vous répond sur WhatsApp." },
            { icon: Smartphone, titre: "100% responsive", texte: "Un rendu soigné, sur ordinateur comme sur smartphone." },
            { icon: ShieldCheck, titre: "Site hébergé et sécurisé", texte: "Votre site en ligne, sans vous soucier de la technique." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: T.bleuClair }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: T.blanc }}>
                <f.icon size={20} color={T.bleu} strokeWidth={1.8} />
              </div>
              <div className="font-semibold text-sm mb-1" style={{ color: T.encre }}>{f.titre}</div>
              <div className="text-xs leading-relaxed" style={{ color: T.gris }}>{f.texte}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="py-14" style={{ background: T.blanc }}>
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: T.encre }}>Comment ça marche</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {COMMENT_CA_MARCHE.map((e, i) => {
              const EtapeIcon = e.icon;
              const tons = [
                { fond: T.bleuClair, accent: T.bleu },
                { fond: T.jauneFond, accent: T.jauneFonce },
                { fond: T.vertFond, accent: T.vert },
                { fond: T.rougeFond, accent: T.rouge },
              ];
              const ton = tons[i % tons.length];
              return (
                <div key={e.n} className="rounded-2xl p-5" style={{ background: ton.fond }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: T.blanc }}>
                    <EtapeIcon size={20} color={ton.accent} strokeWidth={1.8} />
                  </div>
                  <div className="text-xs font-bold mb-1" style={{ color: ton.accent }}>Étape {e.n}</div>
                  <div className="font-semibold text-sm mb-1" style={{ color: T.encre }}>{e.titre}</div>
                  <div className="text-xs leading-relaxed" style={{ color: T.gris }}>{e.texte}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Catégories */}
      <div id="categories" className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: T.encre }}>Une catégorie pour chaque activité</h2>
        <p className="text-sm text-center mb-10" style={{ color: T.gris }}>Cliquez sur votre secteur pour commencer à créer votre site.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTEURS.map((s) => (
            <Link key={s.id} href={`/creer?secteur=${s.id}`} className="text-left rounded-2xl overflow-hidden transition-colors group block"
              style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
              <div className="flex items-center justify-center p-4" style={{ background: "#F8FAFC", height: 140 }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: s.couleurBadge }}>
                  <s.icon size={30} color="#fff" strokeWidth={1.8} />
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold" style={{ color: T.encre }}>{s.label}</div>
                  <ArrowRight size={16} color={T.bleu} className="shrink-0" />
                </div>
                <div className="text-xs mt-1" style={{ color: T.gris }}>{s.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Confiance */}
      <div className="py-16" style={{ background: T.bleuFonce }}>
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: T.blanc }}>Ils ont créé leur site avec Sama Site</h2>
          <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Des commerces sénégalais qui utilisent déjà notre solution, en essai comme en abonnement.
          </p>
          <div className="flex items-center justify-center gap-6 sm:gap-10 mb-10 flex-wrap">
            {[IMG_TRUST1, IMG_TRUST2, IMG_TRUST3, IMG_TRUST4].map((src, i) => (
              <img key={i} src={src} alt="" className="h-9 w-auto opacity-90" />
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {confianceComplete.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="rounded-2xl p-4 flex items-start gap-3.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(250,204,21,0.15)" }}>
                    <Icon size={18} color={T.jaune} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: T.blanc }}>{c.nom}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{c.secteur}</div>
                    <div className="text-xs mt-1 leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>{c.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tarifs */}
      <div className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: T.encre }}>Un tarif simple, une seule offre</h2>
        <p className="text-sm text-center mb-10" style={{ color: T.gris }}>Un essai gratuit, puis un abonnement clair avec votre domaine inclus.</p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="rounded-2xl p-6" style={{ background: T.blanc, border: `2px solid ${T.bleuClairBord}` }}>
            <div className="font-bold" style={{ color: T.encre }}>Essai gratuit</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold" style={{ color: T.bleu }}>0 F</span>
              <span className="text-xs" style={{ color: T.gris }}>/ 2 jours</span>
            </div>
            <div className="text-xs mb-4" style={{ color: T.gris }}>Sans carte bancaire, sans engagement</div>
            <ul className="space-y-2">
              {["Sous-domaine samasite.com", "Site publié et modifiable", "Contact via WhatsApp"].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: T.encre }}>
                  <CheckCircle2 size={15} color={T.vert} className="mt-0.5 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-6 relative" style={{ background: T.blanc, border: `2px solid ${T.bleu}` }}>
            <div className="absolute -top-3 left-6"><Badge tone="jaune"><Sparkles size={11} /> Site + domaine</Badge></div>
            <div className="font-bold" style={{ color: T.encre }}>Site en ligne</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold" style={{ color: T.bleu }}>25 000 F</span>
              <span className="text-xs" style={{ color: T.gris }}>/ 6 mois</span>
            </div>
            <div className="text-xs mb-4" style={{ color: T.gris }}>Domaine .com inclus · .sn disponible à 35 000 F/6 mois</div>
            <ul className="space-y-2">
              {["Nom de domaine livré sous 48h", "Site publié et modifiable", "Contact via WhatsApp", "Paiement annuel disponible, moins cher"].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: T.encre }}>
                  <CheckCircle2 size={15} color={T.vert} className="mt-0.5 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-16" style={{ background: T.bleuClair }}>
        <div className="max-w-2xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: T.encre }}>Questions fréquentes</h2>
          <div className="space-y-2.5">
            {FAQ.map((f, i) => {
              const ouvert = faqOuverte === i;
              return (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
                  <button onClick={() => setFaqOuverte(ouvert ? null : i)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                    <span className="font-semibold text-sm" style={{ color: T.encre }}>{f.q}</span>
                    <ChevronDown size={18} color={T.gris} style={{ transform: ouvert ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                  </button>
                  {ouvert && <div className="px-5 pb-4 text-sm" style={{ color: T.gris }}>{f.r}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA final */}
      <div className="max-w-5xl mx-auto px-5 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3" style={{ color: T.encre }}>Prêt à vendre en ligne dès aujourd'hui ?</h2>
        <Link href="/creer" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold" style={{ background: T.bleu, color: T.blanc }}>
          Créer mon site gratuitement <ArrowRight size={16} />
        </Link>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.bleuClairBord}`, background: "#F8FAFC" }}>
        <div className="max-w-5xl mx-auto px-5 py-10">
          <a href={`https://wa.me/${WHATSAPP_SUPPORT}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3.5 rounded-2xl p-4 mb-8" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
            <img src={WHATSAPP_AVATAR} alt="Assistance Sama Site" className="w-12 h-12 rounded-full object-cover shrink-0" style={{ border: `2px solid #25D366` }} />
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: T.encre }}>Contactez-nous sur WhatsApp</div>
              <div className="text-xs" style={{ color: T.gris }}>Besoin d'être assisté ? Écrivez-nous, on répond vite.</div>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#25D366" }}>
              <Phone size={16} color="#fff" />
            </div>
          </a>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src={LOGO_SAMASITE} alt="Sama Site" className="h-6 w-auto" />
              <DrapeauSenegal size={12} />
            </div>
            <span className="text-xs" style={{ color: T.gris }}>© 2026 Sama Site — Dakar, Sénégal</span>
            <Link href="/admin/login" className="text-xs flex items-center gap-1" style={{ color: "#CBD5E1" }}>
              <Lock size={11} /> Espace partenaire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   PARCOURS DE CRÉATION (wizard) — état géré par App
--------------------------------------------------------- */
