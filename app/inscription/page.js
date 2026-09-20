"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { T, LOGO_SAMASITE } from "../../lib/data";
import { supabase } from "../../lib/supabaseClient";

function FormulaireInscription() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [chargementGoogle, setChargementGoogle] = useState(false);
  const [inscrit, setInscrit] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const retour = searchParams.get("retour") || "/espace";

  const sInscrire = async () => {
    setErreur("");
    if (motDePasse.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setChargement(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${retour}` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: motDePasse,
      options: { emailRedirectTo: redirectTo },
    });
    setChargement(false);
    if (error) {
      setErreur(error.message.includes("already registered") ? "Un compte existe déjà avec cet e-mail." : "Impossible de créer le compte. Réessayez.");
      return;
    }
    // Si la confirmation par e-mail est désactivée sur le projet Supabase, une session est
    // déjà active : on peut continuer directement. Sinon, on informe l'utilisateur.
    if (data.session) {
      router.push(retour);
    } else {
      setInscrit(true);
    }
  };

  const sInscrireAvecGoogle = async () => {
    setChargementGoogle(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${retour}` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setErreur("La connexion Google n'est pas disponible pour l'instant.");
      setChargementGoogle(false);
    }
  };

  if (inscrit) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: T.bleuClair }}>
        <div className="max-w-sm w-full rounded-2xl p-8 text-center" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: T.vertFond }}>
            <CheckCircle2 size={26} color={T.vert} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: T.encre }}>Compte créé</h2>
          <p className="text-sm mb-6" style={{ color: T.gris }}>Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous.</p>
          <Link href="/connexion" className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold" style={{ background: T.bleu, color: T.blanc }}>
            Aller à la connexion <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: T.bleuClair }}>
      <div className="max-w-sm w-full rounded-2xl p-8" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
        <div className="flex justify-center mb-6">
          <img src={LOGO_SAMASITE} alt="Sama Site" className="h-7 w-auto" />
        </div>
        <h2 className="text-xl font-bold mb-1 text-center" style={{ color: T.encre }}>Créer un compte</h2>
        <p className="text-xs mb-6 text-center" style={{ color: T.gris }}>Gérez tous vos sites Sama Site depuis un seul endroit.</p>

        <button onClick={sInscrireAvecGoogle} disabled={chargementGoogle}
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
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="vous@exemple.com"
            className="flex-1 py-3 text-sm outline-none bg-transparent" style={{ color: T.encre }} />
        </div>

        <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Mot de passe</label>
        <div className="flex items-center gap-2 rounded-xl px-3.5 mb-2" style={{ border: `1.5px solid ${T.bleuClairBord}` }}>
          <Lock size={15} color={T.gris} />
          <input value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sInscrire()}
            type={voir ? "text" : "password"} placeholder="6 caractères minimum" className="flex-1 py-3 text-sm outline-none bg-transparent" style={{ color: T.encre }} />
          <button type="button" onClick={() => setVoir((v) => !v)}>{voir ? <EyeOff size={15} color={T.gris} /> : <Eye size={15} color={T.gris} />}</button>
        </div>

        {erreur && <p className="text-xs mb-3" style={{ color: T.rouge }}>{erreur}</p>}

        <button onClick={sInscrire} disabled={chargement}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold mt-2 mb-4 disabled:opacity-60"
          style={{ background: T.bleu, color: T.blanc }}>
          {chargement ? "Création…" : <>Créer mon compte <ArrowRight size={15} /></>}
        </button>

        <p className="text-xs text-center" style={{ color: T.gris }}>
          Déjà un compte ?{" "}
          <Link href={`/connexion?retour=${encodeURIComponent(retour)}`} className="font-semibold" style={{ color: T.bleu }}>Se connecter</Link>
        </p>
        <Link href="/" className="text-xs block text-center mt-4" style={{ color: T.gris }}>Retour au site</Link>
      </div>
    </div>
  );
}

export default function PageInscription() {
  return (
    <Suspense fallback={null}>
      <FormulaireInscription />
    </Suspense>
  );
}
