import { Suspense } from "react";
import NavPublic from "../../components/NavPublic";
import CreerSite from "../../components/CreerSite";

export const metadata = {
  title: "Créer mon site WhatsApp",
  description: "Créez votre site e-commerce WhatsApp gratuitement en quelques minutes, sans coder — 2 jours d'essai, sans carte bancaire.",
};

export default function PageCreer() {
  return (
    <div>
      <NavPublic />
      {/* Suspense requis par Next.js pour useSearchParams() (lecture de ?secteur=...) */}
      <Suspense fallback={<p className="text-center py-20 text-slate-400">Chargement…</p>}>
        <CreerSite />
      </Suspense>
    </div>
  );
}
