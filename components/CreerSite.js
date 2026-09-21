"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles, MessageCircle, LayoutGrid, ArrowRight, ArrowLeft, Globe, Plus, X, Timer, Wallet,
  Link2, Check, Copy, RefreshCw, AlertCircle, ClipboardList, MapPin, Mail, Image, Upload, Tag,
  Palette as PaletteIcon, CheckCircle2,
} from "lucide-react";
import {
  T, SECTEURS, SECTEUR_COULEURS, METIERS_ARTISANAT, trouverMetier, paletteIdPour,
  genererSchema, deriverVariantes, extraireCouleurDominante, horairesParDefaut,
  MODES_LIVRAISON, RESEAUX_SOCIAUX, PRIX, DOMAINES, DUREES, PAIEMENTS, PRIX_MODIFICATION,
  WHATSAPP_SUPPORT, AnneauCompteARebours, Badge,
} from "../lib/data";
import { IMG_CONFIRMED } from "../lib/images";
import { supabase } from "../lib/supabaseClient";
import { demarrerPaiement } from "../lib/paiementGateway";
import ApercuSite from "./ApercuSite";
import AssistantIA from "./AssistantIA";
import EditeurHoraires from "./EditeurHoraires";

// Clé localStorage utilisée pour conserver le site en cours de création
// pendant l'aller-retour par l'inscription (voir publierEssai ci-dessous).
const DRAFT_KEY = "sama_site_draft_v1";

