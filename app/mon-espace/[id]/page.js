"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { T } from "../../../lib/data";
import { supabase } from "../../../lib/supabaseClient";
import NavPublic from "../../../components/NavPublic";
import EditerSite from "../../../components/EditerSite";

export default function PageGererSite({ params }) {
  const { id } = params;
  const [site, setSite] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push(`/connexion?retour=/mon-espace/${id}`);
        return;
      }
      // La RLS ne renvoie ce site que s'il appartient bien à l'utilisateur connecté
      // (ou si c'est l'administrateur) — sinon la ligne n'apparaît simplement pas.
      // BUG CORRIGÉ (21/09/2026) : cette requête ne filtrait pas supprime_le, donc
      // un site que le propriétaire venait de supprimer restait accessible et
      // modifiable via ce lien direct — contredisant le message de confirmation de
      // suppression ("le site ne sera plus accessible, ni par vous ni par vos
      // clients"). Voir aussi supprimer_site_proprietaire() côté base.
      const { data, error } = await supabase.from("sites").select("*").eq("id", id).is("supprime_le", null).single();
      if (error || !data) {
        setErreur("Ce site est introuvable, ou ne vous appartient pas.");
      } else {
        setSite(data);
      }
      setChargement(false);
    };
    init();
  }, [id, router]);

  if (chargement) {
    return (
      <div>
        <NavPublic />
        <p className="text-center py-24" style={{ color: T.gris }}>Chargement…</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div>
        <NavPublic />
        <div className="max-w-md mx-auto px-5 py-20 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: T.rougeFond }}>
            <AlertCircle size={24} color={T.rouge} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: T.encre }}>{erreur}</h2>
          <Link href="/espace" className="text-sm font-semibold" style={{ color: T.bleu }}>Retour à mon espace</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavPublic />
      <div className="max-w-2xl mx-auto px-5 pt-8">
        <Link href="/espace" className="flex items-center gap-2 text-sm font-semibold" style={{ color: T.bleu }}>
          <ArrowLeft size={16} /> Tous mes sites
        </Link>
      </div>
      <EditerSite mode="owned" site={site} />
    </div>
  );
}
