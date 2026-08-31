import { Suspense } from "react";
import NavPublic from "../../components/NavPublic";
import CreerSite from "../../components/CreerSite";

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
