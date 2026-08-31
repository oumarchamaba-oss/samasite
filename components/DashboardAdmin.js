"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Clock, CheckCircle2, Send, Timer, Package, Wallet, Users, TrendingUp,
  LogOut, AlertCircle, Mail, Download, CheckSquare, FileText, Receipt, CalendarClock,
} from "lucide-react";
import { T, SECTEURS, PAIEMENTS, DUREES, AnneauCompteARebours, Badge } from "../lib/data";
import { IMG_EXPIRED } from "../lib/images";
import { LOGO_SAMASITE } from "../lib/data";
import { supabase } from "../lib/supabaseClient";
import { telechargerSite } from "../lib/genererFichierSite";
import { genererFacture, genererRecu, ouvrirDocument } from "../lib/genererDocumentPaiement";

function joursEntre(dateA, dateB) {
  return Math.round((dateA.getTime() - dateB.getTime()) / 86400000);
}

export default function DashboardAdmin() {
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState("a_livrer");
  const [relances, setRelances] = useState({});
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/admin/login"); return; }
      chargerClients();
    });
  }, []);

  const chargerClients = async () => {
    setChargement(true);
    const { data } = await supabase.from("sites").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    setChargement(false);
  };

  const seDeconnecter = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // Adapte les colonnes réelles de la base (nom_entreprise, contact_nom, moyen_paiement...)
  // au format attendu par l'affichage, et calcule les champs dérivés (jours restants, etc.)
  const clientsAffiches = useMemo(() => {
    const maintenant = new Date();
    return clients.map((c) => {
      const secteurObj = SECTEURS.find((s) => s.id === c.secteur_id);
      const essaiExpireLe = c.essai_expire_le ? new Date(c.essai_expire_le) : null;
      const abonnementExpireLe = c.abonnement_expire_le ? new Date(c.abonnement_expire_le) : null;
      const estExpireEssai = c.statut === "expire" && !c.montant;

      return {
        ...c,
        nom: c.nom_entreprise,
        contactNom: c.contact_nom,
        secteur: secteurObj?.label || c.secteur_id,
        secteurId: c.secteur_id,
        paiement: c.moyen_paiement,
        dateCommande: c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "",
        joursRestants: essaiExpireLe ? Math.max(0, joursEntre(essaiExpireLe, maintenant)) : null,
        joursDepuisExpiration: estExpireEssai && essaiExpireLe
          ? Math.max(0, joursEntre(maintenant, essaiExpireLe))
          : (abonnementExpireLe ? Math.max(0, joursEntre(maintenant, abonnementExpireLe)) : null),
        typeExpiration: estExpireEssai ? "essai" : "abonnement",
        renouvellement: abonnementExpireLe ? abonnementExpireLe.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : null,
        domaineBientot: abonnementExpireLe ? joursEntre(abonnementExpireLe, maintenant) < 30 : false,
      };
    });
  }, [clients]);

  const compteurs = useMemo(() => ({
    essai: clientsAffiches.filter((c) => c.statut === "essai").length,
    a_livrer: clientsAffiches.filter((c) => c.statut === "a_livrer").length,
    actif: clientsAffiches.filter((c) => c.statut === "actif").length,
    expire: clientsAffiches.filter((c) => c.statut === "expire").length,
  }), [clientsAffiches]);

  const revenu = useMemo(() => {
    return clientsAffiches
      .filter((c) => c.statut === "actif" || c.statut === "a_livrer")
      .reduce((total, c) => total + (c.montant || 0), 0);
  }, [clientsAffiches]);

  const tauxConversion = useMemo(() => {
    const total = compteurs.essai + compteurs.a_livrer + compteurs.actif + compteurs.expire;
    if (total === 0) return 0;
    return Math.round(((compteurs.a_livrer + compteurs.actif) / total) * 100);
  }, [compteurs]);

  // Confirme la livraison : active réellement le site et calcule sa date de renouvellement.
  const livrer = async (client) => {
    const dureeMs = client.duree === "an" ? 365 : 182;
    const abonnementExpireLe = new Date(Date.now() + dureeMs * 86400000).toISOString();
    const { error } = await supabase.from("sites").update({
      statut: "actif",
      paiement_confirme: true,
      abonnement_expire_le: abonnementExpireLe,
    }).eq("id", client.id);
    if (!error) chargerClients();
  };

  const relancer = (id) => setRelances((r) => ({ ...r, [id]: true }));

  // Clients actifs à contacter en priorité pour le renouvellement (échéance dans les 30 jours),
  // triés du plus urgent au moins urgent. Sert pour le suivi tous les 6 mois / 1 an.
  const renouvellementsAVenir = useMemo(() => {
    return clientsAffiches
      .filter((c) => c.statut === "actif" && c.abonnement_expire_le)
      .sort((a, b) => new Date(a.abonnement_expire_le) - new Date(b.abonnement_expire_le));
  }, [clientsAffiches]);
  const renouvellementsUrgents = renouvellementsAVenir.filter((c) => c.domaineBientot).length;

  const onglets = [
    { id: "a_livrer", label: "À livrer", count: compteurs.a_livrer, icon: Package },
    { id: "actif", label: "Abonnements actifs", count: compteurs.actif, icon: CheckCircle2 },
    { id: "renouvellements", label: "Renouvellements", count: renouvellementsUrgents, icon: CalendarClock },
    { id: "essai", label: "En essai", count: compteurs.essai, icon: Timer },
    { id: "expire", label: "Expirés", count: compteurs.expire, icon: AlertCircle },
  ];

  const filtres = onglet === "renouvellements" ? renouvellementsAVenir : clientsAffiches.filter((c) => c.statut === onglet);

  const kpis = [
    { label: "Clients payants", valeur: compteurs.actif + compteurs.a_livrer, icon: Users },
    { label: "Revenu total", valeur: `${revenu.toLocaleString("fr-FR")} F`, icon: Wallet },
    { label: "Sites en essai", valeur: compteurs.essai, icon: Timer },
    { label: "Taux de conversion", valeur: `${tauxConversion}%`, icon: TrendingUp },
  ];

  if (chargement) {
    return <div style={{ minHeight: "100vh", background: T.bleuFonce }} className="flex items-center justify-center">
      <p style={{ color: "rgba(255,255,255,0.6)" }}>Chargement…</p>
    </div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bleuFonce }}>
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: T.bleuFonce, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg px-2.5 py-1.5" style={{ background: T.blanc }}>
            <img src={LOGO_SAMASITE} alt="Sama Site" className="h-4 w-auto" />
          </div>
          <div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Administration</div>
          </div>
        </div>
        <button onClick={seDeconnecter} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>
          <LogOut size={13} /> Se déconnecter
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-5 pb-24">
        <div className="py-7">
          <h2 className="text-3xl font-bold" style={{ color: T.blanc }}>Tableau de bord</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>Vos commandes, vos abonnements et une seule tâche manuelle : confirmer le paiement reçu.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                <Icon size={16} color={T.jaune} strokeWidth={2} />
                <div className="text-xl font-bold mt-2" style={{ color: T.blanc }}>{k.valeur}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{k.label}</div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {onglets.map((o) => {
            const Icon = o.icon;
            const actif = onglet === o.id;
            return (
              <button key={o.id} onClick={() => setOnglet(o.id)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ background: actif ? T.jaune : "rgba(255,255,255,0.08)", color: actif ? T.bleuFonce : "rgba(255,255,255,0.8)" }}>
                <Icon size={15} strokeWidth={2.2} /> {o.label}
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: actif ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }}>{o.count}</span>
              </button>
            );
          })}
        </div>

        {onglet === "expire" && filtres.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-3 flex items-center justify-center py-3" style={{ background: "rgba(255,255,255,0.05)" }}>
            <img src={IMG_EXPIRED} alt="" className="max-h-16 opacity-80" />
          </div>
        )}

        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          {filtres.length === 0 && <div className="p-10 text-center text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Aucun client dans cette file pour le moment.</div>}

          {onglet === "a_livrer" && filtres.map((c) => {
            const p = PAIEMENTS[c.paiement];
            const PIcon = p?.icon;
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b flex-wrap sm:flex-nowrap" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(250,204,21,0.18)" }}>
                  <Package size={19} color={T.jaune} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <div className="font-semibold text-sm" style={{ color: T.blanc }}>{c.nom}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.contactNom} · {c.secteur}</div>
                  <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {c.whatsapp && <span className="flex items-center gap-1"><MessageCircle size={10} /> {c.whatsapp}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: T.blanc }}>{c.montant?.toLocaleString("fr-FR")} F</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{c.domaine} · {c.dateCommande}</div>
                </div>
                {p && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold shrink-0" style={{ background: p.bg, color: p.color }}>
                    <PIcon size={12} /> {p.label}
                  </span>
                )}
                <button onClick={() => telechargerSite(c)} title="Télécharger le site" className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold shrink-0" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                  <Download size={13} />
                </button>
                <button onClick={() => ouvrirDocument(genererFacture(c))} title="Générer la facture" className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold shrink-0" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                  <FileText size={13} />
                </button>
                <button onClick={() => livrer(c)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold shrink-0" style={{ background: T.jaune, color: T.bleuFonce }}>
                  <CheckSquare size={13} /> Marquer comme payé
                </button>
              </div>
            );
          })}

          {onglet === "essai" && filtres.map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <AnneauCompteARebours joursRestants={c.joursRestants ?? 0} size={42} />
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: T.blanc }}>{c.nom}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.secteur}</div>
              </div>
              <Badge tone={c.joursRestants <= 1 ? "rouge" : "jaune"}>
                <Clock size={11} /> {c.joursRestants} jour{c.joursRestants > 1 ? "s" : ""} restant{c.joursRestants > 1 ? "s" : ""}
              </Badge>
            </div>
          ))}

          {onglet === "actif" && filtres.map((c) => {
            const p = PAIEMENTS[c.paiement];
            const PIcon = p?.icon;
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b flex-wrap sm:flex-nowrap" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <CheckCircle2 size={19} color={T.jaune} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <div className="font-semibold text-sm" style={{ color: T.blanc }}>{c.nom}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.domaine || "Sous-domaine gratuit"}</div>
                </div>
                {p && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold shrink-0" style={{ background: p.bg, color: p.color }}>
                    <PIcon size={12} /> {p.label}
                  </span>
                )}
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Renouvellement : {c.renouvellement}</span>
                  {c.domaineBientot && <Badge tone="jaune"><AlertCircle size={11} /> Domaine à renouveler</Badge>}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => telechargerSite(c)} title="Télécharger le site" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <Download size={12} />
                    </button>
                    <button onClick={() => ouvrirDocument(genererFacture(c))} title="Générer la facture" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <FileText size={12} />
                    </button>
                    <button onClick={() => ouvrirDocument(genererRecu(c))} title="Générer le reçu de paiement" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: T.jauneFond, color: T.jauneFonce }}>
                      <Receipt size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {onglet === "renouvellements" && filtres.length > 0 && (
            <div className="px-5 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              Triés du renouvellement le plus proche au plus lointain — pensez à recontacter les clients avant l'échéance de leur abonnement de 6 mois ou 1 an.
            </div>
          )}
          {onglet === "renouvellements" && filtres.map((c) => {
            const whatsappNum = (c.whatsapp || "").replace(/\D/g, "");
            const messageRenouv = encodeURIComponent(`Bonjour ${c.contactNom || ""}, votre abonnement Sama Site pour ${c.nom} arrive à échéance le ${c.renouvellement}. Souhaitez-vous le renouveler dès maintenant ?`);
            const lienWhatsapp = whatsappNum ? `https://wa.me/221${whatsappNum.replace(/^0/, "")}?text=${messageRenouv}` : null;
            const lienEmail = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Renouvellement de votre abonnement Sama Site")}&body=${messageRenouv}` : null;
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b flex-wrap sm:flex-nowrap" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.domaineBientot ? "rgba(250,204,21,0.18)" : "rgba(255,255,255,0.1)" }}>
                  <CalendarClock size={19} color={c.domaineBientot ? T.jaune : "rgba(255,255,255,0.6)"} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <div className="font-semibold text-sm" style={{ color: T.blanc }}>{c.nom}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.contactNom} · {DUREES.find((d) => d.id === c.duree)?.label}</div>
                </div>
                <div className="text-right shrink-0">
                  {c.domaineBientot
                    ? <Badge tone="jaune"><AlertCircle size={11} /> Renouvellement le {c.renouvellement}</Badge>
                    : <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Renouvellement le {c.renouvellement}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lienWhatsapp && (
                    <a href={lienWhatsapp} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "#25D366", color: "#fff" }}>
                      <Send size={13} /> WhatsApp
                    </a>
                  )}
                  {lienEmail && (
                    <a href={lienEmail} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <Mail size={13} /> E-mail
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {onglet === "expire" && filtres.map((c) => {
            const estAbonnement = c.typeExpiration === "abonnement";
            const whatsappNum = (c.whatsapp || "").replace(/\D/g, "");
            const messageRelance = encodeURIComponent(`Bonjour ${c.contactNom || ""}, votre ${estAbonnement ? "abonnement Sama Site" : "essai Sama Site"} pour ${c.nom} est arrivé à expiration. Souhaitez-vous le réactiver ?`);
            const lienWhatsapp = whatsappNum ? `https://wa.me/221${whatsappNum.replace(/^0/, "")}?text=${messageRelance}` : null;
            const lienEmail = c.email ? `mailto:${c.email}?subject=${encodeURIComponent(`Votre ${estAbonnement ? "abonnement" : "essai"} Sama Site a expiré`)}&body=${messageRelance}` : null;
            return (
              <div key={c.id} className="flex items-start gap-4 px-5 py-4 border-b flex-wrap sm:flex-nowrap" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(220,38,38,0.15)" }}>
                  <AlertCircle size={19} color="#F87171" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: T.blanc }}>{c.nom}</span>
                    {estAbonnement && <Badge tone="rouge"><AlertCircle size={10} /> Abonnement non renouvelé</Badge>}
                    {relances[c.id] && <Badge tone="vert"><CheckCircle2 size={11} /> Relancé</Badge>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {c.contactNom ? `${c.contactNom} · ` : ""}{c.secteur} · Expiré il y a {c.joursDepuisExpiration} jours
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-3 flex-wrap" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {c.whatsapp && <span className="flex items-center gap-1"><MessageCircle size={11} /> {c.whatsapp}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail size={11} /> {c.email}</span>}
                  </div>
                  {estAbonnement && c.domaine && (
                    <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Ancien domaine : {c.domaine} · {c.montant?.toLocaleString("fr-FR")} F</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lienWhatsapp && (
                    <a href={lienWhatsapp} target="_blank" rel="noopener noreferrer" onClick={() => relancer(c.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "#25D366", color: "#fff" }}>
                      <Send size={13} /> WhatsApp
                    </a>
                  )}
                  {lienEmail && (
                    <a href={lienEmail} onClick={() => relancer(c.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <Mail size={13} /> E-mail
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
