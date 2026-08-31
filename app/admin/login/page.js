"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { T, LOGO_SAMASITE } from "../../../lib/data";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voirMotDePasse, setVoirMotDePasse] = useState(false);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const router = useRouter();

  const seConnecter = async () => {
    setChargement(true);
    setErreur("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse });
    setChargement(false);
    if (error) {
      setErreur("E-mail ou mot de passe incorrect.");
      return;
    }
    router.push("/admin/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bleuFonce }} className="flex items-center justify-center px-5">
      <div className="max-w-sm w-full rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="inline-flex items-center justify-center rounded-xl px-3 py-2 mx-auto mb-5 block" style={{ background: T.blanc, width: "fit-content", margin: "0 auto 20px" }}>
          <img src={LOGO_SAMASITE} alt="Sama Site" className="h-5 w-auto" />
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: T.jaune }}>
          <ShieldCheck size={22} color={T.bleuFonce} strokeWidth={2.2} />
        </div>
        <h2 className="text-xl font-bold mb-1 text-center" style={{ color: T.blanc }}>Espace partenaire</h2>
        <p className="text-xs mb-6 text-center" style={{ color: "rgba(255,255,255,0.55)" }}>Accès réservé à l'administration de Sama Site.</p>

        <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Adresse e-mail</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && seConnecter()}
          type="email" placeholder="vous@exemple.com"
          className="w-full rounded-xl px-4 py-3 mb-4 text-sm outline-none" style={{ background: "rgba(255,255,255,0.08)", color: T.blanc, border: "1px solid rgba(255,255,255,0.15)" }} />

        <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>Mot de passe</label>
        <div className="flex items-center rounded-xl mb-2 px-4" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <input value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} onKeyDown={(e) => e.key === "Enter" && seConnecter()}
            type={voirMotDePasse ? "text" : "password"} placeholder="••••••••"
            className="flex-1 py-3 text-sm outline-none bg-transparent" style={{ color: T.blanc }} />
          <button type="button" onClick={() => setVoirMotDePasse((v) => !v)} style={{ color: "rgba(255,255,255,0.5)" }}>
            {voirMotDePasse ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {erreur && <p className="text-xs mb-3" style={{ color: "#FCA5A5" }}>{erreur}</p>}

        <button onClick={seConnecter} disabled={chargement} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold mb-3 mt-2 disabled:opacity-60" style={{ background: T.jaune, color: T.bleuFonce }}>
          {chargement ? "Connexion…" : <>Se connecter <ArrowRight size={15} /></>}
        </button>
        <Link href="/" className="text-xs w-full text-center block" style={{ color: "rgba(255,255,255,0.5)" }}>Retour au site</Link>
      </div>
    </div>
  );
}
