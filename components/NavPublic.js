"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X, Menu } from "lucide-react";
import { T, LOGO_SAMASITE, DrapeauSenegal } from "../lib/data";

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
        <Link href="/" className="flex items-center gap-2">
          <img src={LOGO_SAMASITE} alt="Sama Site" className="h-7 w-auto" />
          <DrapeauSenegal size={14} />
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-full text-sm font-semibold"
              style={{ background: pathname === l.href ? T.bleuClair : "transparent", color: pathname === l.href ? T.bleu : T.gris }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/creer"
            className="ml-2 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold"
            style={{ background: T.jaune, color: T.bleuFonce }}
          >
            <Sparkles size={14} /> Créer mon site
          </Link>
        </div>

        <button className="sm:hidden" onClick={() => setMenuOuvert((v) => !v)} aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}>
          {menuOuvert ? <X size={22} color={T.encre} /> : <Menu size={22} color={T.encre} />}
        </button>
      </div>

      {menuOuvert && (
        <div className="sm:hidden px-5 pb-4 flex flex-col gap-1.5">
          {liens.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOuvert(false)}
              className="text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: pathname === l.href ? T.bleuClair : "transparent", color: pathname === l.href ? T.bleu : T.gris }}>
              {l.label}
            </Link>
          ))}
          <Link href="/creer" onClick={() => setMenuOuvert(false)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold mt-1"
            style={{ background: T.jaune, color: T.bleuFonce }}>
            <Sparkles size={14} /> Créer mon site
          </Link>
        </div>
      )}
    </div>
  );
}
