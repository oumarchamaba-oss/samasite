"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Clock, CheckCircle2, ArrowRight, Globe, Edit3, LogOut, Lock } from "lucide-react";
import { T, SECTEURS, WHATSAPP_SUPPORT, WHATSAPP_AVATAR, Badge } from "../lib/data";
import { supabase } from "../lib/supabaseClient";

// Le statut "expire" n'est presque jamais posé automatiquement en base (rien
// n'y écrit tout seul quand une date passe) — on calcule donc l'expiration
// réelle à partir des dates, exactement comme le fait déjà EditerSite.js
// (estModifiable), pour que "Mon espace" reflète la réalité même quand le
// client n'a pas rouvert son site depuis que le délai est dépassé.
function statutReel(site) {
  const maintenant = new Date();
  if (site.statut === "actif") {
    if (site.abonnement_expire_le && new Date(site.abonnement_expire_le) <= maintenant) return "abonnement_expire";
    return "actif";
  }
  if (["essai", "a_livrer"].includes(site.statut)) {
    if (site.essai_expire_le && new Date(site.essai_expire_le) <= maintenant) return "essai_expire";
    return "essai";
  }
  return site.statut; // "expire" littéral, si jamais posé manuellement
}

function CarteSite({ site }) {
  const secteur = SECTEURS.find((s) => s.id === site.secteur_id);
  const nom = site.nom_entreprise || secteur?.demo?.nom || "Mon site";
  const paye = site.statut === "actif";
  // Lien réellement fonctionnel : tant qu'aucun nom de domaine personnalisé
  // n'est réellement raccordé (DNS pointé vers Sama Site), le seul lien qui
  // ouvre vraiment le site est celui-ci — voir app/site/[token]/page.js.
  const lien = paye && site.domaine ? site.domaine : `samasite.online/site/${site.edit_token}`;
  const statut = statutReel(site);

  return (
    <div className="rounded-2xl p-5 mb-4" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-lg" style={{ color: T.encre }}>{nom}</div>
          <div className="text-xs mt-0.5" style={{ color: T.gris }}>{secteur?.label}</div>
        </div>
        {statut === "actif" && <Badge tone="vert"><CheckCircle2 size={11} /> Actif</Badge>}
        {statut === "abonnement_expire" && <Badge tone="rouge"><Clock size={11} /> Abonnement expiré</Badge>}
        {site.statut === "a_livrer" && statut === "essai" && <Badge tone="jaune"><Clock size={11} /> Paiement en attente</Badge>}
        {statut === "essai" && site.statut === "essai" && <Badge tone="jaune"><Clock size={11} /> Essai en cours</Badge>}
        {statut === "essai_expire" && <Badge tone="rouge"><Clock size={11} /> Essai terminé — non payé</Badge>}
        {statut === "expire" && <Badge tone="rouge"><Clock size={11} /> Expiré</Badge>}
      </div>
      <a href={paye && site.domaine ? `https://${site.domaine}` : `/site/${site.edit_token}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-lg mb-4" style={{ background: T.bleuClair, color: T.bleu, textDecoration: "underline" }}>
        <Globe size={14} /> {lien}
      </a>
      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/mon-espace/${site.id}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ background: T.bleuClair, color: T.bleu }}>
          <Edit3 size={13} /> Gérer ce site
        </Link>
        {statut === "essai_expire" && (
          <Link href={`/mon-espace/${site.id}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold" style={{ background: T.jaune, color: T.bleuFonce }}>
            Payer maintenant
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MonEspace() {
  const [session, setSession] = useState(undefined);
  const [sites, setSites] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [jetonLocal, setJetonLocal] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);

      if (sessionData.session) {
        const { data } = await supabase.from("sites").select("*").eq("user_id", sessionData.session.user.id).order("created_at", { ascending: false });
        setSites(data || []);
      } else if (typeof window !== "undefined") {
        setJetonLocal(window.localStorage.getItem("sama_site_token"));
      }
      setChargement(false);
    };
    init();
  }, []);

  const seDeconnecter = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSites([]);
  };

  if (chargement) {
    return <p className="text-center py-20" style={{ color: T.gris }}>Chargement…</p>;
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: T.bleuClair }}>
          <Lock size={24} color={T.bleu} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: T.encre }}>Connectez-vous pour gérer vos sites</h2>
        <p className="text-sm mb-8" style={{ color: T.gris }}>Un compte vous permet de créer, modifier et suivre plusieurs sites depuis un seul endroit.</p>

        <div className="flex flex-col gap-2.5 mb-6">
          <Link href="/connexion?retour=/espace" className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white" style={{ background: T.bleu }}>
            Se connecter <ArrowRight size={16} />
          </Link>
          <Link href="/inscription?retour=/espace" className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold" style={{ border: `1.5px solid ${T.bleuClairBord}`, color: T.encre }}>
            Créer un compte
          </Link>
        </div>

        {jetonLocal && (
          <Link href={`/site/${jetonLocal}`} className="text-xs" style={{ color: T.bleu, textDecoration: "underline" }}>
            Accéder au dernier site créé sur cet appareil
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: T.encre }}>Mon espace</h2>
        <button onClick={seDeconnecter} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: T.gris }}>
          <LogOut size={13} /> Se déconnecter
        </button>
      </div>

      {sites.length === 0 ? (
        <div className="rounded-2xl p-8 text-center mb-6" style={{ background: T.bleuClair }}>
          <p className="text-sm mb-4" style={{ color: T.encre }}>Vous n'avez pas encore de site.</p>
          <Link href="/creer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white" style={{ background: T.bleu }}>
            Créer mon premier site <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          {sites.map((s) => <CarteSite key={s.id} site={s} />)}
          <Link href="/creer" className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-full text-sm font-semibold mb-4" style={{ background: T.bleuClair, color: T.bleu }}>
            <Sparkles size={14} /> Créer un nouveau site
          </Link>
        </>
      )}

      <a href={`https://wa.me/${WHATSAPP_SUPPORT}`} target="_blank" rel="noopener noreferrer"
        className="rounded-2xl p-5 flex items-center gap-3" style={{ background: T.bleuClair }}>
        <img src={WHATSAPP_AVATAR} alt="Assistance Sama Site" className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: "2px solid #25D366" }} />
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: T.encre }}>Contactez-nous sur WhatsApp</div>
          <div className="text-xs mt-0.5" style={{ color: T.gris }}>Besoin d'être assisté ? Écrivez-nous, on répond vite.</div>
        </div>
        <ArrowRight size={16} color={T.bleu} className="shrink-0" />
      </a>
    </div>
  );
}