export default function CreerSite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const secteurDepuisURL = searchParams.get("secteur");

  const [step, setStep] = useState(1);
  const [secteurId, setSecteurId] = useState(secteurDepuisURL || null);
  const [business, setBusiness] = useState({
    nom: "", accroche: "", whatsapp: "", adresse: "", email: "",
    banniere: null, texteBanniere: "", lienGoogleMaps: "", logo: null, couleurs: null,
    produits: [], reseaux: { facebook: "", instagram: "", tiktok: "", twitter: "" },
    modesLivraison: [], metier: "", metierGroupe: "", horaires: horairesParDefaut(),
  });
  const [paye, setPaye] = useState(false);
  const [payeAutomatiquement, setPayeAutomatiquement] = useState(false);
  const [traitementAPI, setTraitementAPI] = useState(false);
  const [siteId, setSiteId] = useState(null);
  const [siteEditToken, setSiteEditToken] = useState(null);
  // Lien de GESTION privé (édition sans compte) — jamais affiché comme "le"
  // lien du site, voir siteSlug ci-dessous pour le lien public à partager.
  const [siteSlug, setSiteSlug] = useState(null);
  const [lienCopie, setLienCopie] = useState(false);
  const copierLienSite = () => {
    if (!siteSlug) return;
    const lien = `https://samasite.online/s/${siteSlug}`;
    const declencherRetour = () => { setLienCopie(true); setTimeout(() => setLienCopie(false), 2000); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(lien).then(declencherRetour).catch(() => {});
    }
  };
  const [session, setSession] = useState(undefined); // undefined = pas encore vérifié
  const [publicationEnCours, setPublicationEnCours] = useState(false);
  const [erreurPublication, setErreurPublication] = useState("");
  const [sessionExpiree, setSessionExpiree] = useState(false);
  const [domaineDemande, setDomaineDemande] = useState("");
  const [methodePaiement, setMethodePaiement] = useState(null);
  const [extensionDomaine, setExtensionDomaine] = useState(null);
  const [duree, setDuree] = useState(null);
  const [contactNom, setContactNom] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    // BUG CORRIGÉ (audit sept. 2026) : sans cet écouteur, "session" n'était
    // capturé qu'UNE SEULE FOIS au chargement de la page et ne changeait plus
    // jamais ensuite. Si la connexion réelle expirait pendant que l'utilisateur
    // remplissait le formulaire (souvent long : couleurs, produits, photos...),
    // "session" restait affiché comme valide dans le navigateur alors que le
    // jeton réel envoyé à Supabase ne l'était plus — la toute première requête
    // authentifiée (justement, publier) échouait alors avec une erreur de
    // session/JWT brute et peu compréhensible, sans aucun moyen de reprendre.
    // onAuthStateChange tient "session" à jour en continu (connexion,
    // déconnexion, rafraîchissement de jeton) pendant toute la durée de vie du
    // composant.
    const { data: abonnement } = supabase.auth.onAuthStateChange((_event, nouvelleSession) => {
      setSession(nouvelleSession);
    });
    return () => abonnement.subscription.unsubscribe();
  }, []);

  // Sauvegarde tout ce qui a été rempli jusqu'ici (et, si on en est déjà là,
  // les informations de commande) pour pouvoir reprendre exactement où on
  // s'était arrêté après reconnexion — que ce soit parce qu'aucun compte
  // n'existait encore, ou parce que la session s'est révélée expirée au
  // moment de publier.
  const sauvegarderBrouillon = (etapeReprise) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({
        secteurId, business, contactNom, siteId, extensionDomaine, duree, methodePaiement,
        etapeReprise,
      }));
    } catch {
      // Stockage local indisponible (navigation privée, quota...) : tant pis,
      // on continue quand même — l'utilisateur perdra juste la reprise auto.
    }
  };

  // Une erreur Supabase provoquée par une session expirée/invalide se
  // reconnaît soit à son message ("JWT expired", "invalid claim", ...), soit
  // — plus fiable, car le message exact varie selon la version de la
  // librairie — au fait qu'une vérification immédiate de la session en cours
  // révèle qu'elle n'existe plus. On vérifie donc toujours les deux.
  const estErreurSession = async (error) => {
    const detail = (error?.message || "").toLowerCase();
    if (/jwt|token|session|not authenticated|401/.test(detail)) return true;
    const { data } = await supabase.auth.getSession();
    return !data.session;
  };

  // Un compte est désormais requis pour publier un site (essai ou payant) —
  // mais on laisse le visiteur explorer les étapes 1 à 3 (catégorie, couleurs,
  // contenu) et voir l'aperçu en direct sans se connecter : l'inscription
  // n'intervient qu'au moment de vraiment publier, pas avant. S'il n'a pas de
  // compte à ce moment-là, on sauvegarde ce qu'il a déjà rempli et on l'envoie
  // s'inscrire ; à son retour (?reprise=1), on restaure tout automatiquement.
  useEffect(() => {
    if (searchParams.get("reprise") !== "1" || session === undefined) return;
    if (!session) return; // pas encore connecté : rien à restaurer
    if (typeof window === "undefined") return;
    try {
      const brouillon = window.localStorage.getItem(DRAFT_KEY);
      if (!brouillon) return;
      const d = JSON.parse(brouillon);
      if (d.secteurId) setSecteurId(d.secteurId);
      if (d.business) setBusiness(d.business);
      if (d.contactNom) setContactNom(d.contactNom);
      // Un brouillon sauvegardé après une session expirée en cours de
      // commande (étape 5) contient aussi ces informations — un brouillon
      // "pas encore de compte" (avant la toute première publication) ne les a
      // pas : dans ce cas on repart simplement de l'étape 3, comme avant.
      if (d.siteId) setSiteId(d.siteId);
      if (d.extensionDomaine) setExtensionDomaine(d.extensionDomaine);
      if (d.duree) setDuree(d.duree);
      if (d.methodePaiement) setMethodePaiement(d.methodePaiement);
      setStep(d.etapeReprise || 3);
      setSessionExpiree(false);
      setErreurPublication("");
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Brouillon corrompu ou illisible : on ignore simplement, l'utilisateur repart de zéro.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, searchParams]);

  const [nouveauProduit, setNouveauProduit] = useState("");
  const [groupeMetierOuvert, setGroupeMetierOuvert] = useState(null);
  const [nouveauPrix, setNouveauPrix] = useState("");
  const [nouvelleCategorie, setNouvelleCategorie] = useState("");
  const [modeAdresse, setModeAdresse] = useState(business.lienGoogleMaps ? "lien" : "texte");
  const [essaiTente, setEssaiTente] = useState(false);
  const [traitement, setTraitement] = useState(false);
  const secteur = SECTEURS.find((s) => s.id === secteurId);
  const estService = secteur?.type === "service";
  const joursRestants = 2;
  const nomValide = business.nom.trim().length > 0;
  // Pas juste "non vide" : au moins 8 chiffres, sinon le lien wa.me généré
  // plus tard (voir lib/genererFichierSite.js) serait cassé silencieusement.
  const whatsappValide = business.whatsapp.replace(/\D/g, "").length >= 8;
  const peutPublier = nomValide && whatsappValide;
  const demoMetierActif = business.metier ? trouverMetier(business.metier)?.demo : null;
  const demoActif = demoMetierActif || secteur?.demo;
  // Exemples utilisés dans les placeholders du formulaire "produits/services"
  // (21/09/2026) : demoActif tient déjà compte du métier précis choisi pour
  // l'artisanat (pas seulement du secteur), donc ces exemples s'adaptent
  // automatiquement au secteur ET au sous-secteur — voir demande du
  // 21/09/2026. Avant ce correctif, ces trois placeholders étaient fixes
  // ("Miel toutes fleurs 500ml", "Boissons"...) quel que soit le secteur.
  const exempleProduit = demoActif?.produits?.[0];
  const exemplesCategories = [...new Set((demoActif?.produits || []).map((p) => p.categorie).filter(Boolean))];

  const couleursSecteur = secteur ? SECTEUR_COULEURS[paletteIdPour(secteur, business)] : [];
  const couleurBaseChoisie = business.couleurs?.baseId
    ? couleursSecteur.find((c) => c.id === business.couleurs.baseId)
    : null;

  const choisirCouleurBase = (couleur) => {
    setBusiness((b) => ({ ...b, couleurs: { ...genererSchema(couleur.hex), baseId: couleur.id, variante: "standard" } }));
  };
  const choisirVariante = (couleur, variante, hex) => {
    setBusiness((b) => ({ ...b, couleurs: { ...genererSchema(hex), baseId: couleur.id, variante } }));
  };

  // Redimensionne et compresse l'image avant de la stocker : une photo de
  // téléphone (souvent 3-8 Mo) devient ainsi quelques dizaines de Ko. Sans ça,
  // publier un site avec logo/bannière/photos de produits pouvait envoyer
  // plusieurs Mo en une seule requête et provoquer un dépassement de délai
  // ("statement timeout") côté base de données.
  const lireImage = (file, callback, largeurMax = 1000) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const echelle = Math.min(1, largeurMax / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * echelle);
        canvas.height = Math.round(img.height * echelle);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => callback(e.target.result); // repli : image brute si le redimensionnement échoue
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const importerLogo = (file) => lireImage(file, (dataUrl) => {
    setBusiness((b) => ({ ...b, logo: dataUrl }));
    extraireCouleurDominante(dataUrl, (hex) => {
      setBusiness((b) => ({ ...b, couleurs: { ...genererSchema(hex), baseId: null, variante: "standard" } }));
    });
  });

  const ajouterProduit = () => {
    if (!nouveauProduit.trim()) return;
    // id persistant (21/09/2026) : chaque produit garde le même identifiant
    // de sa création jusqu'à sa suppression, même après plusieurs allers-
    // retours entre les étapes — voir demande du 21/09/2026, point 6.
    setBusiness((b) => ({ ...b, produits: [...b.produits, { id: crypto.randomUUID(), texte: nouveauProduit.trim(), prix: nouveauPrix.trim(), categorie: nouvelleCategorie.trim(), image: null, description: "" }] }));
    setNouveauProduit(""); setNouveauPrix(""); setNouvelleCategorie("");
  };
  const retirerProduit = (i) => setBusiness((b) => ({ ...b, produits: b.produits.filter((_, idx) => idx !== i) }));
  const imageProduit = (i, file) => lireImage(file, (dataUrl) => {
    setBusiness((b) => ({ ...b, produits: b.produits.map((p, idx) => (idx === i ? { ...p, image: dataUrl } : p)) }));
  });
  const descriptionProduit = (i, texte) => {
    setBusiness((b) => ({ ...b, produits: b.produits.map((p, idx) => (idx === i ? { ...p, description: texte } : p)) }));
  };
  const champProduit = (i, champ, valeur) => {
    setBusiness((b) => ({ ...b, produits: b.produits.map((p, idx) => (idx === i ? { ...p, [champ]: valeur } : p)) }));
  };
  const imageBanniere = (file) => lireImage(file, (dataUrl) => setBusiness((b) => ({ ...b, banniere: dataUrl })));
  const changerReseau = (id, valeur) => setBusiness((b) => ({ ...b, reseaux: { ...b.reseaux, [id]: valeur } }));
  const changerModeLivraison = (modeId) => setBusiness((b) => {
    const actuels = b.modesLivraison && b.modesLivraison.length ? b.modesLivraison : (secteur?.modesLivraison || []);
    const nouveaux = actuels.includes(modeId) ? actuels.filter((m) => m !== modeId) : [...actuels, modeId];
    return { ...b, modesLivraison: nouveaux };
  });

  // Traduit une erreur technique en message compréhensible. Un "statement
  // timeout" juste après une mise à jour de la base de données (migration)
  // est presque toujours temporaire — le plus souvent, réessayer suffit.
  const messageErreurPublication = (error) => {
    const detail = error?.message || "";
    if (detail.toLowerCase().includes("timeout")) {
      return "Le serveur a mis trop de temps à répondre. C'est généralement temporaire — patientez quelques secondes et cliquez à nouveau sur \"Publier\".";
    }
    return "La publication a échoué : " + (detail || "erreur inconnue");
  };

  // Publie réellement le site en base (statut "essai") — réservé aux comptes
  // connectés : un compte permet de retrouver tous ses sites (essai, payés,
  // expirés...) au même endroit, et c'est plus simple pour vous que de gérer
  // des liens privés. Si le visiteur n'est pas encore connecté, on met de
  // côté ce qu'il a déjà rempli et on l'envoie créer un compte (e-mail ou
  // Google) ; il revient directement ici, tout est restauré (voir le useEffect
  // plus haut), il n'a plus qu'à confirmer.
  const publierEssai = async () => {
    if (!peutPublier) { setEssaiTente(true); return; }

    if (!session) {
      sauvegarderBrouillon(3);
      router.push(`/inscription?retour=${encodeURIComponent("/creer?reprise=1")}`);
      return;
    }

    setPublicationEnCours(true);
    setErreurPublication("");
    setSessionExpiree(false);

    const champsCommuns = {
      nom_entreprise: business.nom,
      contact_nom: contactNom || null,
      whatsapp: business.whatsapp,
      email: business.email || null,
      adresse: business.adresse || null,
      lien_google_maps: business.lienGoogleMaps || null,
      secteur_id: secteurId,
      metier: business.metier || null,
      metier_groupe: business.metierGroupe || null,
      accroche: business.accroche || null,
      logo_url: business.logo || null,
      banniere_url: business.banniere || null,
      couleurs: business.couleurs || null,
      produits: business.produits || [],
      reseaux: business.reseaux || {},
      modes_livraison: business.modesLivraison || [],
      horaires: business.horaires || null,
    };

    // BUG CORRIGÉ (21/09/2026) : cette fonction faisait toujours un insert(),
    // même si le site avait déjà été publié une première fois plus tôt dans
    // la même session (siteId déjà connu). Concrètement : créer → publier →
    // revenir à l'étape 3 → modifier/ajouter un produit → cliquer à nouveau
    // sur "Publier" créait un SECOND site en base, orphelinant le premier —
    // exactement le scénario de doublon décrit dans la demande du
    // 21/09/2026 (points 6 et 8). Si siteId existe déjà, on MET À JOUR le
    // site existant (modifier_site_proprietaire, le même chemin que "Gérer
    // mon site") au lieu d'en recréer un nouveau : republier devient
    // idempotent, comme demandé au point 8.
    if (siteId) {
      const { data, error } = await supabase.rpc("modifier_site_proprietaire", { p_site_id: siteId, p_champs: champsCommuns });
      setPublicationEnCours(false);
      if (error) {
        if (await estErreurSession(error)) {
          sauvegarderBrouillon(3);
          setSessionExpiree(true);
          setErreurPublication("Votre session a expiré. Reconnectez-vous pour continuer la publication — toutes vos informations ont été conservées.");
          return;
        }
        setErreurPublication(messageErreurPublication(error));
        return;
      }
      const siteMaj = Array.isArray(data) ? data[0] : data;
      if (siteMaj?.slug) setSiteSlug(siteMaj.slug);
      setStep(4);
      return;
    }

    const { data, error } = await supabase.from("sites").insert([{ ...champsCommuns, statut: "essai", user_id: session.user.id }]).select().single();
    setPublicationEnCours(false);
    if (error) {
      if (await estErreurSession(error)) {
        sauvegarderBrouillon(3);
        setSessionExpiree(true);
        setErreurPublication("Votre session a expiré. Reconnectez-vous pour continuer la publication — toutes vos informations ont été conservées.");
        return;
      }
      setErreurPublication(messageErreurPublication(error));
      return;
    }
    setSiteId(data.id);
    setSiteEditToken(data.edit_token);
    setSiteSlug(data.slug || null);
    setStep(4);
  };

  // Chemin manuel : le client indique avoir déjà envoyé l'argent directement.
  // L'administrateur doit alors confirmer manuellement dans le tableau de bord
  // ("Marquer comme payé"). Un compte est garanti à ce stade (voir
  // publierEssai) : toujours soumis via soumettre_paiement_manuel, jamais via
  // le chemin par jeton (réservé aux sites créés avant l'obligation de compte).
  const confirmerCommande = async () => {
    setTraitement(true);
    setErreurPublication("");
    setSessionExpiree(false);
    const slug = (business.nom || demoActif.nom).toLowerCase().replace(/\s+/g, "");
    const { error } = await supabase.rpc("soumettre_paiement_manuel", {
      p_site_id: siteId,
      p_contact_nom: contactNom,
      p_extension: extensionDomaine,
      p_duree: duree,
      p_montant: PRIX[extensionDomaine][duree],
      p_moyen_paiement: methodePaiement,
      p_domaine: domaineDemande || `${slug}.${extensionDomaine}`,
    });
    setTraitement(false);
    if (error) {
      if (await estErreurSession(error)) {
        // Le site (statut "essai") existe déjà en base à ce stade : on
        // conserve son id pour reprendre directement à l'étape de commande,
        // pas depuis le tout début.
        sauvegarderBrouillon(5);
        setSessionExpiree(true);
        setErreurPublication("Votre session a expiré. Reconnectez-vous pour continuer — votre site et vos informations de commande ont été conservés.");
        return;
      }
      setErreurPublication(messageErreurPublication(error));
      return;
    }
    setPaye(true); setPayeAutomatiquement(false);
  };

  // Chemin automatique : passe par lib/paiementGateway.js, le point d'intégration
  // unique de la future API de paiement. Tant qu'aucun fournisseur réel n'y est
  // branché, cette fonction renvoie "automatique: false" et on redirige vers le
  // parcours manuel — jamais d'activation locale simulée.
  const payerViaAPI = async () => {
    setTraitementAPI(true);
    const resultat = await demarrerPaiement({
      montant: PRIX[extensionDomaine][duree],
      moyenPaiement: methodePaiement,
      siteId,
      description: `Site Sama Site — ${business.nom || demoActif.nom}`,
    });
    setTraitementAPI(false);
    if (!resultat.automatique) {
      setErreurPublication("Le paiement en ligne n'est pas encore configuré. Utilisez le paiement manuel pour envoyer votre règlement ; le site sera activé après confirmation.");
      return;
    }
    // À partir d'ici, un vrai fournisseur est branché : rediriger vers resultat.lienPaiement.
    window.location.href = resultat.lienPaiement;
  };

  const steps = [
    { n: 1, label: "Catégorie", icon: LayoutGrid },
    { n: 2, label: "Couleurs", icon: PaletteIcon },
    { n: 3, label: "Contenu", icon: MessageCircle },
    { n: 4, label: "Essai", icon: Timer },
    { n: 5, label: "Paiement", icon: Wallet },
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 pb-24">
      <div className="flex items-center flex-wrap gap-2 py-7">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const actif = step === s.n || (s.n === 1 && step === 1.5);
          const fait = step > s.n && step !== 1.5;
          // Navigation non-linéaire (21/09/2026, point 4) : une étape déjà
          // franchie reste cliquable pour y revenir directement, sans perdre
          // ce qui a été rempli plus loin — "business" reste la même source
          // de données unique tout au long de l'assistant (voir point 7). On
          // ne permet pas de sauter vers une étape pas encore atteinte.
          const accessible = fait || actif;
          return (
            <React.Fragment key={s.n}>
              <button type="button" disabled={!accessible} onClick={() => accessible && setStep(s.n)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full disabled:cursor-default"
                style={{ background: actif ? T.bleu : fait ? T.bleuClair : "transparent", cursor: accessible ? "pointer" : "default" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: actif ? T.jaune : fait ? T.bleu : T.bleuClairBord }}>
                  {fait ? <Check size={13} color={T.blanc} strokeWidth={3} /> : <Icon size={13} color={actif ? T.bleuFonce : T.gris} strokeWidth={2.4} />}
                </div>
                <span className="text-xs font-semibold hidden sm:inline" style={{ color: actif ? T.blanc : fait ? T.bleu : T.gris }}>{s.label}</span>
              </button>
              {i < steps.length - 1 && <div className="w-3 h-px" style={{ background: T.bleuClairBord }} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ÉTAPE 1 — catégorie */}
      {step === 1 && (
        <div className="entree-douce">
          <h2 className="text-3xl font-bold mb-1" style={{ color: T.encre }}>Quelle est votre catégorie ?</h2>
          <p className="text-sm mb-6" style={{ color: T.gris }}>Le modèle de site s'adapte automatiquement à votre activité.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTEURS.map((s) => {
              const selected = secteurId === s.id;
              return (
                <button key={s.id} onClick={() => {
                  setSecteurId(s.id);
                  setBusiness((b) => ({ ...b, couleurs: null, metier: "", metierGroupe: "" }));
                  if (s.id === "artisanat") { setGroupeMetierOuvert(null); setStep(1.5); }
                }}
                  className="text-left rounded-2xl overflow-hidden carte-hover transition-colors"
                  style={{ background: T.blanc, border: `2px solid ${selected ? T.bleu : T.bleuClairBord}` }}>
                  <div className="relative flex items-center justify-center p-3" style={{ background: "#F8FAFC", height: 120 }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: s.couleurBadge, opacity: selected ? 0.92 : 1 }}>
                      <s.icon size={26} color="#fff" strokeWidth={1.8} />
                    </div>
                    {selected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: T.bleu }}>
                        <Check size={13} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold" style={{ color: T.encre }}>{s.label}</div>
                    <div className="text-xs mt-1" style={{ color: T.gris }}>{s.description}</div>
                    {s.id === "artisanat" && business.metier && (
                      <div className="mt-2"><Badge tone="vert"><Check size={10} /> {business.metier}</Badge></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end mt-8">
            <button disabled={!secteurId || (secteurId === "artisanat" && !business.metier)} onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold disabled:opacity-30 bouton-hover" style={{ background: T.bleu, color: T.blanc }}>
              Continuer <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 1.5 — page dédiée : choix du métier (uniquement pour Artisanat & Réparation) */}
      {step === 1.5 && (
        <div className="entree-douce">
          <button onClick={() => (groupeMetierOuvert ? setGroupeMetierOuvert(null) : setStep(1))}
            className="flex items-center gap-2 text-sm font-semibold mb-6" style={{ color: T.bleu }}>
            <ArrowLeft size={16} /> {groupeMetierOuvert ? "Tous les domaines" : "Retour aux catégories"}
          </button>

          {!groupeMetierOuvert ? (
            <>
              <h2 className="text-3xl font-bold mb-1" style={{ color: T.encre }}>Quel est votre métier ?</h2>
              <p className="text-sm mb-8" style={{ color: T.gris }}>Choisissez le domaine qui correspond le mieux à votre activité.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {METIERS_ARTISANAT.map((groupe) => {
                  const GroupeIcon = groupe.icon;
                  const actif = business.metierGroupe === groupe.nom;
                  return (
                    <button key={groupe.nom} onClick={() => setGroupeMetierOuvert(groupe.nom)}
                      className="flex flex-col items-center gap-2.5 rounded-2xl p-5 text-center carte-hover"
                      style={{ background: T.blanc, border: `2px solid ${actif ? T.bleu : T.bleuClairBord}` }}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: T.bleuClair }}>
                        <GroupeIcon size={26} color={T.bleu} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: T.encre }}>{groupe.nom}</span>
                      <span className="text-xs" style={{ color: T.gris }}>{groupe.metiers.length} métiers</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-1" style={{ color: T.encre }}>{groupeMetierOuvert}</h2>
              <p className="text-sm mb-8" style={{ color: T.gris }}>Choisissez le métier précis qui correspond à votre activité.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(METIERS_ARTISANAT.find((g) => g.nom === groupeMetierOuvert)?.metiers || []).map((m) => {
                  const MIcon = m.icon;
                  const choisi = business.metier === m.nom;
                  return (
                    <button key={m.nom} onClick={() => setBusiness((b) => ({ ...b, metier: m.nom, metierGroupe: groupeMetierOuvert }))}
                      className="flex items-center gap-3 rounded-xl p-4 text-left carte-hover"
                      style={{ background: choisi ? T.bleu : T.blanc, border: `2px solid ${choisi ? T.bleu : T.bleuClairBord}` }}>
                      <MIcon size={18} color={choisi ? "#fff" : T.bleu} className="shrink-0" />
                      <span className="text-sm font-semibold flex-1" style={{ color: choisi ? "#fff" : T.encre }}>{m.nom}</span>
                      {choisi && <Check size={16} color="#fff" className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex justify-end mt-8">
            <button disabled={!business.metier} onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold disabled:opacity-30 bouton-hover" style={{ background: T.bleu, color: T.blanc }}>
              Continuer <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 — couleurs */}
      {step === 2 && secteur && (
        <div className="entree-douce">
          <h2 className="text-3xl font-bold mb-1" style={{ color: T.encre }}>Choisissez vos couleurs</h2>
          <p className="text-sm mb-6" style={{ color: T.gris }}>Des couleurs pensées pour {secteur.label.toLowerCase()} — chacune se décline en 2 variantes.</p>

          <label className="flex items-center gap-3 rounded-xl mb-6 p-3 cursor-pointer max-w-md" style={{ background: T.bleuClair, border: `1.5px dashed ${T.bleuClairBord}` }}>
            <div className="w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center shrink-0" style={{ background: T.blanc }}>
              {business.logo ? <img src={business.logo} alt="Logo" className="w-full h-full object-contain p-1" /> : <Image size={18} color={T.bleu} />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: T.bleu }}>{business.logo ? "Régénérer depuis mon logo" : "Utiliser les couleurs de mon logo"}</div>
              <div className="text-xs" style={{ color: T.gris }}>Uploadez votre logo, on en extrait une palette assortie</div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => importerLogo(e.target.files[0])} />
          </label>

          <p className="text-xs font-semibold mb-2" style={{ color: T.gris }}>{couleursSecteur.length} couleurs suggérées pour {secteur.label.toLowerCase()}</p>
          <div className="grid grid-cols-5 gap-2 mb-6">
            {couleursSecteur.map((couleur) => {
              const actif = business.couleurs?.baseId === couleur.id;
              return (
                <button key={couleur.id} onClick={() => choisirCouleurBase(couleur)}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2"
                  style={{ background: T.blanc, border: `2px solid ${actif ? T.bleu : T.bleuClairBord}` }}>
                  <div className="w-full aspect-square rounded-lg" style={{ background: couleur.hex }} />
                  <span className="text-[9px] font-semibold leading-tight text-center line-clamp-2" style={{ color: T.encre }}>{couleur.name}</span>
                </button>
              );
            })}
          </div>

          {couleurBaseChoisie && (
            <>
              <p className="text-xs font-semibold mb-2" style={{ color: T.gris }}>2 variantes de « {couleurBaseChoisie.name} »</p>
              <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
                {(() => {
                  const { clair, fonce } = deriverVariantes(couleurBaseChoisie.hex);
                  const options = [
                    { id: "standard", label: "Standard", hex: couleurBaseChoisie.hex },
                    { id: "clair", label: "Claire", hex: clair },
                    { id: "fonce", label: "Foncée", hex: fonce },
                  ];
                  return options.map((opt) => {
                    const selected = business.couleurs?.variante === opt.id;
                    return (
                      <button key={opt.id} onClick={() => choisirVariante(couleurBaseChoisie, opt.id, opt.hex)}
                        className="flex flex-col items-center gap-2 rounded-xl p-3"
                        style={{ background: T.blanc, border: `2px solid ${selected ? T.bleu : T.bleuClairBord}` }}>
                        <div className="relative w-full rounded-lg overflow-hidden" style={{ height: 48, background: opt.hex }}>
                          {selected && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.3)" }}>
                              <Check size={16} color="#fff" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: T.encre }}>{opt.label}</span>
                      </button>
                    );
                  });
                })()}
              </div>
            </>
          )}

          {business.couleurs && (
            <div className="rounded-2xl p-5 mb-6 max-w-md" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
              <p className="text-xs font-semibold mb-3" style={{ color: T.gris }}>Votre palette de site (3 couleurs)</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { c: business.couleurs.primaire, label: "Principale" },
                  { c: business.couleurs.fond, label: "Fond" },
                  { c: business.couleurs.accent, label: "Accent" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-full rounded-lg" style={{ height: 48, background: item.c, border: `1px solid ${T.bleuClairBord}` }} />
                    <span className="text-[10px] font-medium" style={{ color: T.gris }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-2">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-opacity duration-200 hover:opacity-60" style={{ color: T.bleu }}><ArrowLeft size={16} /> Retour</button>
            <button disabled={!business.couleurs} onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold disabled:opacity-30 bouton-hover" style={{ background: T.bleu, color: T.blanc }}>Continuer <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — contenu */}
      {step === 3 && secteur && (
        <div className="grid md:grid-cols-2 gap-8 entree-douce">
          <div>
            <h2 className="text-3xl font-bold mb-1" style={{ color: T.encre }}>Parlez-nous de votre activité</h2>
            <p className="text-sm mb-6" style={{ color: T.gris }}>Ces informations apparaissent sur votre site.</p>

            <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Logo</label>
            <div className="flex items-center gap-3 mb-4">
              <label className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer shrink-0" style={{ background: business.logo ? "transparent" : T.bleuClair, border: `1.5px dashed ${T.bleuClairBord}` }}>
                {business.logo ? <img src={business.logo} alt="Logo" className="w-full h-full object-contain p-1.5" /> : <Upload size={16} color={T.bleu} />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => lireImage(e.target.files[0], (dataUrl) => setBusiness((b) => ({ ...b, logo: dataUrl })))} />
              </label>
              <div className="text-xs flex-1" style={{ color: T.gris }}>
                {business.logo ? "Affiché discrètement sur la bannière et dans le pied de page." : "Facultatif — sans logo, une icône représente votre secteur."}
              </div>
              {business.logo && (
                <button onClick={() => setBusiness((b) => ({ ...b, logo: null }))} className="text-xs font-semibold shrink-0" style={{ color: T.rouge }}>Retirer</button>
              )}
            </div>

            <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Bannière du site</label>
            {business.banniere ? (
              <div className="mb-4">
                <div className="relative rounded-xl overflow-hidden mb-2" style={{ height: 100, border: `1.5px solid ${T.bleuClairBord}` }}>
                  <img src={business.banniere} alt="Bannière" className="w-full h-full object-cover" />
                  <button onClick={() => setBusiness((b) => ({ ...b, banniere: null, texteBanniere: "" }))}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(15,23,42,0.6)" }}>
                    <X size={14} color="#fff" />
                  </button>
                </div>
                <input value={business.texteBanniere} onChange={(e) => setBusiness((b) => ({ ...b, texteBanniere: e.target.value }))}
                  placeholder="Texte affiché sur la bannière (facultatif)" maxLength={40}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }} />
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-xl mb-4 cursor-pointer" style={{ height: 76, background: T.bleuClair, border: `1.5px dashed ${T.bleuClairBord}` }}>
                <Upload size={16} color={T.bleu} />
                <span className="text-sm font-semibold" style={{ color: T.bleu }}>Ajouter une bannière</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => imageBanniere(e.target.files[0])} />
              </label>
            )}

            <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Nom du commerce <span style={{ color: T.rouge }}>*</span></label>
            <input value={business.nom} onChange={(e) => setBusiness((b) => ({ ...b, nom: e.target.value }))} placeholder={demoActif.nom}
              className="w-full rounded-xl px-4 py-3 mb-1 text-sm outline-none" style={{ background: T.blanc, border: `1.5px solid ${essaiTente && !nomValide ? T.rouge : T.bleuClairBord}` }} />
            {essaiTente && !nomValide && <p className="text-xs mb-3" style={{ color: T.rouge }}>Le nom de votre commerce est requis.</p>}
            {!(essaiTente && !nomValide) && <div className="mb-4" />}

            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold" style={{ color: T.gris }}>Accroche</label>
              <AssistantIA texte={business.accroche} onAppliquer={(t) => setBusiness((b) => ({ ...b, accroche: t }))}
                entreprise={business.nom} secteurLabel={secteur.label} champLabel="l'accroche affichée sous le nom du site" />
            </div>
            <input value={business.accroche} onChange={(e) => setBusiness((b) => ({ ...b, accroche: e.target.value }))} placeholder={demoActif.accroche}
              className="w-full rounded-xl px-4 py-3 mb-4 text-sm outline-none" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }} />

            <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Numéro WhatsApp <span style={{ color: T.rouge }}>*</span></label>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-1" style={{ background: T.blanc, border: `1.5px solid ${essaiTente && !whatsappValide ? T.rouge : T.bleuClairBord}` }}>
              <MessageCircle size={16} color="#25D366" strokeWidth={2} />
              <input value={business.whatsapp} onChange={(e) => setBusiness((b) => ({ ...b, whatsapp: e.target.value }))} placeholder="77 000 00 00" className="text-sm outline-none flex-1 bg-transparent" />
            </div>
            {essaiTente && !whatsappValide && <p className="text-xs mb-3" style={{ color: T.rouge }}>Entrez un numéro WhatsApp valide (au moins 8 chiffres) — c'est le canal de commande de votre site.</p>}
            {!(essaiTente && !whatsappValide) && <div className="mb-4" />}

            <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Adresse e-mail</label>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
              <Mail size={16} color={T.gris} strokeWidth={2} />
              <input value={business.email} onChange={(e) => setBusiness((b) => ({ ...b, email: e.target.value }))} placeholder="contact@moncommerce.sn" className="text-sm outline-none flex-1 bg-transparent" />
            </div>

            <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Localisation</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button type="button" onClick={() => setModeAdresse("texte")}
                className="rounded-xl py-2.5 text-xs font-semibold" style={{ background: modeAdresse === "texte" ? T.bleuClair : T.blanc, border: `1.5px solid ${modeAdresse === "texte" ? T.bleu : T.bleuClairBord}`, color: modeAdresse === "texte" ? T.bleu : T.gris }}>
                Indiquer mon adresse
              </button>
              <button type="button" onClick={() => setModeAdresse("lien")}
                className="rounded-xl py-2.5 text-xs font-semibold" style={{ background: modeAdresse === "lien" ? T.bleuClair : T.blanc, border: `1.5px solid ${modeAdresse === "lien" ? T.bleu : T.bleuClairBord}`, color: modeAdresse === "lien" ? T.bleu : T.gris }}>
                J'ai une fiche Google Maps
              </button>
            </div>
            {modeAdresse === "texte" ? (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
                <MapPin size={16} color={T.gris} strokeWidth={2} />
                <input value={business.adresse} onChange={(e) => setBusiness((b) => ({ ...b, adresse: e.target.value, lienGoogleMaps: "" }))} placeholder="Sacré-Cœur 3, Dakar" className="text-sm outline-none flex-1 bg-transparent" />
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
                  <Link2 size={16} color={T.gris} strokeWidth={2} />
                  <input value={business.lienGoogleMaps} onChange={(e) => setBusiness((b) => ({ ...b, lienGoogleMaps: e.target.value }))} placeholder="Collez le lien de votre fiche Google Maps" className="text-sm outline-none flex-1 bg-transparent" />
                </div>
                <p className="text-xs mt-1.5" style={{ color: T.gris }}>Elle s'affichera automatiquement sur votre site, dans le pied de page.</p>
              </div>
            )}

            <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>{secteur.libelleCatalogue}</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input value={nouveauProduit} onChange={(e) => setNouveauProduit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ajouterProduit()}
                placeholder={exempleProduit?.texte ? `ex. ${exempleProduit.texte}` : (estService ? "ex. Consultation initiale" : "ex. Nom du produit")}
                className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }} />
              <input value={nouveauPrix} onChange={(e) => setNouveauPrix(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ajouterProduit()}
                placeholder={exempleProduit?.prix ? `Prix (ex. ${exempleProduit.prix})` : "Prix (ex. 2 500 F)"}
                className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }} />
            </div>
            <div className="flex gap-2 mb-2">
              <div className="flex items-center gap-2 rounded-xl px-4 py-2 flex-1" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
                <Tag size={14} color={T.gris} />
                <input value={nouvelleCategorie} onChange={(e) => setNouvelleCategorie(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ajouterProduit()}
                  placeholder={exemplesCategories.length ? `Catégorie (facultative, ex. ${exemplesCategories.slice(0, 2).join(", ")})` : "Catégorie (facultative)"}
                  className="text-sm outline-none flex-1 bg-transparent" />
              </div>
              <button onClick={ajouterProduit} className="w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.bleu }}>
                <Plus size={18} color={T.blanc} strokeWidth={2.4} />
              </button>
            </div>
            <div className="space-y-2 mb-6">
              {business.produits.map((p, i) => (
                <div key={p.id || i} className="rounded-lg p-2.5" style={{ background: T.bleuClair }}>
                  <div className="flex items-center gap-2.5">
                    <label className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center cursor-pointer" style={{ background: p.image ? "transparent" : T.blanc, border: `1px dashed ${T.bleuClairBord}` }}>
                      {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Image size={14} color={T.gris} />}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => imageProduit(i, e.target.files[0])} />
                    </label>
                    <span className="text-sm flex-1" style={{ color: T.encre }}>{p.texte}</span>
                    <button onClick={() => retirerProduit(i)}><X size={15} color={T.gris} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <input value={p.prix || ""} onChange={(e) => champProduit(i, "prix", e.target.value)} placeholder="Prix"
                      className="rounded-lg px-3 py-2 text-xs outline-none" style={{ background: T.blanc, border: `1px solid ${T.bleuClairBord}` }} />
                    <input value={p.categorie || ""} onChange={(e) => champProduit(i, "categorie", e.target.value)} placeholder="Catégorie"
                      className="rounded-lg px-3 py-2 text-xs outline-none" style={{ background: T.blanc, border: `1px solid ${T.bleuClairBord}` }} />
                  </div>
                  <input value={p.description || ""} onChange={(e) => descriptionProduit(i, e.target.value)}
                    placeholder="Description détaillée (facultative)"
                    className="w-full mt-1.5 rounded-lg px-3 py-2 text-xs outline-none" style={{ background: T.blanc, border: `1px solid ${T.bleuClairBord}` }} />
                  <div className="mt-1.5">
                    <AssistantIA texte={p.description} onAppliquer={(t) => descriptionProduit(i, t)}
                      entreprise={business.nom} secteurLabel={secteur.label} champLabel={`la description de « ${p.texte} »`} />
                  </div>
                </div>
              ))}
              {business.produits.length === 0 && <p className="text-xs italic" style={{ color: T.gris }}>Sans ajout, l'aperçu utilise des exemples du secteur. Photo, prix, catégorie et description sont facultatifs.</p>}
            </div>

            {secteur.modesLivraison.length > 0 && (
              <>
                <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Modes de commande proposés</label>
                <div className="flex flex-wrap gap-2 mb-6">
                  {secteur.modesLivraison.map((modeId) => {
                    const m = MODES_LIVRAISON[modeId];
                    const actifs = business.modesLivraison && business.modesLivraison.length ? business.modesLivraison : secteur.modesLivraison;
                    const actif = actifs.includes(modeId);
                    const MIcon = m.icon;
                    return (
                      <button key={modeId} type="button" onClick={() => changerModeLivraison(modeId)}
                        className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold"
                        style={{ background: actif ? T.bleuClair : T.blanc, border: `1.5px solid ${actif ? T.bleu : T.bleuClairBord}`, color: actif ? T.bleu : T.gris }}>
                        <MIcon size={13} /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Réseaux sociaux (facultatif)</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {RESEAUX_SOCIAUX.map((r) => {
                const RIcon = r.icon;
                return (
                  <div key={r.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
                    <RIcon size={15} color={T.gris} />
                    <input value={business.reseaux?.[r.id] || ""} onChange={(e) => changerReseau(r.id, e.target.value)}
                      placeholder={r.label} className="text-xs outline-none flex-1 bg-transparent" />
                  </div>
                );
              })}
            </div>
            <p className="text-xs mb-6" style={{ color: T.gris }}>Un réseau ne s'affiche sur votre site que si vous renseignez son lien.</p>

            <EditeurHoraires horaires={business.horaires} onChange={(h) => setBusiness((b) => ({ ...b, horaires: h }))} />
          </div>

          <div>
            <p className="text-xs font-semibold mb-3 text-center flex items-center justify-center gap-1.5" style={{ color: T.gris }}><Globe size={13} /> Aperçu en direct</p>
            <ApercuSite secteur={secteur} business={business} paye={paye} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-8 entree-douce">
          {essaiTente && !peutPublier && (
            <p className="text-xs font-medium mb-3" style={{ color: T.rouge }}>
              Renseignez au moins le nom du commerce et le numéro WhatsApp avant de publier.
            </p>
          )}
          {erreurPublication && (
            <p className="text-xs font-medium mb-3" style={{ color: T.rouge }}>{erreurPublication}</p>
          )}
          {sessionExpiree && (
            <button onClick={() => router.push(`/connexion?retour=${encodeURIComponent("/creer?reprise=1")}`)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mb-3" style={{ background: T.jaune, color: T.bleuFonce }}>
              Se reconnecter <ArrowRight size={15} />
            </button>
          )}
          <div className="flex justify-between items-center">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-opacity duration-200 hover:opacity-60" style={{ color: T.bleu }}><ArrowLeft size={16} /> Retour</button>
            <button disabled={publicationEnCours} onClick={publierEssai}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold disabled:opacity-50 bouton-hover" style={{ background: T.bleu, color: T.blanc }}>
              {publicationEnCours ? (
                <><RefreshCw size={16} className="animate-spin" /> Publication…</>
              ) : (
                <>Publier l'essai gratuit <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 4 — essai */}
      {step === 4 && secteur && (
        <div className="entree-douce">
          <div className="rounded-2xl p-5 mb-4 flex items-center gap-4" style={{ background: T.jauneFond, border: `1.5px solid #F5E7A8` }}>
            <AnneauCompteARebours joursRestants={joursRestants} />
            <div>
              <p className="font-semibold text-sm" style={{ color: T.jauneFonce }}>Votre site est en ligne pour 2 jours d'essai</p>
              <p className="text-xs mt-0.5" style={{ color: T.jauneFonce }}>
                Publié sur <strong>samasite.online/s/{siteSlug || "…"}</strong> — passé ce délai sans paiement, le site n'est plus publié (il reste dans votre compte).
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-5 mb-8 flex items-start gap-3" style={{ background: T.bleuClair, border: `1.5px solid ${T.bleuClairBord}` }}>
            <CheckCircle2 size={18} color={T.bleu} className="mt-0.5 shrink-0" />
            <p className="text-xs" style={{ color: T.encre }}>
              Ce site est enregistré dans votre compte — retrouvez-le et modifiez-le à tout moment depuis{" "}
              <a href="/espace" className="font-semibold" style={{ color: T.bleu }}>Mon espace</a>.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <ApercuSite secteur={secteur} business={business} paye={paye} />
            <div className="space-y-4">
              <h3 className="text-2xl font-bold" style={{ color: T.encre }}>Ça vous plaît ?</h3>
              <p className="text-sm" style={{ color: T.gris }}>Partagez le lien à vos clients pendant l'essai. Pour garder le site et passer à votre propre nom de domaine, activez votre abonnement.</p>
              {siteSlug && (
                <div className="flex items-center gap-2">
                  <a href={`/s/${siteSlug}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-lg min-w-0" style={{ background: T.bleuClair, color: T.bleu, textDecoration: "underline" }}>
                    <Globe size={14} className="shrink-0" /> <span className="truncate">samasite.online/s/{siteSlug}</span>
                  </a>
                  <button type="button" onClick={copierLienSite} title="Copier le lien"
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                    style={{ background: lienCopie ? T.vert : T.bleuClair, color: lienCopie ? T.blanc : T.bleu, border: `1.5px solid ${T.bleuClairBord}` }}>
                    {lienCopie ? <Check size={14} /> : <Copy size={14} />} {lienCopie ? "Copié" : "Copier"}
                  </button>
                </div>
              )}
              {siteSlug && (
                <a href={`/s/${siteSlug}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bouton-hover" style={{ background: T.bleu, color: T.blanc }}>
                  <Globe size={15} /> Voir mon site en ligne
                </a>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-opacity duration-200 hover:opacity-60" style={{ color: T.bleu }}><ArrowLeft size={16} /> Retour</button>
            <button onClick={() => setStep(5)} className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bouton-hover" style={{ background: T.bleu, color: T.blanc }}>Activer mon site <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* ÉTAPE 5 — abonnement & paiement */}
      {step === 5 && !paye && (
        <div className="entree-douce">
          <h2 className="text-3xl font-bold mb-1" style={{ color: T.encre }}>Passez votre site en ligne</h2>
          <p className="text-sm mb-6" style={{ color: T.gris }}>Une seule offre : votre site avec un nom de domaine inclus.</p>

          <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Extension du domaine</label>
          <div className="grid sm:grid-cols-2 gap-3 mb-6 max-w-md">
            {DOMAINES.map((d) => {
              const selected = extensionDomaine === d.id;
              return (
                <button key={d.id} onClick={() => setExtensionDomaine(d.id)} className="text-left rounded-2xl p-4 carte-hover" style={{ background: T.blanc, border: `2px solid ${selected ? T.bleu : T.bleuClairBord}` }}>
                  <div className="font-bold" style={{ color: T.encre }}>{d.label}</div>
                  <div className="text-xs mt-1" style={{ color: T.gris }}>{d.note}</div>
                </button>
              );
            })}
          </div>

          {extensionDomaine && (
            <>
              <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Durée</label>
              <div className="grid sm:grid-cols-2 gap-3 mb-6 max-w-md">
                {DUREES.map((d) => {
                  const selected = duree === d.id;
                  const prix = PRIX[extensionDomaine][d.id];
                  return (
                    <button key={d.id} onClick={() => setDuree(d.id)} className="text-left rounded-2xl p-4 relative carte-hover" style={{ background: T.blanc, border: `2px solid ${selected ? T.bleu : T.bleuClairBord}` }}>
                      {d.note && <div className="absolute -top-3 left-4"><Badge tone="jaune"><Sparkles size={11} /> Meilleur prix</Badge></div>}
                      <div className="font-bold" style={{ color: T.encre }}>{d.label}</div>
                      <div className="text-lg font-bold mt-1" style={{ color: T.bleu }}>{prix.toLocaleString("fr-FR")} F</div>
                      {d.note && <div className="text-xs mt-1" style={{ color: T.gris }}>{d.note}</div>}
                    </button>
                  );
                })}
              </div>

              <label className="block text-xs font-semibold mb-1.5" style={{ color: T.gris }}>Nom de domaine souhaité</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 max-w-sm mb-1" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }}>
                <Link2 size={15} color={T.gris} />
                <input value={domaineDemande} onChange={(e) => setDomaineDemande(e.target.value)}
                  placeholder={`${(business.nom || secteur?.demo.nom || "moncommerce").toLowerCase().replace(/\s+/g, "")}.${extensionDomaine}`}
                  className="text-sm outline-none flex-1 bg-transparent" />
              </div>
              <p className="text-xs mb-6" style={{ color: T.gris }}>Nous achetons et connectons ce domaine dès confirmation du paiement — livraison sous 48h.</p>
            </>
          )}

          {duree && (
            <div className="mb-6 rounded-2xl p-5 max-w-md" style={{ background: T.bleuClair, border: `1.5px solid ${T.bleuClairBord}` }}>
              <div className="flex items-center gap-2 mb-3.5">
                <ClipboardList size={15} color={T.bleu} />
                <span className="text-sm font-bold" style={{ color: T.encre }}>Ce que vous payez, en clair</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium" style={{ color: T.encre }}>Site + domaine {DOMAINES.find((d) => d.id === extensionDomaine)?.label} — {DUREES.find((d) => d.id === duree)?.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: T.gris }}>Hébergement de votre site et réservation du nom de domaine à votre nom</div>
                  </div>
                  <div className="text-sm font-bold shrink-0" style={{ color: T.encre }}>{PRIX[extensionDomaine][duree].toLocaleString("fr-FR")} F</div>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium" style={{ color: T.encre }}>Modifications après mise en ligne</div>
                    <div className="text-xs mt-0.5" style={{ color: T.gris }}>Textes, produits, couleurs — {PRIX_MODIFICATION.toLocaleString("fr-FR")} F par modification enregistrée, une fois votre site actif</div>
                  </div>
                  <Badge tone="jaune">{PRIX_MODIFICATION.toLocaleString("fr-FR")} F / modif.</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: `1.5px solid ${T.bleuClairBord}` }}>
                <span className="text-sm font-bold" style={{ color: T.encre }}>Total à payer aujourd'hui</span>
                <span className="text-xl font-bold" style={{ color: T.bleu }}>{PRIX[extensionDomaine][duree].toLocaleString("fr-FR")} F</span>
              </div>
              <p className="text-xs mt-2" style={{ color: T.gris }}>
                Ce montant couvre {DUREES.find((d) => d.id === duree)?.label}. Nous vous recontacterons par e-mail avant l'échéance pour renouveler.
              </p>
            </div>
          )}

          {duree && (
            <div className="mb-6 max-w-md">
              <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Vos coordonnées, pour vous livrer le site</label>
              <input value={contactNom} onChange={(e) => setContactNom(e.target.value)} placeholder="Votre nom complet"
                className="w-full rounded-xl px-4 py-3 mb-2 text-sm outline-none" style={{ background: T.blanc, border: `1.5px solid ${T.bleuClairBord}` }} />
              {!business.email && (
                <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-lg" style={{ background: T.rougeFond, color: T.rouge }}>
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> Ajoutez votre adresse e-mail à l'étape « Contenu » — c'est là que nous enverrons le lien de votre site.
                </div>
              )}
            </div>
          )}

          {duree && (
            <div className="mb-6">
              <label className="block text-xs font-semibold mb-2" style={{ color: T.gris }}>Moyen de paiement</label>
              <div className="grid grid-cols-3 gap-2.5 max-w-md">
                {Object.entries(PAIEMENTS).map(([id, p]) => {
                  const Icon = p.icon;
                  const selected = methodePaiement === id;
                  return (
                    <button key={id} onClick={() => setMethodePaiement(id)} className="flex flex-col items-center gap-1.5 rounded-xl py-3.5 px-1 carte-hover"
                      style={{ background: selected ? p.bg : T.blanc, border: `2px solid ${selected ? p.color : T.bleuClairBord}` }}>
                      <Icon size={20} color={p.color} strokeWidth={2} />
                      <span className="text-xs font-semibold text-center leading-tight" style={{ color: T.encre }}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {erreurPublication && (
            <p className="text-xs font-medium mb-3" style={{ color: T.rouge }}>{erreurPublication}</p>
          )}
          {sessionExpiree && (
            <button onClick={() => router.push(`/connexion?retour=${encodeURIComponent("/creer?reprise=1")}`)}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mb-3" style={{ background: T.jaune, color: T.bleuFonce }}>
              Se reconnecter <ArrowRight size={15} />
            </button>
          )}

          <div className="flex flex-col items-end gap-2.5">
            <div className="w-full rounded-xl px-4 py-3 text-xs" style={{ background: T.bleuClair, color: T.gris, border: `1px solid ${T.bleuClairBord}` }}>
              <div className="font-semibold" style={{ color: T.encre }}>Paiement en ligne bientôt disponible</div>
              <div className="mt-1">Pour le moment, envoyez votre règlement directement puis confirmez votre commande ci-dessous.</div>
            </div>
            <button disabled={!duree || !methodePaiement || !contactNom || !business.email || traitement || traitementAPI}
              onClick={confirmerCommande}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold disabled:opacity-30 bouton-hover" style={{ background: T.bleu, color: T.blanc }}>
              {traitement ? (
                <><RefreshCw size={15} className="animate-spin" /> Enregistrement…</>
              ) : (
                <><Wallet size={15} /> J'ai déjà envoyé l'argent</>
              )}
            </button>
          </div>

          <div className="flex justify-start items-center mt-4">
            <button onClick={() => setStep(4)} disabled={traitement || traitementAPI} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold disabled:opacity-30 transition-opacity duration-200 hover:opacity-60" style={{ color: T.bleu }}><ArrowLeft size={16} /> Retour</button>
          </div>
        </div>
      )}

      {step === 5 && paye && payeAutomatiquement && (
        <div className="max-w-md mx-auto text-center py-10 entree-douce">
          <img src={IMG_CONFIRMED} alt="Paiement confirmé" className="mx-auto mb-4 max-w-xs w-full" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: T.encre }}>Paiement confirmé</h2>
          <p className="text-sm mb-6" style={{ color: T.gris }}>
            Votre site est <strong style={{ color: T.encre }}>activé immédiatement</strong>, payé via <strong style={{ color: T.encre }}>{PAIEMENTS[methodePaiement]?.label}</strong>.
          </p>
          <div className="text-left rounded-2xl p-4 text-sm flex items-start gap-2.5 mb-4" style={{ background: T.bleuClair, color: T.bleu }}>
            <Mail size={16} className="mt-0.5 shrink-0" />
            Le domaine <strong>{domaineDemande || `${(business.nom || "").toLowerCase().replace(/\s+/g, "")}.${extensionDomaine}`}</strong> vous est livré par e-mail à <strong>{business.email}</strong> sous 48h.
          </div>
          <button onClick={() => router.push("/espace")} className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full text-sm font-bold bouton-hover" style={{ background: T.bleu, color: T.blanc }}>
            Aller à mon espace <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 5 && paye && !payeAutomatiquement && (
        <div className="max-w-md mx-auto text-center py-10 entree-douce">
          <img src={IMG_CONFIRMED} alt="Commande enregistrée" className="mx-auto mb-4 max-w-xs w-full" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: T.encre }}>Commande enregistrée</h2>
          <p className="text-sm mb-6" style={{ color: T.gris }}>
            Il ne reste qu'une étape : envoyez <strong style={{ color: T.encre }}>{PRIX[extensionDomaine][duree].toLocaleString("fr-FR")} F</strong> via <strong style={{ color: T.encre }}>{PAIEMENTS[methodePaiement]?.label}</strong> au <strong style={{ color: T.encre }}>{WHATSAPP_SUPPORT.replace("221", "")}</strong>, en indiquant le nom de votre commerce en référence.
          </p>
          <div className="text-left rounded-2xl p-4 text-sm flex items-start gap-2.5 mb-4" style={{ background: T.bleuClair, color: T.bleu }}>
            <Mail size={16} className="mt-0.5 shrink-0" />
            Dès réception du paiement, votre site est activé et le domaine <strong>{domaineDemande || `${(business.nom || "").toLowerCase().replace(/\s+/g, "")}.${extensionDomaine}`}</strong> vous est livré par e-mail à <strong>{business.email}</strong> sous 48h.
          </div>
          <a href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(`Bonjour, je viens de commander mon site "${business.nom}" et je vous envoie la preuve de paiement.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full text-sm font-bold mb-3 bouton-hover" style={{ background: "#25D366", color: "#fff" }}>
            Envoyer ma preuve de paiement sur WhatsApp
          </a>
          <button onClick={() => router.push("/espace")} className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full text-sm font-bold bouton-hover" style={{ background: T.bleuClair, color: T.bleu }}>
            Aller à mon espace <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

