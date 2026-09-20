import Link from "next/link";
import { T, LOGO_SAMASITE } from "../lib/data";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center" style={{ background: T.bleuClair }}>
      <img src={LOGO_SAMASITE} alt="Sama Site" className="h-7 w-auto mb-6" />
      <h1 className="text-2xl font-bold mb-2" style={{ color: T.encre }}>Page introuvable</h1>
      <p className="text-sm mb-6" style={{ color: T.gris }}>Cette page n'existe pas ou plus.</p>
      <Link href="/" className="px-5 py-3 rounded-full text-sm font-bold text-white" style={{ background: T.bleu }}>
        Retour à l'accueil
      </Link>
    </div>
  );
}
