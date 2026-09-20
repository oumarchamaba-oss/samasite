"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { T, LOGO_SAMASITE } from "../../lib/data";
import { supabase } from "../../lib/supabaseClient";

function FormulaireConnexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [chargementGoogle, setChargementGoogle] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const retour = searchParams.get("retour") || "/espace";

  const seConnecter = async () => {
    setChargement(true);
    setErreur("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse });
    setChargement(false);
    if (error) {
      setErreur("E-mail ou mot de passe incorrect.");
      return;
    }
    router.push(retour);
  };

  const seConnecterAvecGoogle = async () => {
    setChargementGoogle(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${retour}` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setErreur("La connexion Google n'est pas disponible pour l'instant.");
      setChargementGoogle(false);
    }
    // En cas de succès, Supabase redirige automatiquement — pas besoin d'action ici.
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: T.bleuClair }}>
      <div className="max-w-sm w-full rounded-2xl p-8" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
        <div className="flex justify-center mb-6">
          <img src={LOGO_SAMASITE} alt="Sama Site" className="h-7 w-auto" />
        </div>
        <h2 className="text-xl font-bold mb-1 text-center" style={{ color: T.encre }}>Connexion</h2>
        <p className="text-xs mb-6 text-center" style={{ color: T.gris }}>Retrouvez et gérez tous vos sites Sama Site.</p>

        <button onClick={seConnecterAvecGoogle} disabled={chargementGoogle}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold mb-4 disabled:opacity-60"
          style={{ border: `1.5px solid ${T.bleuClairBord}`, color: T.encre }}>
          {chargementGoogle ? "Connexion…" : <>Continuer avec Google</>}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: T.bleuClairBord }} />
          <span className="text-xs" style={{ color: T.gris }}>ou</span>
          <div className="flex-1 h-px" style={{ background: T.bleuClairBord }} />
        </div>

        <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Adresse e-mail</label>
        <div className="flex items-center gap-2 rounded-xl px-3.5 mb-4" style={{ border: `1.5px solid ${T.bleuClairBord}` }}>
          <Mail size={15} color={T.gris} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && seConnecter()}
            type="email" placeholder="vous@exemple.com" className="flex-1 py-3 text-sm outline-none bg-transparent" style={{ color: T.encre }} />
        </div>

        <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Mot de passe</label>
        <div className="flex items-center gap-2 rounded-xl px-3.5 mb-2" style={{ border: `1.5px solid ${T.bleuClairBord}` }}>
          <Lock size={15} color={T.gris} />
          <input value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} onKeyDown={(e) => e.key === "Enter" && seConnecter()}
            type={voir ? "text" : "password"} placeholder="••••••••" className="flex-1 py-3 text-sm outline-none bg-transparent" style={{ color: T.encre }} />
          <button type="button" onClick={() => setVoir((v) => !v)}>{voir ? <EyeOff size={15} color={T.gris} /> : <Eye size={15} color={T.gris} />}</button>
        </div>

        {erreur && <p className="text-xs mb-3" style={{ color: T.rouge }}>{erreur}</p>}

        <button onClick={seConnecter} disabled={chargement}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold mt-2 mb-4 disabled:opacity-60"
          style={{ background: T.bleu, color: T.blanc }}>
          {chargement ? "Connexion…" : <>Se connecter <ArrowRight size={15} /></>}
        </button>

        <p className="text-xs text-center" style={{ color: T.gris }}>
          Pas encore de compte ?{" "}
          <Link href={`/inscription?retour=${encodeURIComponent(retour)}`} className="font-semibold" style={{ color: T.bleu }}>Créer un compte</Link>
        </p>
        <Link href="/" className="text-xs block text-center mt-4" style={{ color: T.gris }}>Retour au site</Link>
      </div>
    </div>
  );
}

export default function PageConnexion() {
  return (
    <Suspense fallback={null}>
      <FormulaireConnexion />
    </Suspense>
  );
}
