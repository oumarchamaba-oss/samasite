"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Clock, CheckCircle2, Send, Timer, Package, Wallet, Users, TrendingUp,
  LogOut, AlertCircle, Mail, Download, CheckSquare, FileText, Receipt, CalendarClock, RefreshCw, Banknote, Phone, X,
  Trash2, PlusCircle,
} from "lucide-react";
import { T, SECTEURS, PAIEMENTS, DUREES, PRIX, AnneauCompteARebours, Badge } from "../lib/data";
import { IMG_EXPIRED } from "../lib/images";
import { LOGO_SAMASITE } from "../lib/data";
import { supabase } from "../lib/supabaseClient";
import { telechargerSite } from "../lib/genererFichierSite";
import { genererFacture, genererRecu, genererFactureRenouvellement, ouvrirDocument } from "../lib/genererDocumentPaiement";

function joursEntre(dateA, dateB) {
  return Math.round((dateA.getTime() - dateB.getTime()) / 86400000);
}

export default function DashboardAdmin() {
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState("");
  const [onglet, setOnglet] = useState("a_livrer");
  const [relances, setRelances] = useState({});
  const [recherche, setRecherche] = useState("");
  const [modifsFacturables, setModifsFacturables] = useState({});
  const [renouvelSite, setRenouvelSite] = useState(null);
  const [renouvelDuree, setRenouvelDuree] = useState(null);
  const [renouvelPaiement, setRenouvelPaiement] = useState(null);
  const [renouvelTraitement, setRenouvelTraitement] = useState(false);
  const [siteASupprimer, setSiteASupprimer] = useState(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState("");
  const [prolongationEnCours, setProlongationEnCours] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/admin/login"); return; }
      if (data.session.user.email !== "oumarchamaba@gmail.com") {
        // Un client connecté (pas l'administrateur) ne doit jamais voir cet écran,
        // même si les données restent de toute façon protégées par la base.
        router.push("/espace");
        return;
      }
      chargerClients();
    });
  }, []);

  const chargerClients = async () => {
    setChargement(true);
    setErreurChargement("");
    const [resSites, resRelances, resModifs] = await Promise.all([
      // BUG CORRIGÉ (21/09/2026) : sans le filtre supprime_le, un site que le
      // client avait supprimé restait mélangé aux clients actifs dans tous
      // les onglets (à livrer, actifs, renouvellements...) sans aucune
      // indication, et son montant comptait toujours dans le KPI "Revenu
      // total" — l'historique des paiements (table sama_site.paiements)
      // reste de toute façon conservé séparément pour la comptabilité, voir
      // migration_selfhosted_20260921_suppression_site.sql.
      supabase.from("sites").select("*").is("supprime_le", null).order("created_at", { ascending: false }),
      supabase.from("relances").select("site_id, canal, created_at").order("created_at", { ascending: false }),
      // Facultatif : tant que la migration "modifications_facturables" n'est
      // pas encore appliquée en production, cette requête échoue simplement
      // et les badges de facturation restent vides — ça ne doit jamais
      // empêcher le reste du tableau de bord de se charger.
      supabase.from("modifications_facturables").select("site_id, montant, facturee").eq("facturee", false),
    ]);
    if (resSites.error) {
      setErreurChargement("Impossible de charger vos clients. Vérifiez votre connexion et réessayez.");
      setChargement(false);
      return;
    }
    setClients(resSites.data || []);
    // Une seule entrée par site (la plus récente relance suffit à afficher le badge).
    const carteRelances = {};
    for (const r of resRelances.data || []) {
      if (!carteRelances[r.site_id]) carteRelances[r.site_id] = r;
    }
    setRelances(carteRelances);

    const carteModifs = {};
    for (const m of resModifs.data || []) {
      if (!carteModifs[m.site_id]) carteModifs[m.site_id] = { count: 0, montant: 0 };
      carteModifs[m.site_id].count += 1;
      carteModifs[m.site_id].montant += m.montant || 0;
    }
    setModifsFacturables(carteModifs);
    setChargement(false);
  };

  // Solde l'ardoise des modifications non facturées d'un client (bouton
  // "Marquer facturé" — voir onglet "Abonnements actifs").
  const marquerModifsFacturees = async (client) => {
    const { error } = await supabase.rpc("marquer_modifications_facturees", { p_site_id: client.id });
    if (!error) chargerClients();
  };

  const seDeconnecter = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // Adapte les colonnes réelles de la base (nom_entreprise, contact_nom, moyen_paiement...)
  // au format attendu par l'affichage, et calcule les champs dérivés (jours restants, etc.)
  //
  // "bucket" : la colonne "statut" en base ne passe JAMAIS automatiquement à
  // 'expire' toute seule (rien ne le fait, ni côté app ni côté base) — un
  // essai dont les 2 jours sont dépassés sans paiement, ou un abonnement
  // dont la date est dépassée, restent stockés comme 'essai'/'a_livrer' ou
  // 'actif'. On calcule donc ici l'onglet RÉEL de chaque client à partir des
  // dates, exactement comme EditerSite.js (estModifiable) — sinon l'onglet
  // "Expirés" ne recevrait quasiment jamais personne, et "Renouvellements"
  // continuerait d'afficher des abonnements déjà expirés depuis longtemps.
  const clientsAffiches = useMemo(() => {
    const maintenant = new Date();
    return clients.map((c) => {
      const secteurObj = SECTEURS.find((s) => s.id === c.secteur_id);
      const essaiExpireLe = c.essai_expire_le ? new Date(c.essai_expire_le) : null;
      const abonnementExpireLe = c.abonnement_expire_le ? new Date(c.abonnement_expire_le) : null;

      let bucket = c.statut; // 'essai' | 'a_livrer' | 'actif' | 'expire'
      let typeExpiration = null;
      if (["essai", "a_livrer"].includes(c.statut) && essaiExpireLe && essaiExpireLe <= maintenant) {
        bucket = "expire";
        typeExpiration = "essai";
      } else if (c.statut === "actif" && abonnementExpireLe && abonnementExpireLe <= maintenant) {
        bucket = "expire";
        typeExpiration = "abonnement";
      } else if (c.statut === "expire") {
        // Statut littéral déjà posé manuellement (rare) : on devine le type
        // à partir de la présence d'un montant (un essai n'en a jamais).
        typeExpiration = c.montant ? "abonnement" : "essai";
      }

      const modifs = modifsFacturables[c.id];

      return {
        ...c,
        nom: c.nom_entreprise,
        contactNom: c.contact_nom,
        secteur: secteurObj?.label || c.secteur_id,
        secteurId: c.secteur_id,
        paiement: c.moyen_paiement,
        dateCommande: c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "",
        joursRestants: essaiExpireLe ? Math.max(0, joursEntre(essaiExpireLe, maintenant)) : null,
        bucket,
        typeExpiration,
        joursDepuisExpiration: typeExpiration === "essai" && essaiExpireLe
          ? Math.max(0, joursEntre(maintenant, essaiExpireLe))
          : (typeExpiration === "abonnement" && abonnementExpireLe ? Math.max(0, joursEntre(maintenant, abonnementExpireLe)) : null),
        renouvellement: abonnementExpireLe ? abonnementExpireLe.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : null,
        domaineBientot: bucket === "actif" && abonnementExpireLe ? joursEntre(abonnementExpireLe, maintenant) < 30 : false,
        modifieDepuisLivraison: c.derniere_modification_client_le
          ? (!c.derniere_livraison_le || new Date(c.derniere_modification_client_le) > new Date(c.derniere_livraison_le))
          : false,
        modifsAFacturerCompte: modifs?.count || 0,
        modifsAFacturerMontant: modifs?.montant || 0,
      };
    });
  }, [clients, modifsFacturables]);

  const compteurs = useMemo(() => ({
    essai: clientsAffiches.filter((c) => c.bucket === "essai").length,
    a_livrer: clientsAffiches.filter((c) => c.bucket === "a_livrer").length,
    actif: clientsAffiches.filter((c) => c.bucket === "actif").length,
    expire: clientsAffiches.filter((c) => c.bucket === "expire").length,
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
  // Dès la confirmation, on ouvre immédiatement le reçu de paiement (prêt à imprimer /
  // enregistrer en PDF) — le client passera ensuite dans l'onglet "Abonnements actifs",
  // où les boutons WhatsApp / e-mail permettent de l'envoyer.
  const livrer = async (client) => {
    const dureeMs = client.duree === "an" ? 365 : 182;
    const abonnementExpireLe = new Date(Date.now() + dureeMs * 86400000).toISOString();
    const { error } = await supabase.rpc("confirmer_paiement_admin", {
      p_site_id: client.id,
      p_abonnement_expire_le: abonnementExpireLe,
    });
    if (!error) {
      ouvrirDocument(genererRecu(client));
      chargerClients();
    }
  };

  // Confirme un renouvellement : demande la durée + le moyen de paiement choisis (rien
  // n'a été présoumis par le client pour un renouvellement, contrairement à la commande
  // initiale), prolonge l'abonnement à partir de son échéance actuelle si elle n'est pas
  // encore dépassée, puis ouvre immédiatement le reçu correspondant.
  const confirmerRenouvellement = async (client) => {
    if (!renouvelDuree || !renouvelPaiement) return;
    setRenouvelTraitement(true);
    const dureeMs = renouvelDuree === "an" ? 365 : 182;
    const depart = client.abonnement_expire_le && new Date(client.abonnement_expire_le) > new Date()
      ? new Date(client.abonnement_expire_le)
      : new Date();
    const abonnementExpireLe = new Date(depart.getTime() + dureeMs * 86400000).toISOString();
    const montant = PRIX[client.extension]?.[renouvelDuree] ?? client.montant;
    const { error } = await supabase.rpc("confirmer_renouvellement_admin", {
      p_site_id: client.id,
      p_duree: renouvelDuree,
      p_montant: montant,
      p_moyen_paiement: renouvelPaiement,
      p_abonnement_expire_le: abonnementExpireLe,
    });
    setRenouvelTraitement(false);
    if (error) return;
    ouvrirDocument(genererRecu({ ...client, duree: renouvelDuree, montant, moyen_paiement: renouvelPaiement }));
    setRenouvelSite(null); setRenouvelDuree(null); setRenouvelPaiement(null);
    chargerClients();
  };

  // Marque le site comme livré (fichier téléchargé) — sert au suivi "modifié
  // depuis la dernière livraison" ci-dessous.
  const telechargerEtMarquerLivre = async (client) => {
    telechargerSite(client);
    await supabase.rpc("marquer_site_livre", { p_site_id: client.id });
    chargerClients();
  };

  // Enregistre la relance en base (persiste après rafraîchissement), et met à
  // jour l'affichage immédiatement sans attendre un rechargement complet.
  const relancer = async (site, canal) => {
    setRelances((r) => ({ ...r, [site.id]: { site_id: site.id, canal, created_at: new Date().toISOString() } }));
    await supabase.from("relances").insert([{ site_id: site.id, canal, note: `Relance ${canal} depuis le tableau de bord` }]);
  };

  // Supprime définitivement un site (suppression douce en base — le site
  // n'apparaît plus nulle part dans le tableau de bord ni chez le client,
  // mais l'historique des paiements reste conservé pour la comptabilité —
  // voir migration_selfhosted_20260921_suppression_site.sql). La fonction
  // RPC accepte déjà les appels admin (elle vérifie user_id = auth.uid() OU
  // is_admin()), aucune nouvelle fonction SQL n'était nécessaire ici.
  const supprimerSite = async (client) => {
    setSuppressionEnCours(true);
    setErreurSuppression("");
    const { error } = await supabase.rpc("supprimer_site_proprietaire", { p_site_id: client.id });
    setSuppressionEnCours(false);
    if (error) { setErreurSuppression("Impossible de supprimer ce site. Réessayez."); return; }
    setSiteASupprimer(null);
    chargerClients();
  };

  // Prolonge la période d'essai d'un client de p_jours (fonctionne même si
  // l'essai est déjà expiré, puisque essai_expire_le ne se remet jamais à
  // zéro tout seul) — voir migration_selfhosted_20260921_prolonger_essai_admin.sql.
  const prolongerEssai = async (client, jours) => {
    setProlongationEnCours(client.id);
    const { error } = await supabase.rpc("prolonger_essai_admin", { p_site_id: client.id, p_jours: jours });
    setProlongationEnCours(null);
    if (!error) chargerClients();
  };

  // Clients actifs à contacter en priorité pour le renouvellement (échéance dans les 30 jours),
  // triés du plus urgent au moins urgent. Sert pour le suivi tous les 6 mois / 1 an.
  const renouvellementsAVenir = useMemo(() => {
    return clientsAffiches
      .filter((c) => c.bucket === "actif" && c.abonnement_expire_le)
      .sort((a, b) => new Date(a.abonnement_expire_le) - new Date(b.abonnement_expire_le));
  }, [clientsAffiches]);
  const renouvellementsUrgents = renouvellementsAVenir.filter((c) => c.domaineBientot).length;

  // Sites en essai dont les 2 jours sont dépassés sans paiement — à recontacter.
  const essaisExpiresAContacter = useMemo(() => {
    return clientsAffiches.filter((c) => c.bucket === "expire" && c.typeExpiration === "essai");
  }, [clientsAffiches]);

  const onglets = [
    { id: "aujourdhui", label: "Aujourd'hui", count: renouvellementsUrgents + essaisExpiresAContacter.length, icon: Phone },
    { id: "a_livrer", label: "À livrer", count: compteurs.a_livrer, icon: Package },
    { id: "actif", label: "Abonnements actifs", count: compteurs.actif, icon: CheckCircle2 },
    { id: "renouvellements", label: "Renouvellements", count: renouvellementsUrgents, icon: CalendarClock },
    { id: "essai", label: "En essai", count: compteurs.essai, icon: Timer },
    { id: "expire", label: "Expirés", count: compteurs.expire, icon: AlertCircle },
  ];

  const filtreRecherche = (c) => !recherche.trim() || c.nom?.toLowerCase().includes(recherche.trim().toLowerCase());
  const renouvelerListe = renouvellementsAVenir.filter(filtreRecherche);
  const essaisExpiresListe = essaisExpiresAContacter.filter(filtreRecherche);

  const filtres = (onglet === "renouvellements" ? renouvellementsAVenir : clientsAffiches.filter((c) => c.bucket === onglet))
    .filter(filtreRecherche);

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

  if (erreurChargement) {
    return <div style={{ minHeight: "100vh", background: T.bleuFonce }} className="flex flex-col items-center justify-center gap-4 px-5 text-center">
      <AlertCircle size={28} color="#F87171" />
      <p style={{ color: "rgba(255,255,255,0.8)" }}>{erreurChargement}</p>
      <button onClick={chargerClients} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: T.jaune, color: T.bleuFonce }}>
        <RefreshCw size={14} /> Réessayer
      </button>
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

        <div className="mb-5">
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un client par nom…" aria-label="Rechercher un client par nom"
            className="w-full sm:w-80 rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background: "rgba(255,255,255,0.08)", color: T.blanc, border: "1px solid rgba(255,255,255,0.15)" }} />
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
          {(onglet === "aujourdhui" ? renouvelerListe.length === 0 && essaisExpiresListe.length === 0 : filtres.length === 0) && (
            <div className="p-10 text-center text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              {recherche.trim() ? `Aucun client ne correspond à "${recherche}" dans cette file.` : "Rien à traiter aujourd'hui — tout est à jour."}
            </div>
          )}

          {onglet === "aujourdhui" && (renouvelerListe.length > 0 || essaisExpiresListe.length > 0) && (
            <>
              {renouvelerListe.length > 0 && (
                <div className="px-5 py-3 text-xs font-semibold flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <CalendarClock size={13} /> À appeler pour un renouvellement ({renouvelerListe.length})
                </div>
              )}
              {renouvelerListe.map((c) => {
                const whatsappNum = (c.whatsapp || "").replace(/\D/g, "");
                const messageRenouv = encodeURIComponent(`Bonjour ${c.contactNom || ""}, votre abonnement Sama Site pour ${c.nom} arrive à échéance le ${c.renouvellement}. Souhaitez-vous le renouveler dès maintenant ?`);
                const lienWhatsapp = whatsappNum ? `https://wa.me/221${whatsappNum.replace(/^0/, "")}?text=${messageRenouv}` : null;
                const lienEmail = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Renouvellement de votre abonnement Sama Site")}&body=${messageRenouv}` : null;
                const libelleEmail = `Contacter ${c.nom} par e-mail (renouvellement)`;
                return (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b flex-wrap sm:flex-nowrap" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.domaineBientot ? "rgba(250,204,21,0.18)" : "rgba(255,255,255,0.1)" }}>
                      <CalendarClock size={19} color={c.domaineBientot ? T.jaune : "rgba(255,255,255,0.6)"} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <div className="font-semibold text-sm" style={{ color: T.blanc }}>{c.nom}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.contactNom} · Renouvellement le {c.renouvellement}</div>
                    </div>
                    {c.domaineBientot && <Badge tone="jaune"><AlertCircle size={11} /> Bientôt</Badge>}
                    <div className="flex items-center gap-2 shrink-0">
                      {lienWhatsapp && (
                        <a href={lienWhatsapp} target="_blank" rel="noopener noreferrer" onClick={() => relancer(c, "whatsapp")}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "#25D366", color: "#fff" }}>
                          <Phone size={13} /> Appeler / WhatsApp
                        </a>
                      )}
                      {lienEmail && (
                        <a href={lienEmail} onClick={() => relancer(c, "email")} aria-label={libelleEmail} title={libelleEmail} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                          <Mail size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {essaisExpiresListe.length > 0 && (
                <div className="px-5 py-3 text-xs font-semibold flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <AlertCircle size={13} /> Essais expirés depuis plus de 2 jours — à contacter ({essaisExpiresListe.length})
                </div>
              )}
              {essaisExpiresListe.map((c) => {
                const whatsappNum = (c.whatsapp || "").replace(/\D/g, "");
                const messageRelance = encodeURIComponent(`Bonjour ${c.contactNom || ""}, votre essai Sama Site pour ${c.nom} est arrivé à expiration depuis ${c.joursDepuisExpiration} jour${c.joursDepuisExpiration > 1 ? "s" : ""}. Souhaitez-vous passer à la version payante pour réactiver votre site ?`);
                const lienWhatsapp = whatsappNum ? `https://wa.me/221${whatsappNum.replace(/^0/, "")}?text=${messageRelance}` : null;
                const lienEmail = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Votre essai Sama Site a expiré")}&body=${messageRelance}` : null;
                const libelleEmail = `Contacter ${c.nom} par e-mail (essai expiré)`;
                return (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b flex-wrap sm:flex-nowrap" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(220,38,38,0.15)" }}>
                      <AlertCircle size={19} color="#F87171" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <div className="font-semibold text-sm" style={{ color: T.blanc }}>{c.nom}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.contactNom} · Expiré depuis {c.joursDepuisExpiration} jour{c.joursDepuisExpiration > 1 ? "s" : ""}</div>
                    </div>
                    {relances[c.id] && <Badge tone="vert"><CheckCircle2 size={11} /> Relancé</Badge>}
                    <div className="flex items-center gap-2 shrink-0">
                      {lienWhatsapp && (
                        <a href={lienWhatsapp} target="_blank" rel="noopener noreferrer" onClick={() => relancer(c, "whatsapp")}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "#25D366", color: "#fff" }}>
                          <Phone size={13} /> Appeler / WhatsApp
                        </a>
                      )}
                      {lienEmail && (
                        <a href={lienEmail} onClick={() => relancer(c, "email")} aria-label={libelleEmail} title={libelleEmail} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                          <Mail size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {onglet === "a_livrer" && filtres.map((c) => {
            const p = PAIEMENTS[c.paiement];
            const PIcon = p?.icon;
            const messageLivraison = encodeURIComponent(`Bonjour ${c.contactNom || ""}, votre site Sama Site "${c.nom}" est en cours de préparation. N'hésitez pas à nous contacter si vous avez des questions.`);
            const lienEmail = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Votre site Sama Site — commande en cours")}&body=${messageLivraison}` : null;
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
                <button onClick={() => telechargerEtMarquerLivre(c)} aria-label="Télécharger le site" title="Télécharger le site" className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold shrink-0" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                  <Download size={13} />
                </button>
                <button onClick={() => ouvrirDocument(genererFacture(c))} aria-label="Générer la facture" title="Générer la facture" className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold shrink-0" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                  <FileText size={13} />
                </button>
                {lienEmail && (
                  <a href={lienEmail} onClick={() => relancer(c, "email")} aria-label="Contacter par e-mail" title="Contacter par e-mail" className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold shrink-0" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                    <Mail size={13} />
                  </a>
                )}
                <button onClick={() => livrer(c)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold shrink-0" style={{ background: T.jaune, color: T.bleuFonce }}>
                  <CheckSquare size={13} /> Marquer comme payé
                </button>
                {siteASupprimer === c.id ? (
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold" style={{ color: "#F87171" }}>Supprimer ?</span>
                      <button onClick={() => supprimerSite(c)} disabled={suppressionEnCours} className="px-2.5 py-2 rounded-full text-xs font-bold disabled:opacity-40" style={{ background: "#DC2626", color: "#fff" }}>{suppressionEnCours ? "…" : "Oui"}</button>
                      <button onClick={() => { setSiteASupprimer(null); setErreurSuppression(""); }} className="px-2.5 py-2 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>Non</button>
                    </div>
                    {erreurSuppression && <span className="text-xs" style={{ color: "#F87171" }}>{erreurSuppression}</span>}
                  </div>
                ) : (
                  <button onClick={() => setSiteASupprimer(c.id)} aria-label="Supprimer ce site" title="Supprimer ce site" className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold shrink-0" style={{ background: "rgba(220,38,38,0.15)", color: "#F87171" }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}

          {onglet === "essai" && filtres.map((c) => {
            const whatsappNum = (c.whatsapp || "").replace(/\D/g, "");
            const messageEssai = encodeURIComponent(`Bonjour ${c.contactNom || ""}, votre essai gratuit Sama Site pour ${c.nom} se termine dans ${c.joursRestants} jour${c.joursRestants > 1 ? "s" : ""}. Souhaitez-vous passer à la version payante pour garder votre site en ligne ?`);
            const lienWhatsapp = whatsappNum ? `https://wa.me/221${whatsappNum.replace(/^0/, "")}?text=${messageEssai}` : null;
            const lienEmail = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Votre essai gratuit Sama Site se termine bientôt")}&body=${messageEssai}` : null;
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b flex-wrap sm:flex-nowrap" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <AnneauCompteARebours joursRestants={c.joursRestants ?? 0} size={42} />
                <div className="flex-1 min-w-[140px]">
                  <div className="font-semibold text-sm" style={{ color: T.blanc }}>{c.nom}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.secteur}</div>
                </div>
                <Badge tone={c.joursRestants <= 1 ? "rouge" : "jaune"}>
                  <Clock size={11} /> {c.joursRestants} jour{c.joursRestants > 1 ? "s" : ""} restant{c.joursRestants > 1 ? "s" : ""}
                </Badge>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {lienWhatsapp && (
                    <a href={lienWhatsapp} target="_blank" rel="noopener noreferrer" onClick={() => relancer(c, "whatsapp")}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "#25D366", color: "#fff" }}>
                      <Send size={13} /> Encourager à payer
                    </a>
                  )}
                  {lienEmail && (
                    <a href={lienEmail} onClick={() => relancer(c, "email")}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <Mail size={13} /> E-mail
                    </a>
                  )}
                  {[1, 3, 7].map((jours) => (
                    <button key={jours} onClick={() => prolongerEssai(c, jours)} disabled={prolongationEnCours === c.id}
                      aria-label={`Prolonger l'essai de ${jours} jour${jours > 1 ? "s" : ""}`} title={`Prolonger l'essai de ${jours} jour${jours > 1 ? "s" : ""}`}
                      className="flex items-center gap-1 px-2.5 py-2.5 rounded-full text-xs font-semibold disabled:opacity-40" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <PlusCircle size={12} /> {jours}j
                    </button>
                  ))}
                  {siteASupprimer === c.id ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: "#F87171" }}>Supprimer ?</span>
                        <button onClick={() => supprimerSite(c)} disabled={suppressionEnCours} className="px-2.5 py-2 rounded-full text-xs font-bold disabled:opacity-40" style={{ background: "#DC2626", color: "#fff" }}>{suppressionEnCours ? "…" : "Oui"}</button>
                        <button onClick={() => { setSiteASupprimer(null); setErreurSuppression(""); }} className="px-2.5 py-2 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>Non</button>
                      </div>
                      {erreurSuppression && <span className="text-xs" style={{ color: "#F87171" }}>{erreurSuppression}</span>}
                    </div>
                  ) : (
                    <button onClick={() => setSiteASupprimer(c.id)} aria-label="Supprimer ce site" title="Supprimer ce site" className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold" style={{ background: "rgba(220,38,38,0.15)", color: "#F87171" }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {onglet === "actif" && filtres.map((c) => {
            const p = PAIEMENTS[c.paiement];
            const PIcon = p?.icon;
            const lienEmail = c.email ? `mailto:${c.email}?subject=${encodeURIComponent(`À propos de votre site Sama Site — ${c.nom}`)}` : null;
            const whatsappNumActif = (c.whatsapp || "").replace(/\D/g, "");
            const messageRecu = encodeURIComponent(`Bonjour ${c.contactNom || ""}, nous confirmons la réception de votre paiement de ${c.montant?.toLocaleString("fr-FR") || ""} F pour le site "${c.nom}". Merci pour votre confiance !`);
            const lienWhatsappRecu = whatsappNumActif ? `https://wa.me/221${whatsappNumActif.replace(/^0/, "")}?text=${messageRecu}` : null;
            const lienEmailRecu = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Reçu de paiement — Sama Site")}&body=${messageRecu}` : null;
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
                  {c.modifieDepuisLivraison && <Badge tone="rouge"><RefreshCw size={11} /> Modifié depuis le téléchargement</Badge>}
                  {c.modifsAFacturerCompte > 0 && (
                    <button onClick={() => marquerModifsFacturees(c)} aria-label="Marquer cette facturation comme réglée" title="Marquer cette facturation comme réglée"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold" style={{ background: T.jauneFond, color: T.jauneFonce }}>
                      <Banknote size={11} /> {c.modifsAFacturerMontant.toLocaleString("fr-FR")} F à facturer ({c.modifsAFacturerCompte}) — marquer facturé
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => telechargerEtMarquerLivre(c)} aria-label="Télécharger le site" title="Télécharger le site" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <Download size={12} />
                    </button>
                    <button onClick={() => ouvrirDocument(genererFacture(c))} aria-label="Générer la facture" title="Générer la facture" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <FileText size={12} />
                    </button>
                    <button onClick={() => ouvrirDocument(genererRecu(c))} aria-label="Générer le reçu de paiement" title="Générer le reçu de paiement" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: T.jauneFond, color: T.jauneFonce }}>
                      <Receipt size={12} />
                    </button>
                    {lienWhatsappRecu && (
                      <a href={lienWhatsappRecu} target="_blank" rel="noopener noreferrer" aria-label="Envoyer le reçu par WhatsApp" title="Envoyer le reçu par WhatsApp" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#25D366", color: "#fff" }}>
                        <Send size={12} />
                      </a>
                    )}
                    {lienEmailRecu && (
                      <a href={lienEmailRecu} aria-label="Envoyer le reçu par e-mail" title="Envoyer le reçu par e-mail" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                        <Mail size={12} />
                      </a>
                    )}
                    {lienEmail && (
                      <a href={lienEmail} aria-label="Contacter par e-mail" title="Contacter par e-mail" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                        <Mail size={12} />
                      </a>
                    )}
                    {siteASupprimer === c.id ? (
                      <>
                        <span className="text-xs font-semibold" style={{ color: "#F87171" }}>Supprimer ?</span>
                        <button onClick={() => supprimerSite(c)} disabled={suppressionEnCours} className="px-2 py-1.5 rounded-full text-xs font-bold disabled:opacity-40" style={{ background: "#DC2626", color: "#fff" }}>{suppressionEnCours ? "…" : "Oui"}</button>
                        <button onClick={() => { setSiteASupprimer(null); setErreurSuppression(""); }} className="px-2 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>Non</button>
                      </>
                    ) : (
                      <button onClick={() => setSiteASupprimer(c.id)} aria-label="Supprimer ce site" title="Supprimer ce site" className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(220,38,38,0.15)", color: "#F87171" }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  {siteASupprimer === c.id && erreurSuppression && <span className="text-xs" style={{ color: "#F87171" }}>{erreurSuppression}</span>}
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

            const montantRenouv = PRIX[c.extension]?.[c.duree] ?? c.montant;
            const dureeLabelRenouv = DUREES.find((d) => d.id === c.duree)?.label || c.duree;
            const messageFacture = encodeURIComponent(`Bonjour ${c.contactNom || ""}, voici votre facture de renouvellement pour le site "${c.nom}" : ${dureeLabelRenouv} — ${montantRenouv?.toLocaleString("fr-FR") || ""} F. Merci de confirmer votre paiement (Wave, Orange Money ou Visa) pour prolonger votre abonnement sans interruption.`);
            const lienWhatsappFacture = whatsappNum ? `https://wa.me/221${whatsappNum.replace(/^0/, "")}?text=${messageFacture}` : null;
            const lienEmailFacture = c.email ? `mailto:${c.email}?subject=${encodeURIComponent("Facture de renouvellement — Sama Site")}&body=${messageFacture}` : null;

            const renouvelEnCours = renouvelSite === c.id;
            return (
              <div key={c.id} className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-4 px-5 py-4 flex-wrap sm:flex-nowrap">
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
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button onClick={() => ouvrirDocument(genererFactureRenouvellement(c))} aria-label="Voir la facture de renouvellement" title="Voir la facture de renouvellement" className="flex items-center gap-1 px-2.5 py-2.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <FileText size={13} />
                    </button>
                    {lienWhatsappFacture && (
                      <a href={lienWhatsappFacture} target="_blank" rel="noopener noreferrer" aria-label="Envoyer la facture par WhatsApp" title="Envoyer la facture par WhatsApp" onClick={() => relancer(c, "whatsapp")}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "#25D366", color: "#fff" }}>
                        <Send size={13} /> WhatsApp
                      </a>
                    )}
                    {lienEmailFacture && (
                      <a href={lienEmailFacture} aria-label="Envoyer la facture par e-mail" title="Envoyer la facture par e-mail" onClick={() => relancer(c, "email")} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                        <Mail size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        if (renouvelEnCours) { setRenouvelSite(null); setRenouvelDuree(null); setRenouvelPaiement(null); }
                        else { setRenouvelSite(c.id); setRenouvelDuree(c.duree || null); setRenouvelPaiement(c.paiement || null); }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold" style={{ background: renouvelEnCours ? "rgba(255,255,255,0.15)" : T.jaune, color: renouvelEnCours ? T.blanc : T.bleuFonce }}>
                      {renouvelEnCours ? <><X size={13} /> Annuler</> : <><CheckSquare size={13} /> Renouveler</>}
                    </button>
                  </div>
                </div>

                {renouvelEnCours && (
                  <div className="px-5 pb-5">
                    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>Paiement reçu pour combien de temps ?</p>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {DUREES.map((d) => {
                          const selected = renouvelDuree === d.id;
                          const prix = PRIX[c.extension]?.[d.id];
                          return (
                            <button key={d.id} type="button" onClick={() => setRenouvelDuree(d.id)}
                              className="rounded-xl px-3.5 py-2 text-xs font-semibold text-left" style={{ background: selected ? T.jaune : "rgba(255,255,255,0.08)", color: selected ? T.bleuFonce : T.blanc }}>
                              {d.label}{prix ? ` — ${prix.toLocaleString("fr-FR")} F` : ""}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>Moyen de paiement</p>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {Object.entries(PAIEMENTS).map(([id, p]) => {
                          const selected = renouvelPaiement === id;
                          const PIconR = p.icon;
                          return (
                            <button key={id} type="button" onClick={() => setRenouvelPaiement(id)}
                              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold" style={{ background: selected ? p.bg : "rgba(255,255,255,0.08)", color: selected ? p.color : T.blanc }}>
                              <PIconR size={13} /> {p.label}
                            </button>
                          );
                        })}
                      </div>
                      <button disabled={!renouvelDuree || !renouvelPaiement || renouvelTraitement} onClick={() => confirmerRenouvellement(c)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold disabled:opacity-40" style={{ background: T.jaune, color: T.bleuFonce }}>
                        {renouvelTraitement ? <><RefreshCw size={13} className="animate-spin" /> Enregistrement…</> : <><CheckCircle2 size={13} /> Confirmer le paiement et ouvrir le reçu</>}
                      </button>
                    </div>
                  </div>
                )}
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
                    {relances[c.id] && <Badge tone="vert"><CheckCircle2 size={11} /> Relancé ({relances[c.id].canal === "whatsapp" ? "WhatsApp" : "e-mail"})</Badge>}
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
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {lienWhatsapp && (
                    <a href={lienWhatsapp} target="_blank" rel="noopener noreferrer" onClick={() => relancer(c, "whatsapp")}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "#25D366", color: "#fff" }}>
                      <Send size={13} /> WhatsApp
                    </a>
                  )}
                  {lienEmail && (
                    <a href={lienEmail} onClick={() => relancer(c, "email")}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <Mail size={13} /> E-mail
                    </a>
                  )}
                  {!estAbonnement && [1, 3, 7].map((jours) => (
                    <button key={jours} onClick={() => prolongerEssai(c, jours)} disabled={prolongationEnCours === c.id}
                      aria-label={`Prolonger l'essai de ${jours} jour${jours > 1 ? "s" : ""}`} title={`Prolonger l'essai de ${jours} jour${jours > 1 ? "s" : ""}`}
                      className="flex items-center gap-1 px-2.5 py-2.5 rounded-full text-xs font-semibold disabled:opacity-40" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>
                      <PlusCircle size={12} /> {jours}j
                    </button>
                  ))}
                  {siteASupprimer === c.id ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: "#F87171" }}>Supprimer ?</span>
                        <button onClick={() => supprimerSite(c)} disabled={suppressionEnCours} className="px-2.5 py-2 rounded-full text-xs font-bold disabled:opacity-40" style={{ background: "#DC2626", color: "#fff" }}>{suppressionEnCours ? "…" : "Oui"}</button>
                        <button onClick={() => { setSiteASupprimer(null); setErreurSuppression(""); }} className="px-2.5 py-2 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: T.blanc }}>Non</button>
                      </div>
                      {erreurSuppression && <span className="text-xs" style={{ color: "#F87171" }}>{erreurSuppression}</span>}
                    </div>
                  ) : (
                    <button onClick={() => setSiteASupprimer(c.id)} aria-label="Supprimer ce site" title="Supprimer ce site" className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold" style={{ background: "rgba(220,38,38,0.15)", color: "#F87171" }}>
                      <Trash2 size={13} />
                    </button>
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
