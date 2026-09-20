"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, User, CalendarDays } from "lucide-react";
import { T, SECTEURS } from "../../../lib/data";
import { supabase } from "../../../lib/supabaseClient";
import NavPublic from "../../../components/NavPublic";
import EditerSite from "../../../components/EditerSite";

export default function PageSiteParJeton({ params }) {
  const { token } = params;
  const [site, setSite] = useState(null);
  const [session, setSession] = useState(undefined); // undefined = pas encore vérifié
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [rattachementEnCours, setRattachementEnCours] = useState(false);
  const [continuerSansCompte, setContinuerSansCompte] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);

      const { data, error } = await supabase.rpc("obtenir_site_par_jeton", { p_token: token });
      if (error || !data || data.length === 0) {
        setErreur("Ce lien est invalide ou a expiré.");
        setChargement(false);
        return;
      }
      const siteTrouve = data[0];
      setSite(siteTrouve);

      // Si l'utilisateur est déjà connecté et que le site n'appartient à personne,
      // on le rattache automatiquement à son compte.
      if (sessionData.session && !siteTrouve.user_id) {
        setRattachementEnCours(true);
        const { error: erreurRattachement } = await supabase.rpc("rattacher_site", { p_token: token });
        if (!erreurRattachement) {
          const { data: dataMaj } = await supabase.rpc("obtenir_site_par_jeton", { p_token: token });
          if (dataMaj && dataMaj[0]) setSite(dataMaj[0]);
        }
        setRattachementEnCours(false);
      }

      setChargement(false);
    };
    init();
  }, [token]);

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
          <p className="text-sm mb-6" style={{ color: T.gris }}>Vérifiez que vous avez bien copié le lien complet, ou créez un nouveau site.</p>
          <Link href="/creer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white" style={{ background: T.bleu }}>
            Créer un site <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const secteur = SECTEURS.find((s) => s.id === site.secteur_id);
  const appartientAUnAutre = site.user_id && (!session || site.user_id !== session.user.id);

  if (appartientAUnAutre) {
    return (
      <div>
        <NavPublic />
        <div className="max-w-md mx-auto px-5 py-20 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: T.jauneFond }}>
            <User size={24} color={T.jauneFonce} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: T.encre }}>Ce site est déjà rattaché à un compte</h2>
          <p className="text-sm mb-6" style={{ color: T.gris }}>Connectez-vous avec le compte qui a créé ce site pour le gérer, depuis "Mon espace".</p>
          <Link href={`/connexion?retour=/site/${token}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white" style={{ background: T.bleu }}>
            Se connecter <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Pas connecté, site pas encore rattaché : proposer de se connecter, de créer
  // un compte, ou de continuer sans compte (modification via le lien seulement).
  if (!session && !site.user_id && !continuerSansCompte) {
    return (
      <div>
        <NavPublic />
        <div className="max-w-md mx-auto px-5 py-16 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: T.bleuClair }}>
            <CalendarDays size={24} color={T.bleu} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: T.encre }}>{site.nom_entreprise}</h2>
          <p className="text-sm mb-8" style={{ color: T.gris }}>{secteur?.label}</p>

          <div className="rounded-2xl p-5 mb-6 text-left" style={{ background: T.bleuClair }}>
            <p className="text-sm font-semibold mb-1" style={{ color: T.encre }}>Créez un compte pour ne plus jamais perdre ce site</p>
            <p className="text-xs" style={{ color: T.gris }}>Vous pourrez le retrouver, le modifier et gérer plusieurs sites depuis un seul endroit — même après l'expiration de ce lien.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link href={`/inscription?retour=/site/${token}`} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white" style={{ background: T.bleu }}>
              Créer un compte <ArrowRight size={16} />
            </Link>
            <Link href={`/connexion?retour=/site/${token}`} className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold" style={{ border: `1.5px solid ${T.bleuClairBord}`, color: T.encre }}>
              J'ai déjà un compte
            </Link>
          </div>

          <button onClick={() => setContinuerSansCompte(true)} className="text-xs mt-6" style={{ color: T.gris, textDecoration: "underline" }}>
            Continuer sans compte pour l'instant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavPublic />
      {rattachementEnCours && <p className="text-center py-3 text-xs" style={{ color: T.gris }}>Rattachement à votre compte…</p>}
      <EditerSite mode={session && site.user_id === session.user.id ? "owned" : "token"} token={token} site={site} />
    </div>
  );
}
