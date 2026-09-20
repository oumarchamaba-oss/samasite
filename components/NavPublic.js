"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X, Menu } from "lucide-react";
import { T, LOGO_SAMASITE, DrapeauSenegal, WHATSAPP_SUPPORT, WHATSAPP_AVATAR } from "../lib/data";

export default function NavPublic() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const pathname = usePathname();
  const liens = [
    { href: "/", label: "Accueil" },
    { href: "/espace", label: "Mon espace" },
  ];

  return (
    <div className="sticky top-0 z-20 bg-white" style={{ borderBottom: `1px solid ${T.bleuClairBord}` }}>
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-75">
          <img src={LOGO_SAMASITE} alt="Sama Site" className="h-7 w-auto" />
          <DrapeauSenegal size={14} />
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-full text-sm font-semibold transition-colors duration-200"
              style={{ background: pathname === l.href ? T.bleuClair : "transparent", color: pathname === l.href ? T.bleu : T.gris }}
            >
              {l.label}
            </Link>
          ))}
          <a href={`https://wa.me/${WHATSAPP_SUPPORT}`} target="_blank" rel="noopener noreferrer" title="Contactez-nous sur WhatsApp"
            className="relative ml-1 shrink-0 transition-transform duration-200 hover:scale-105">
            <img src={WHATSAPP_AVATAR} alt="Assistance Sama Site sur WhatsApp" className="w-9 h-9 rounded-full object-cover" style={{ border: "2px solid #25D366" }} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "#25D366", border: "1.5px solid #fff" }} />
          </a>
          <Link
            href="/creer"
            className="bouton-hover ml-2 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold"
            style={{ background: T.jaune, color: T.bleuFonce }}
          >
            <Sparkles size={14} /> Créer mon site
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:hidden">
          <a href={`https://wa.me/${WHATSAPP_SUPPORT}`} target="_blank" rel="noopener noreferrer" title="Contactez-nous sur WhatsApp" className="relative shrink-0">
            <img src={WHATSAPP_AVATAR} alt="Assistance Sama Site sur WhatsApp" className="w-8 h-8 rounded-full object-cover" style={{ border: "2px solid #25D366" }} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: "#25D366", border: "1.5px solid #fff" }} />
          </a>
          <button onClick={() => setMenuOuvert((v) => !v)} aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"} className="transition-transform duration-200 active:scale-90">
            {menuOuvert ? <X size={22} color={T.encre} /> : <Menu size={22} color={T.encre} />}
          </button>
        </div>
      </div>

      <div className="sm:hidden overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: menuOuvert ? 240 : 0 }}>
        <div className="px-5 pb-4 flex flex-col gap-1.5">
          {liens.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOuvert(false)}
              className="text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
              style={{ background: pathname === l.href ? T.bleuClair : "transparent", color: pathname === l.href ? T.bleu : T.gris }}>
              {l.label}
            </Link>
          ))}
          <Link href="/creer" onClick={() => setMenuOuvert(false)}
            className="bouton-hover flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold mt-1"
            style={{ background: T.jaune, color: T.bleuFonce }}>
            <Sparkles size={14} /> Créer mon site
          </Link>
        </div>
      </div>
    </div>
  );
}
