// ============================================================
// Sama Site — Données de référence (secteurs, couleurs, métiers, etc.)
// Extrait fidèlement du prototype, sans modification de contenu.
// ============================================================
import {
  Utensils, Droplet, Wheat, Hammer,
  Home, GraduationCap, BedDouble, Stethoscope,
  Car, CircleDot, Zap, Droplets, Ruler, Layers, Grid3x3, Paintbrush, Square, Snowflake,
  Flower2, Shirt, Scissors, User, Hand, Heart, Star, Package, Leaf, Gem, ShoppingBag,
  Footprints, Palette as PaletteIcon, Cpu, Smartphone, Settings, Settings2, Image, Printer, Wrench,
  Music2, UtensilsCrossed, Store, Truck, Facebook, Instagram, Twitter, ShoppingBasket, Sparkles,
  Edit3, LayoutGrid, MessageCircle, Eye, Rocket, CalendarDays, CreditCard, Globe,
} from "lucide-react";

export const T = {
  bleu: "#2563EB",
  bleuFonce: "#1E3A8A",
  bleuClair: "#EFF6FF",
  bleuClairBord: "#DBEAFE",
  jaune: "#FACC15",
  jauneFonce: "#92650A",
  jauneFond: "#FEF9E7",
  encre: "#0F172A",
  gris: "#64748B",
  vert: "#16A34A",
  vertFond: "#EFFCF3",
  rouge: "#DC2626",
  rougeFond: "#FEF0EF",
  blanc: "#FFFFFF",
};



export const SECTEURS = [
  {
    id: "restaurant",
    couleurBadge: "#E5484D",
    label: "Restaurant & Fast-food",
    description: "Présentez votre menu du jour et recevez vos commandes directement sur WhatsApp.",
    icon: Utensils,
    type: "catalogue",
    libelleCatalogue: "Notre menu",
    libelleAction: "Commander",
    modesLivraison: ["sur_place", "emporter", "livraison"],
    demo: {
      nom: "Restaurant du jour",
      accroche: "Un menu qui change chaque jour, un jus qui vous suit toute la semaine",
      produits: [
        { texte: "Thiéboudienne du jour", prix: "2 500 F", categorie: "Plats" },
        { texte: "Jus bissap frais", prix: "500 F", categorie: "Boissons" },
        { texte: "Pastels maison (x6)", prix: "1 000 F", categorie: "Entrées" },
        { texte: "Thiakry maison", prix: "800 F", categorie: "Desserts" },
      ],
    },
  },
  {
    id: "cosmetique",
    couleurBadge: "#EC8FB0",
    label: "Cosmétique naturelle",
    description: "Mettez en valeur vos produits faits main et laissez vos clientes commander en un message.",
    icon: Leaf,
    type: "catalogue",
    libelleCatalogue: "Nos produits",
    libelleAction: "Commander",
    modesLivraison: ["retrait", "livraison"],
    demo: {
      nom: "Cosmétique naturelle",
      accroche: "Des soins 100% naturels, faits main à Dakar",
      produits: [
        { texte: "Beurre de karité pur", prix: "3 000 F", categorie: "Soins visage" },
        { texte: "Savon noir gommant", prix: "1 500 F", categorie: "Soins corps" },
        { texte: "Huile de baobab", prix: "4 000 F", categorie: "Soins visage" },
      ],
    },
  },
  {
    id: "alimentaire",
    couleurBadge: "#6B7B3A",
    label: "Produits du terroir",
    description: "Vendez vos produits locaux — céréales, jus, miel, confitures — à travers une vitrine claire.",
    icon: ShoppingBasket,
    type: "catalogue",
    libelleCatalogue: "Nos produits",
    libelleAction: "Commander",
    modesLivraison: ["retrait", "livraison"],
    demo: {
      nom: "Produits du terroir",
      accroche: "Céréales, miel et confitures 100% naturels du Sénégal",
      produits: [
        { texte: "Miel toutes fleurs 500ml", prix: "2 500 F", categorie: "Miels" },
        { texte: "Poudre de baobab 250g", prix: "1 200 F", categorie: "Céréales" },
        { texte: "Confiture de mangue", prix: "1 800 F", categorie: "Confitures" },
      ],
    },
  },
  {
    id: "artisanat",
    couleurBadge: "#E5820C",
    label: "Artisanat & Réparation",
    description: "Plus de 40 métiers : auto, BTP, couture, beauté, alimentation, bijouterie, art, technique...",
    icon: Settings2,
    type: "catalogue",
    libelleCatalogue: "Nos prestations",
    libelleAction: "Demander un devis",
    modesLivraison: ["retrait", "livraison"],
    demo: {
      nom: "Atelier & Garage",
      accroche: "Diagnostic complet et réparation, sur rendez-vous WhatsApp",
      produits: [
        { texte: "Diagnostic complet", prix: "5 000 F", categorie: "Diagnostic" },
        { texte: "Vidange + filtre", prix: "15 000 F", categorie: "Entretien" },
        { texte: "Freinage avant", prix: "25 000 F", categorie: "Réparation" },
      ],
    },
  },
  {
    id: "mode",
    couleurBadge: "#9F1239",
    label: "Boutique de mode",
    description: "Présentez votre collection de vêtements et accessoires, et recevez vos commandes directement sur WhatsApp.",
    icon: Shirt,
    type: "catalogue",
    libelleCatalogue: "Notre collection",
    libelleAction: "Commander",
    modesLivraison: ["retrait", "livraison"],
    demo: {
      nom: "Boutique Élégance",
      accroche: "Des tenues tendance et des accessoires soigneusement sélectionnés pour vous",
      produits: [
        { texte: "Robe wax imprimée", prix: "18 000 F", categorie: "Robes" },
        { texte: "Ensemble tailleur", prix: "25 000 F", categorie: "Ensembles" },
        { texte: "Sac à main cuir", prix: "12 000 F", categorie: "Accessoires" },
        { texte: "Baskets tendance", prix: "15 000 F", categorie: "Chaussures" },
      ],
    },
  },
  {
    id: "immobilier",
    couleurBadge: "#2563EB",
    label: "Agence immobilière",
    description: "Présentez vos biens disponibles et générez des demandes de visite qualifiées.",
    icon: Home,
    type: "catalogue",
    libelleCatalogue: "Nos biens disponibles",
    libelleAction: "Demander une visite",
    modesLivraison: [],
    demo: {
      nom: "Agence immobilière",
      accroche: "Trouvez le bien qui vous correspond, à Dakar et environs",
      produits: [
        { texte: "Appartement 3 pièces — Almadies", prix: "450 000 F / mois", categorie: "Location" },
        { texte: "Villa duplex — Sacré-Cœur", prix: "85 000 000 F", categorie: "Vente" },
        { texte: "Studio meublé — Plateau", prix: "250 000 F / mois", categorie: "Location" },
      ],
    },
  },
  {
    id: "ecole",
    couleurBadge: "#0EA5A0",
    label: "École & Formation",
    description: "Présentez vos programmes et facilitez les demandes d'inscription.",
    icon: GraduationCap,
    type: "catalogue",
    libelleCatalogue: "Nos programmes",
    libelleAction: "S'inscrire",
    modesLivraison: [],
    demo: {
      nom: "Institut de formation",
      accroche: "Des formations professionnalisantes pour réussir votre carrière",
      produits: [
        { texte: "Formation en comptabilité", prix: "150 000 F", categorie: "Certifiante" },
        { texte: "Initiation à l'informatique", prix: "75 000 F", categorie: "Courte durée" },
        { texte: "Anglais des affaires", prix: "100 000 F", categorie: "Langues" },
      ],
    },
  },
  {
    id: "hotel",
    couleurBadge: "#1E3F8C",
    label: "Hôtel & Hébergement",
    description: "Présentez vos chambres et recevez des demandes de réservation.",
    icon: BedDouble,
    type: "catalogue",
    libelleCatalogue: "Nos chambres",
    libelleAction: "Réserver",
    modesLivraison: [],
    demo: {
      nom: "Hôtel du Baobab",
      accroche: "Un séjour confortable au cœur de la ville",
      produits: [
        { texte: "Chambre Standard", prix: "35 000 F / nuit", categorie: "Standard" },
        { texte: "Suite Junior", prix: "65 000 F / nuit", categorie: "Suite" },
        { texte: "Chambre Familiale", prix: "50 000 F / nuit", categorie: "Famille" },
      ],
    },
  },
  {
    id: "medical",
    couleurBadge: "#14A89C",
    label: "Cabinet médical & Santé",
    description: "Présentez vos spécialités et facilitez la prise de rendez-vous.",
    icon: Stethoscope,
    type: "catalogue",
    libelleCatalogue: "Nos spécialités",
    libelleAction: "Prendre rendez-vous",
    modesLivraison: [],
    demo: {
      nom: "Cabinet médical",
      accroche: "Une prise en charge attentive, proche de chez vous",
      produits: [
        { texte: "Consultation générale", prix: "15 000 F", categorie: "Généraliste" },
        { texte: "Consultation pédiatrique", prix: "18 000 F", categorie: "Pédiatrie" },
        { texte: "Bilan de santé complet", prix: "45 000 F", categorie: "Bilan" },
      ],
    },
  },
  {
    id: "service",
    couleurBadge: "#7C3AED",
    label: "Présentation de service",
    description: "Une page simple pour présenter votre activité et vos prestations, sans catalogue de produits.",
    icon: User,
    type: "service",
    libelleCatalogue: "Nos prestations",
    libelleAction: "Me contacter",
    modesLivraison: [],
    demo: {
      nom: "Cabinet de conseil",
      accroche: "Un accompagnement sur mesure, à Dakar et partout au Sénégal",
      produits: [
        { texte: "Consultation initiale", prix: "", categorie: "" },
        { texte: "Accompagnement mensuel", prix: "", categorie: "" },
        { texte: "Formation en atelier", prix: "", categorie: "" },
      ],
    },
  },
];

// Métiers de l'artisanat, regroupés par domaine — adapté au contexte sénégalais.
// Sélectionné à l'étape 1 uniquement pour le secteur "Artisanat & Réparation".
export const METIERS_ARTISANAT = [
  {
    nom: "Auto & Réparation", icon: Car, paletteSecteur: "artisanat",
    metiers: [
      { nom: "Garage / Mécanique", icon: Wrench, demo: { nom: "Garage Diop", accroche: "Diagnostic et réparation toutes marques, sur rendez-vous WhatsApp", produits: [{ texte: "Vidange complète", prix: "15 000 F", categorie: "Entretien" }, { texte: "Diagnostic électronique", prix: "10 000 F", categorie: "Diagnostic" }, { texte: "Freinage avant/arrière", prix: "25 000 F", categorie: "Réparation" }] } },
      { nom: "Carrosserie", icon: Car, demo: { nom: "Carrosserie Sénégal", accroche: "Réparation et peinture carrosserie, devis gratuit", produits: [{ texte: "Débosselage", prix: "20 000 F", categorie: "Réparation" }, { texte: "Peinture complète", prix: "150 000 F", categorie: "Peinture" }, { texte: "Redressage châssis", prix: "80 000 F", categorie: "Réparation" }] } },
      { nom: "Pneus / Vulcanisation", icon: CircleDot, demo: { nom: "Vulcanisation Express", accroche: "Pneus, réparation crevaison et équilibrage rapide", produits: [{ texte: "Réparation crevaison", prix: "2 000 F", categorie: "Réparation" }, { texte: "Montage pneu", prix: "3 000 F", categorie: "Service" }, { texte: "Équilibrage", prix: "5 000 F", categorie: "Service" }] } },
      { nom: "Électricité automobile", icon: Zap, demo: { nom: "Auto Élec Pro", accroche: "Diagnostic et réparation électrique automobile", produits: [{ texte: "Diagnostic panne électrique", prix: "10 000 F", categorie: "Diagnostic" }, { texte: "Changement batterie", prix: "25 000 F", categorie: "Réparation" }, { texte: "Réparation alternateur", prix: "35 000 F", categorie: "Réparation" }] } },
      { nom: "Lavage automobile", icon: Droplets, demo: { nom: "Lavage Auto Deluxe", accroche: "Lavage intérieur et extérieur, sur place ou à domicile", produits: [{ texte: "Lavage extérieur", prix: "2 000 F", categorie: "Lavage" }, { texte: "Lavage complet int./ext.", prix: "5 000 F", categorie: "Lavage" }, { texte: "Lustrage carrosserie", prix: "10 000 F", categorie: "Esthétique" }] } },
    ],
  },
  {
    nom: "Maison & Construction", icon: Home, paletteSecteur: "artisanat",
    metiers: [
      { nom: "Maçonnerie", icon: Hammer, demo: { nom: "Bâti Sénégal", accroche: "Construction et rénovation, devis gratuit sur chantier", produits: [{ texte: "Construction mur", prix: "Sur devis", categorie: "Gros œuvre" }, { texte: "Rénovation façade", prix: "Sur devis", categorie: "Rénovation" }, { texte: "Dallage", prix: "Sur devis", categorie: "Gros œuvre" }] } },
      { nom: "Menuiserie bois", icon: Ruler, demo: { nom: "Menuiserie Bois d'Or", accroche: "Meubles et menuiserie bois sur mesure", produits: [{ texte: "Porte en bois massif", prix: "45 000 F", categorie: "Menuiserie" }, { texte: "Placard sur mesure", prix: "Sur devis", categorie: "Menuiserie" }, { texte: "Table en bois", prix: "60 000 F", categorie: "Mobilier" }] } },
      { nom: "Menuiserie aluminium", icon: Layers, demo: { nom: "Alu Design", accroche: "Fenêtres, portes et vérandas en aluminium sur mesure", produits: [{ texte: "Fenêtre aluminium", prix: "Sur devis", categorie: "Menuiserie" }, { texte: "Porte coulissante", prix: "Sur devis", categorie: "Menuiserie" }, { texte: "Véranda", prix: "Sur devis", categorie: "Aménagement" }] } },
      { nom: "Ferronnerie", icon: Wrench, demo: { nom: "Fer Forgé Sénégal", accroche: "Portails, grilles et ferronnerie sur mesure", produits: [{ texte: "Portail en fer", prix: "Sur devis", categorie: "Ferronnerie" }, { texte: "Grille de protection", prix: "Sur devis", categorie: "Sécurité" }, { texte: "Rampe d'escalier", prix: "Sur devis", categorie: "Ferronnerie" }] } },
      { nom: "Plomberie", icon: Droplet, demo: { nom: "Plomberie Rapide", accroche: "Dépannage et installation plomberie, intervention rapide", produits: [{ texte: "Dépannage fuite", prix: "10 000 F", categorie: "Dépannage" }, { texte: "Installation sanitaire", prix: "Sur devis", categorie: "Installation" }, { texte: "Débouchage canalisation", prix: "7 500 F", categorie: "Dépannage" }] } },
      { nom: "Électricité", icon: Zap, demo: { nom: "Élec Habitat", accroche: "Installation et dépannage électrique, aux normes", produits: [{ texte: "Dépannage panne", prix: "10 000 F", categorie: "Dépannage" }, { texte: "Installation tableau électrique", prix: "Sur devis", categorie: "Installation" }, { texte: "Mise aux normes", prix: "Sur devis", categorie: "Sécurité" }] } },
      { nom: "Peinture", icon: Paintbrush, demo: { nom: "Peinture Déco Pro", accroche: "Peinture intérieure et extérieure, finitions soignées", produits: [{ texte: "Peinture pièce", prix: "Sur devis", categorie: "Peinture" }, { texte: "Peinture façade", prix: "Sur devis", categorie: "Peinture" }, { texte: "Enduit décoratif", prix: "Sur devis", categorie: "Décoration" }] } },
      { nom: "Carrelage", icon: Grid3x3, demo: { nom: "Carrelage Sénégal", accroche: "Pose de carrelage, salles de bain et sols", produits: [{ texte: "Pose carrelage sol", prix: "Sur devis", categorie: "Pose" }, { texte: "Pose faïence salle de bain", prix: "Sur devis", categorie: "Pose" }, { texte: "Rénovation joints", prix: "Sur devis", categorie: "Entretien" }] } },
      { nom: "Vitrerie", icon: Square, demo: { nom: "Vitrerie Express", accroche: "Remplacement et installation de vitres, intervention rapide", produits: [{ texte: "Remplacement vitre", prix: "Sur devis", categorie: "Réparation" }, { texte: "Pose miroir", prix: "Sur devis", categorie: "Installation" }, { texte: "Vitrage double", prix: "Sur devis", categorie: "Installation" }] } },
      { nom: "Froid & Climatisation", icon: Snowflake, demo: { nom: "Clim Confort", accroche: "Installation, entretien et dépannage climatisation", produits: [{ texte: "Entretien climatiseur", prix: "10 000 F", categorie: "Entretien" }, { texte: "Installation climatiseur", prix: "Sur devis", categorie: "Installation" }, { texte: "Recharge gaz", prix: "15 000 F", categorie: "Dépannage" }] } },
      { nom: "Décoration", icon: Flower2, demo: { nom: "Déco Intérieur Plus", accroche: "Décoration d'intérieur, conseils et réalisation", produits: [{ texte: "Conseil déco", prix: "Sur devis", categorie: "Conseil" }, { texte: "Aménagement salon", prix: "Sur devis", categorie: "Décoration" }, { texte: "Pose papier peint", prix: "Sur devis", categorie: "Décoration" }] } },
    ],
  },
  {
    nom: "Mode & Textile", icon: Shirt, paletteSecteur: "cosmetique",
    metiers: [
      { nom: "Couture", icon: Scissors, demo: { nom: "Atelier Couture Fatou", accroche: "Création de vêtements sur mesure, tissus au choix", produits: [{ texte: "Robe sur mesure", prix: "15 000 F", categorie: "Couture" }, { texte: "Ensemble homme", prix: "20 000 F", categorie: "Couture" }, { texte: "Retouche express", prix: "3 000 F", categorie: "Retouche" }] } },
      { nom: "Confection", icon: Shirt, demo: { nom: "Confection Mode", accroche: "Confection de vêtements en petite et grande série", produits: [{ texte: "Chemise sur mesure", prix: "10 000 F", categorie: "Confection" }, { texte: "Uniforme scolaire", prix: "8 000 F", categorie: "Confection" }, { texte: "Commande en série", prix: "Sur devis", categorie: "Confection" }] } },
      { nom: "Retouche", icon: Scissors, demo: { nom: "Retouche Express", accroche: "Retouches et ajustements rapides, toutes tenues", produits: [{ texte: "Ourlet", prix: "1 500 F", categorie: "Retouche" }, { texte: "Ajustement taille", prix: "2 500 F", categorie: "Retouche" }, { texte: "Réparation fermeture éclair", prix: "2 000 F", categorie: "Retouche" }] } },
      { nom: "Broderie", icon: Sparkles, demo: { nom: "Broderie d'Art", accroche: "Broderie personnalisée pour tenues et accessoires", produits: [{ texte: "Broderie boubou", prix: "10 000 F", categorie: "Broderie" }, { texte: "Personnalisation logo", prix: "5 000 F", categorie: "Broderie" }, { texte: "Broderie nappe", prix: "7 000 F", categorie: "Broderie" }] } },
      { nom: "Teinture", icon: Droplet, demo: { nom: "Teinture Wax", accroche: "Teinture artisanale de tissus, motifs sur demande", produits: [{ texte: "Teinture tissu 6 yards", prix: "5 000 F", categorie: "Teinture" }, { texte: "Motif personnalisé", prix: "8 000 F", categorie: "Teinture" }, { texte: "Teinture batik", prix: "6 000 F", categorie: "Teinture" }] } },
      { nom: "Tissage", icon: Grid3x3, demo: { nom: "Tissage Traditionnel", accroche: "Tissage artisanal de pagnes et tissus traditionnels", produits: [{ texte: "Pagne tissé", prix: "12 000 F", categorie: "Tissage" }, { texte: "Tissu traditionnel 6 yards", prix: "20 000 F", categorie: "Tissage" }, { texte: "Commande personnalisée", prix: "Sur devis", categorie: "Tissage" }] } },
    ],
  },
  {
    nom: "Beauté & Bien-être", icon: Sparkles, paletteSecteur: "cosmetique",
    metiers: [
      { nom: "Coiffure", icon: Scissors, demo: { nom: "Salon Aïda Coiffure", accroche: "Coiffure femme et homme, sur rendez-vous", produits: [{ texte: "Coupe + brushing", prix: "5 000 F", categorie: "Coiffure" }, { texte: "Défrisage", prix: "8 000 F", categorie: "Coiffure" }, { texte: "Coiffure mariage", prix: "25 000 F", categorie: "Événement" }] } },
      { nom: "Barber", icon: User, demo: { nom: "Barber Shop Dakar", accroche: "Coupe homme et taille de barbe, style soigné", produits: [{ texte: "Coupe homme", prix: "2 500 F", categorie: "Coiffure" }, { texte: "Taille de barbe", prix: "1 500 F", categorie: "Rasage" }, { texte: "Coupe + barbe", prix: "3 500 F", categorie: "Formule" }] } },
      { nom: "Tresses", icon: Sparkles, demo: { nom: "Tresses & Nattes", accroche: "Tresses africaines et nattes, tous styles", produits: [{ texte: "Nattes collées", prix: "5 000 F", categorie: "Tresses" }, { texte: "Vanilles", prix: "7 000 F", categorie: "Tresses" }, { texte: "Tresses avec mèches", prix: "10 000 F", categorie: "Tresses" }] } },
      { nom: "Esthétique", icon: Flower2, demo: { nom: "Institut Beauté", accroche: "Soins esthétiques visage et corps", produits: [{ texte: "Soin du visage", prix: "10 000 F", categorie: "Soins" }, { texte: "Épilation", prix: "5 000 F", categorie: "Soins" }, { texte: "Maquillage", prix: "15 000 F", categorie: "Maquillage" }] } },
      { nom: "Onglerie", icon: Hand, demo: { nom: "Ongles & Style", accroche: "Manucure, pose d'ongles et nail art", produits: [{ texte: "Manucure simple", prix: "3 000 F", categorie: "Manucure" }, { texte: "Pose gel", prix: "8 000 F", categorie: "Pose" }, { texte: "Nail art", prix: "5 000 F", categorie: "Décoration" }] } },
      { nom: "Soins & Massage", icon: Heart, demo: { nom: "Détente Spa", accroche: "Massages et soins relaxants, sur rendez-vous", produits: [{ texte: "Massage relaxant 1h", prix: "15 000 F", categorie: "Massage" }, { texte: "Gommage corps", prix: "10 000 F", categorie: "Soins" }, { texte: "Massage duo", prix: "25 000 F", categorie: "Massage" }] } },
      { nom: "Savonnerie / Cosmétique", icon: Droplet, demo: { nom: "Savonnerie Naturelle", accroche: "Savons et cosmétiques naturels faits main", produits: [{ texte: "Savon noir", prix: "1 500 F", categorie: "Savonnerie" }, { texte: "Savon au beurre de karité", prix: "2 000 F", categorie: "Savonnerie" }, { texte: "Huile capillaire naturelle", prix: "3 000 F", categorie: "Cosmétique" }] } },
    ],
  },
  {
    nom: "Alimentation & Transformation", icon: Wheat, paletteSecteur: "alimentaire",
    metiers: [
      { nom: "Boulangerie", icon: Wheat, demo: { nom: "Boulangerie du Quartier", accroche: "Pain frais tous les jours, cuisson artisanale", produits: [{ texte: "Pain complet", prix: "300 F", categorie: "Pain" }, { texte: "Baguette", prix: "250 F", categorie: "Pain" }, { texte: "Pain spécial", prix: "500 F", categorie: "Pain" }] } },
      { nom: "Pâtisserie", icon: Star, demo: { nom: "Pâtisserie Douceur", accroche: "Gâteaux et pâtisseries sur commande", produits: [{ texte: "Gâteau anniversaire", prix: "15 000 F", categorie: "Gâteau" }, { texte: "Cupcakes (x6)", prix: "6 000 F", categorie: "Pâtisserie" }, { texte: "Tarte", prix: "8 000 F", categorie: "Pâtisserie" }] } },
      { nom: "Traiteur", icon: Utensils, demo: { nom: "Traiteur Saveurs", accroche: "Traiteur pour événements, menus sur mesure", produits: [{ texte: "Menu événementiel", prix: "Sur devis", categorie: "Traiteur" }, { texte: "Plateau repas", prix: "3 500 F", categorie: "Traiteur" }, { texte: "Buffet", prix: "Sur devis", categorie: "Événement" }] } },
      { nom: "Transformation alimentaire", icon: Package, demo: { nom: "Transfo Alimentaire Sénégal", accroche: "Transformation de produits locaux, qualité artisanale", produits: [{ texte: "Farine de mil", prix: "2 000 F", categorie: "Transformation" }, { texte: "Jus de bissap", prix: "1 000 F", categorie: "Boisson" }, { texte: "Confiture artisanale", prix: "2 500 F", categorie: "Transformation" }] } },
      { nom: "Produits locaux", icon: Leaf, demo: { nom: "Terroir Local", accroche: "Produits locaux authentiques, du producteur au client", produits: [{ texte: "Miel local", prix: "3 000 F", categorie: "Produits locaux" }, { texte: "Riz local", prix: "Sur devis", categorie: "Céréales" }, { texte: "Huile artisanale", prix: "2 500 F", categorie: "Produits locaux" }] } },
    ],
  },
  {
    nom: "Bijoux, Cuir & Accessoires", icon: Gem, paletteSecteur: "cosmetique",
    metiers: [
      { nom: "Bijouterie / Joaillerie", icon: Gem, demo: { nom: "Bijouterie Éclat", accroche: "Bijoux en or et argent, création et réparation", produits: [{ texte: "Bague en argent", prix: "15 000 F", categorie: "Bijou" }, { texte: "Collier en or", prix: "Sur devis", categorie: "Bijou" }, { texte: "Réparation bijou", prix: "5 000 F", categorie: "Réparation" }] } },
      { nom: "Maroquinerie", icon: ShoppingBag, demo: { nom: "Maroquinerie Sénégal", accroche: "Sacs et articles en cuir faits main", produits: [{ texte: "Sac en cuir", prix: "25 000 F", categorie: "Sac" }, { texte: "Portefeuille", prix: "8 000 F", categorie: "Accessoire" }, { texte: "Ceinture en cuir", prix: "6 000 F", categorie: "Accessoire" }] } },
      { nom: "Cordonnerie", icon: Wrench, demo: { nom: "Cordonnerie Express", accroche: "Réparation et entretien de chaussures", produits: [{ texte: "Réparation semelle", prix: "2 500 F", categorie: "Réparation" }, { texte: "Cirage / entretien", prix: "1 000 F", categorie: "Entretien" }, { texte: "Changement talon", prix: "2 000 F", categorie: "Réparation" }] } },
      { nom: "Chaussures", icon: Footprints, demo: { nom: "Chaussures Sur Mesure", accroche: "Chaussures en cuir faites main, sur mesure", produits: [{ texte: "Chaussures homme sur mesure", prix: "20 000 F", categorie: "Chaussures" }, { texte: "Sandales cuir", prix: "12 000 F", categorie: "Chaussures" }, { texte: "Réparation", prix: "3 000 F", categorie: "Réparation" }] } },
      { nom: "Sacs & accessoires", icon: ShoppingBag, demo: { nom: "Sacs & Accessoires Déco", accroche: "Sacs et accessoires de mode faits main", produits: [{ texte: "Sac à main", prix: "15 000 F", categorie: "Sac" }, { texte: "Pochette", prix: "6 000 F", categorie: "Accessoire" }, { texte: "Porte-monnaie", prix: "4 000 F", categorie: "Accessoire" }] } },
    ],
  },
  {
    nom: "Art & Création", icon: PaletteIcon, paletteSecteur: "alimentaire",
    metiers: [
      { nom: "Sculpture", icon: Hammer, demo: { nom: "Atelier Sculpture", accroche: "Sculptures artisanales en bois et pierre", produits: [{ texte: "Sculpture bois", prix: "20 000 F", categorie: "Sculpture" }, { texte: "Statuette", prix: "10 000 F", categorie: "Sculpture" }, { texte: "Commande personnalisée", prix: "Sur devis", categorie: "Sculpture" }] } },
      { nom: "Poterie / Céramique", icon: Package, demo: { nom: "Poterie Traditionnelle", accroche: "Poteries et céramiques artisanales", produits: [{ texte: "Pot en terre cuite", prix: "5 000 F", categorie: "Poterie" }, { texte: "Vase décoratif", prix: "8 000 F", categorie: "Poterie" }, { texte: "Service à thé", prix: "15 000 F", categorie: "Céramique" }] } },
      { nom: "Vannerie / Tressage", icon: Grid3x3, demo: { nom: "Vannerie d'Afrique", accroche: "Paniers et objets en vannerie tressés main", produits: [{ texte: "Panier tressé", prix: "4 000 F", categorie: "Vannerie" }, { texte: "Corbeille", prix: "3 000 F", categorie: "Vannerie" }, { texte: "Chapeau tressé", prix: "5 000 F", categorie: "Vannerie" }] } },
      { nom: "Artisanat traditionnel", icon: Star, demo: { nom: "Artisanat du Sénégal", accroche: "Objets artisanaux traditionnels, savoir-faire local", produits: [{ texte: "Masque décoratif", prix: "10 000 F", categorie: "Artisanat" }, { texte: "Statuette traditionnelle", prix: "8 000 F", categorie: "Artisanat" }, { texte: "Objet en calebasse", prix: "5 000 F", categorie: "Artisanat" }] } },
      { nom: "Instruments de musique", icon: Music2, demo: { nom: "Instruments d'Afrique", accroche: "Fabrication d'instruments de musique traditionnels", produits: [{ texte: "Djembé", prix: "30 000 F", categorie: "Instrument" }, { texte: "Kora", prix: "Sur devis", categorie: "Instrument" }, { texte: "Balafon", prix: "Sur devis", categorie: "Instrument" }] } },
      { nom: "Décoration / Objets d'art", icon: Flower2, demo: { nom: "Objets d'Art Déco", accroche: "Objets décoratifs et œuvres d'art artisanales", produits: [{ texte: "Tableau décoratif", prix: "15 000 F", categorie: "Décoration" }, { texte: "Objet en bois sculpté", prix: "10 000 F", categorie: "Décoration" }, { texte: "Pièce unique", prix: "Sur devis", categorie: "Art" }] } },
    ],
  },
  {
    nom: "Technique & Services", icon: Cpu, paletteSecteur: "service",
    metiers: [
      { nom: "Électronique", icon: Cpu, demo: { nom: "Électronique Service", accroche: "Réparation d'appareils électroniques", produits: [{ texte: "Réparation appareil", prix: "Sur devis", categorie: "Réparation" }, { texte: "Installation équipement", prix: "Sur devis", categorie: "Installation" }, { texte: "Diagnostic panne", prix: "3 000 F", categorie: "Diagnostic" }] } },
      { nom: "Réparation informatique / Téléphones", icon: Smartphone, demo: { nom: "Tech Repair", accroche: "Réparation ordinateurs et téléphones, rapide et fiable", produits: [{ texte: "Changement écran téléphone", prix: "15 000 F", categorie: "Réparation" }, { texte: "Réparation ordinateur", prix: "Sur devis", categorie: "Réparation" }, { texte: "Récupération données", prix: "10 000 F", categorie: "Service" }] } },
      { nom: "Électroménager", icon: Settings, demo: { nom: "Électroménager Plus", accroche: "Réparation et entretien d'électroménager", produits: [{ texte: "Réparation réfrigérateur", prix: "Sur devis", categorie: "Réparation" }, { texte: "Réparation machine à laver", prix: "Sur devis", categorie: "Réparation" }, { texte: "Entretien climatiseur", prix: "10 000 F", categorie: "Entretien" }] } },
      { nom: "Photographie / Vidéo", icon: Image, demo: { nom: "Studio Photo Pro", accroche: "Photographie et vidéo pour tous vos événements", produits: [{ texte: "Séance photo", prix: "25 000 F", categorie: "Photographie" }, { texte: "Couverture vidéo événement", prix: "Sur devis", categorie: "Vidéo" }, { texte: "Photo studio", prix: "10 000 F", categorie: "Photographie" }] } },
      { nom: "Impression", icon: Printer, demo: { nom: "Impression Rapide", accroche: "Impression et reprographie, tous formats", produits: [{ texte: "Impression document", prix: "100 F", categorie: "Impression" }, { texte: "Carte de visite (x100)", prix: "5 000 F", categorie: "Impression" }, { texte: "Impression grand format", prix: "Sur devis", categorie: "Impression" }] } },
      { nom: "Nettoyage / Pressing", icon: Sparkles, demo: { nom: "Pressing Propre", accroche: "Nettoyage et pressing de vêtements", produits: [{ texte: "Pressing costume", prix: "3 000 F", categorie: "Pressing" }, { texte: "Nettoyage tapis", prix: "Sur devis", categorie: "Nettoyage" }, { texte: "Repassage", prix: "1 000 F", categorie: "Service" }] } },
      { nom: "Services techniques", icon: Wrench, demo: { nom: "Services Techniques Pro", accroche: "Interventions techniques diverses, rapides et fiables", produits: [{ texte: "Intervention technique", prix: "Sur devis", categorie: "Service" }, { texte: "Maintenance", prix: "Sur devis", categorie: "Maintenance" }, { texte: "Dépannage", prix: "Sur devis", categorie: "Dépannage" }] } },
    ],
  },
];

export function trouverMetier(nomMetier) {
  for (const groupe of METIERS_ARTISANAT) {
    const trouve = groupe.metiers.find((m) => m.nom === nomMetier);
    if (trouve) return { ...trouve, paletteSecteur: groupe.paletteSecteur };
  }
  return null;
}

export function trouverIconeMetier(nomMetier) {
  const m = trouverMetier(nomMetier);
  return m ? m.icon : Hammer;
}

// Détermine quelle palette de couleurs (SECTEUR_COULEURS) utiliser : celle du groupe de
// métier choisi pour l'artisanat (plus cohérente), sinon celle du secteur lui-même.
export function paletteIdPour(secteur, business) {
  if (secteur?.id === "artisanat" && business?.metierGroupe) {
    const groupe = METIERS_ARTISANAT.find((g) => g.nom === business.metierGroupe);
    if (groupe) return groupe.paletteSecteur;
  }
  return secteur?.id || "service";
}

// Modes de retrait/livraison proposés selon le secteur — l'utilisateur choisit lesquels activer.
export const MODES_LIVRAISON = {
  sur_place: { label: "Sur place", icon: UtensilsCrossed },
  emporter: { label: "À emporter", icon: Store },
  retrait: { label: "À récupérer en boutique", icon: Store },
  livraison: { label: "Livraison", icon: Truck },
};

// Horaires d'ouverture — un jour par ligne, avec un texte lisible pour l'affichage.
export const JOURS_SEMAINE = [
  { id: "lundi", label: "Lundi" },
  { id: "mardi", label: "Mardi" },
  { id: "mercredi", label: "Mercredi" },
  { id: "jeudi", label: "Jeudi" },
  { id: "vendredi", label: "Vendredi" },
  { id: "samedi", label: "Samedi" },
  { id: "dimanche", label: "Dimanche" },
];

export function horairesParDefaut() {
  const jour = { ouvert: true, debut: "08:00", fin: "18:00" };
  return {
    lundi: { ...jour }, mardi: { ...jour }, mercredi: { ...jour }, jeudi: { ...jour },
    vendredi: { ...jour }, samedi: { ...jour }, dimanche: { ouvert: false, debut: "", fin: "" },
  };
}

// Regroupe les jours consécutifs ayant les mêmes horaires pour un affichage
// compact (ex. "Lundi - Vendredi : 08:00 - 18:00" plutôt que 5 lignes identiques).
export function formaterHoraires(horaires) {
  if (!horaires) return [];
  const lignes = JOURS_SEMAINE.map((j) => {
    const h = horaires[j.id];
    const texte = h && h.ouvert && h.debut && h.fin ? `${h.debut} - ${h.fin}` : "Fermé";
    return { jour: j.label, texte };
  });
  const groupes = [];
  for (const ligne of lignes) {
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.texte === ligne.texte) {
      dernier.jourFin = ligne.jour;
    } else {
      groupes.push({ jourDebut: ligne.jour, jourFin: ligne.jour, texte: ligne.texte });
    }
  }
  return groupes.map((g) => ({
    label: g.jourDebut === g.jourFin ? g.jourDebut : `${g.jourDebut} - ${g.jourFin}`,
    texte: g.texte,
  }));
}

// Réseaux sociaux proposés — n'apparaissent sur le site que si un lien est renseigné.
export const RESEAUX_SOCIAUX = [
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Music2 },
  { id: "twitter", label: "X / Twitter", icon: Twitter },
];

// Couleurs distinctes et curatées pour chaque secteur, choisies pour leur pertinence
// marketing (associations d'usage réelles par type d'activité) — pas la même liste recyclée.
export const SECTEUR_COULEURS = {
  restaurant: [
    { id: "tomate", name: "Rouge Tomate", hex: "#C0392B" },
    { id: "epice", name: "Orange Épicé", hex: "#D35400" },
    { id: "curry", name: "Jaune Curry", hex: "#D4A017" },
    { id: "four", name: "Brique Four à Bois", hex: "#8B4A2B" },
    { id: "basilic", name: "Vert Basilic", hex: "#4C7A3D" },
    { id: "bordeaux", name: "Bordeaux", hex: "#6B1E2B" },
    { id: "painocre", name: "Ocre Pain", hex: "#B8860B" },
    { id: "cafe", name: "Marron Café", hex: "#5C3A21" },
    { id: "piment", name: "Piment Rouge", hex: "#E74C3C" },
    { id: "safran", name: "Safran", hex: "#E1AD01" },
    { id: "caramel", name: "Caramel", hex: "#A9642A" },
    { id: "chocolat", name: "Chocolat", hex: "#4A2C2A" },
    { id: "miel", name: "Miel", hex: "#D9A441" },
    { id: "poivronvert", name: "Poivron Vert", hex: "#588157" },
    { id: "aubergine", name: "Aubergine", hex: "#4B2E39" },
    { id: "cannelle", name: "Cannelle", hex: "#9C6B30" },
    { id: "grenadine", name: "Grenadine", hex: "#C0264B" },
    { id: "citronvert", name: "Citron Vert", hex: "#A8C256" },
    { id: "mangue", name: "Mangue", hex: "#E8971B" },
    { id: "vinrouge", name: "Vin Rouge", hex: "#5E1B2E" },
    { id: "beurre", name: "Beurre", hex: "#E8C468" },
    { id: "cerise", name: "Cerise", hex: "#9C1F35" },
    { id: "peche", name: "Pêche", hex: "#E8A87C" },
    { id: "thym", name: "Thym", hex: "#6B7A4F" },
    { id: "muscade", name: "Muscade", hex: "#8B5A2B" },
  ],
  cosmetique: [
    { id: "rosepoudre", name: "Rose Poudré", hex: "#C98A9E" },
    { id: "coraildoux", name: "Corail Doux", hex: "#E8917B" },
    { id: "sauge", name: "Vert Sauge", hex: "#8BA888" },
    { id: "lavande", name: "Lavande", hex: "#9B8AC4" },
    { id: "orrose", name: "Or Rosé", hex: "#C9A66B" },
    { id: "terracotta", name: "Terracotta", hex: "#C6714A" },
    { id: "nude", name: "Beige Nude", hex: "#C4A484" },
    { id: "prune", name: "Prune", hex: "#7A4A5C" },
    { id: "rosecendre", name: "Rose Cendré", hex: "#D4A5A5" },
    { id: "blush", name: "Blush", hex: "#E8C4C4" },
    { id: "camelia", name: "Camélia", hex: "#D8A7B1" },
    { id: "eucalyptus", name: "Vert Eucalyptus", hex: "#7A9B76" },
    { id: "mentedouce", name: "Vert Menthe Doux", hex: "#A8D5BA" },
    { id: "beigesable", name: "Beige Sable", hex: "#D9C5A0" },
    { id: "champagne", name: "Champagne", hex: "#E8D9B5" },
    { id: "orpale", name: "Or Pâle", hex: "#D4B96A" },
    { id: "lilas", name: "Lilas", hex: "#C3A6D9" },
    { id: "mauve", name: "Mauve", hex: "#B497BD" },
    { id: "bleupoudre", name: "Bleu Poudré", hex: "#A8C4D4" },
    { id: "jadedoux", name: "Jade Doux", hex: "#8FBFA3" },
    { id: "coquilleoeuf", name: "Coquille d'Œuf", hex: "#E8DFC8" },
    { id: "cuivrerose", name: "Cuivre Rosé", hex: "#C88B7A" },
    { id: "argile", name: "Argile", hex: "#B08968" },
    { id: "perlegrise", name: "Perle Grise", hex: "#C7C2B8" },
    { id: "violetpoudre", name: "Violet Poudré", hex: "#B8A0C4" },
  ],
  alimentaire: [
    { id: "olive", name: "Vert Olive", hex: "#6B7B3A" },
    { id: "mieldore", name: "Miel Doré", hex: "#C99A3A" },
    { id: "terrecuite", name: "Terre Cuite", hex: "#B4622E" },
    { id: "browncafe", name: "Brun Café", hex: "#6F4E37" },
    { id: "ble", name: "Jaune Blé", hex: "#D9A441" },
    { id: "foret", name: "Vert Forêt", hex: "#3B5B3E" },
    { id: "sable", name: "Ocre Sable", hex: "#C2A66B" },
    { id: "baie", name: "Rouge Baie", hex: "#9E3B3B" },
    { id: "moussevert", name: "Vert Mousse", hex: "#5C6B3E" },
    { id: "argilerouge", name: "Argile Rouge", hex: "#A65E3E" },
    { id: "brunterre", name: "Brun Terre", hex: "#5A4632" },
    { id: "kaki", name: "Kaki", hex: "#7D7449" },
    { id: "vertsapin", name: "Vert Sapin", hex: "#2F4A3E" },
    { id: "ocrejaune", name: "Ocre Jaune", hex: "#C88A2E" },
    { id: "rouilledouce", name: "Rouille Douce", hex: "#B0632E" },
    { id: "beigelin", name: "Beige Lin", hex: "#D6C4A0" },
    { id: "bambou", name: "Vert Bambou", hex: "#6B8A4E" },
    { id: "noisette", name: "Marron Noisette", hex: "#7A5A3A" },
    { id: "dorechamp", name: "Doré Champ", hex: "#C9A227" },
    { id: "pistache", name: "Vert Pistache", hex: "#8FA05C" },
    { id: "cacao", name: "Brun Cacao", hex: "#5C3A28" },
    { id: "ombre", name: "Terre d'Ombre", hex: "#6B4E33" },
    { id: "cedre", name: "Vert Cèdre", hex: "#4A5E3E" },
    { id: "mielsombre", name: "Miel Sombre", hex: "#A9791F" },
    { id: "ecorce", name: "Écorce", hex: "#5E4A38" },
  ],
  mode: [
    { id: "bordeauxmode", name: "Bordeaux Mode", hex: "#7A1F3D" },
    { id: "noirelegant", name: "Noir Élégant", hex: "#1C1C1E" },
    { id: "ordefile", name: "Or Défilé", hex: "#C9A24A" },
    { id: "rosechic", name: "Rose Chic", hex: "#D46A8C" },
    { id: "camelmode", name: "Camel", hex: "#B08457" },
    { id: "bleunuitmode", name: "Bleu Nuit Mode", hex: "#1F2A4A" },
    { id: "terracottamode", name: "Terracotta Mode", hex: "#C05A3C" },
    { id: "blushmode", name: "Blush Poudré", hex: "#E3A9B0" },
    { id: "kakimode", name: "Kaki Tendance", hex: "#6E7455" },
    { id: "pruneprofond", name: "Prune Profond", hex: "#5A2A4D" },
    { id: "ivoiremode", name: "Ivoire Boutique", hex: "#E9E1D3" },
    { id: "safranwax", name: "Safran Wax", hex: "#E0A526" },
    { id: "emeraudemode", name: "Émeraude Mode", hex: "#1E6B54" },
    { id: "grisperlefashion", name: "Gris Perle Fashion", hex: "#B7B2AC" },
    { id: "rougecarmin", name: "Rouge Carmin", hex: "#B5233A" },
    { id: "moutarde", name: "Moutarde", hex: "#C9982E" },
    { id: "lilasmode", name: "Lilas Mode", hex: "#A98AC4" },
    { id: "cognac", name: "Cognac", hex: "#9C5A2E" },
    { id: "turquoisemode", name: "Turquoise Mode", hex: "#1E8FA0" },
    { id: "roseantique", name: "Rose Antique", hex: "#B77B87" },
    { id: "anthracitemode", name: "Anthracite Mode", hex: "#3A3D42" },
    { id: "corailmode", name: "Corail Mode", hex: "#E0745C" },
    { id: "vertolivemode", name: "Vert Olive Mode", hex: "#5C6B3E" },
    { id: "champagnemode", name: "Champagne Mode", hex: "#D9C9A0" },
    { id: "violetroyalmode", name: "Violet Royal Mode", hex: "#5B2C7A" },
  ],
  artisanat: [
    { id: "acier", name: "Bleu Acier", hex: "#3B6B8C" },
    { id: "ardoise", name: "Gris Ardoise", hex: "#495867" },
    { id: "securite", name: "Orange Sécurité", hex: "#D9622B" },
    { id: "marineart", name: "Marine", hex: "#1F3A5F" },
    { id: "rouille", name: "Rouille", hex: "#A1552C" },
    { id: "anthracite", name: "Anthracite", hex: "#384049" },
    { id: "cuivre", name: "Cuivre", hex: "#B5651D" },
    { id: "militaire", name: "Vert Militaire", hex: "#556B4F" },
    { id: "grisbeton", name: "Gris Béton", hex: "#7A7F87" },
    { id: "grisfer", name: "Gris Fer", hex: "#5A6470" },
    { id: "petrole", name: "Bleu Pétrole", hex: "#1E4E5F" },
    { id: "charbon", name: "Noir Charbon", hex: "#2B2E33" },
    { id: "bronze", name: "Bronze", hex: "#8C6A3F" },
    { id: "chantier", name: "Orange Chantier", hex: "#E0631E" },
    { id: "vertatelier", name: "Vert Atelier", hex: "#4E5D4A" },
    { id: "denim", name: "Bleu Denim", hex: "#3E5C76" },
    { id: "rougebrique", name: "Rouge Brique", hex: "#A34A3A" },
    { id: "griszinc", name: "Gris Zinc", hex: "#8A8F94" },
    { id: "marroncuir", name: "Marron Cuir", hex: "#6B4A32" },
    { id: "bleunuit", name: "Bleu Nuit", hex: "#22354A" },
    { id: "acierbrosse", name: "Acier Brossé", hex: "#6C7A80" },
    { id: "jaunesecurite", name: "Jaune Sécurité", hex: "#E0B123" },
    { id: "grisperle", name: "Gris Perle", hex: "#A9AEB4" },
    { id: "olivefonce", name: "Vert Olive Foncé", hex: "#4B5A34" },
    { id: "cuivrevieilli", name: "Cuivre Vieilli", hex: "#9C6B3E" },
  ],
  immobilier: [
    { id: "bleuarchitecte", name: "Bleu Architecte", hex: "#2C5171" },
    { id: "beigepierre", name: "Beige Pierre", hex: "#C9B79C" },
    { id: "grisbetonclair", name: "Gris Béton Clair", hex: "#A8ACA9" },
    { id: "orimmobilier", name: "Or Immobilier", hex: "#B8963E" },
    { id: "saugepro", name: "Vert Sauge Pro", hex: "#7A8B6F" },
    { id: "marineelegant", name: "Marine Élégant", hex: "#1E3A5F" },
    { id: "terracottafacade", name: "Terracotta Façade", hex: "#B2603E" },
    { id: "blanccasse", name: "Blanc Cassé", hex: "#E8E2D5" },
    { id: "boischene", name: "Bois Chêne", hex: "#8B6642" },
    { id: "bleunuitresidence", name: "Bleu Nuit Résidence", hex: "#22344A" },
    { id: "vertjardin", name: "Vert Jardin", hex: "#5C7A5C" },
    { id: "sabledore", name: "Sable Doré", hex: "#D4B98C" },
    { id: "anthracitetoit", name: "Anthracite Toit", hex: "#3A3D40" },
    { id: "bordeauxprestige", name: "Bordeaux Prestige", hex: "#6B2C3A" },
    { id: "bleupiscine", name: "Bleu Piscine", hex: "#3E7C99" },
    { id: "terrecuitedouce", name: "Terre Cuite Douce", hex: "#C77B52" },
    { id: "grisperleresidence", name: "Gris Perle Résidence", hex: "#B9BCB6" },
    { id: "vertolivier", name: "Vert Olivier", hex: "#6E7D4E" },
    { id: "cuivrebalcon", name: "Cuivre Balcon", hex: "#A5652E" },
    { id: "bleuardoisetoit", name: "Bleu Ardoise Toit", hex: "#4A5A6B" },
    { id: "ivoire", name: "Ivoire", hex: "#E5DFCF" },
    { id: "brunchaleureux", name: "Brun Chaleureux", hex: "#6B4E3A" },
    { id: "vertforetdomaine", name: "Vert Forêt Domaine", hex: "#34503D" },
    { id: "doorecle", name: "Doré Clé", hex: "#C9A24A" },
    { id: "bleucielvue", name: "Bleu Ciel Vue", hex: "#6B9BB5" },
  ],
  ecole: [
    { id: "bleutableau", name: "Bleu Tableau", hex: "#1F4E79" },
    { id: "rougecrayon", name: "Rouge Crayon", hex: "#C0392B" },
    { id: "jaunecraie", name: "Jaune Craie", hex: "#E1B325" },
    { id: "vertardoise", name: "Vert Ardoise", hex: "#3A6B4D" },
    { id: "orangecahier", name: "Orange Cahier", hex: "#D9782E" },
    { id: "bleucielecole", name: "Bleu Ciel École", hex: "#4A90C4" },
    { id: "violetcreatif", name: "Violet Créatif", hex: "#6B4E8E" },
    { id: "vertpomme", name: "Vert Pomme", hex: "#7FA83B" },
    { id: "rougebibliotheque", name: "Rouge Bibliothèque", hex: "#8B2E2E" },
    { id: "bleumarineuniforme", name: "Bleu Marine Uniforme", hex: "#1E3A5F" },
    { id: "jaunesoleil", name: "Jaune Soleil", hex: "#E8B830" },
    { id: "turquoisejeunesse", name: "Turquoise Jeunesse", hex: "#2E9B8E" },
    { id: "rosecreatif", name: "Rose Créatif", hex: "#C46B8A" },
    { id: "vertdiplome", name: "Vert Diplôme", hex: "#2E6B4A" },
    { id: "bleustylo", name: "Bleu Stylo", hex: "#3E5C99" },
    { id: "orangevif", name: "Orange Vif", hex: "#E06B2E" },
    { id: "grisardoiseecole", name: "Gris Ardoise École", hex: "#5A6470" },
    { id: "bordeauxacademique", name: "Bordeaux Académique", hex: "#6B2737" },
    { id: "vertmentheclasse", name: "Vert Menthe Classe", hex: "#5CA88A" },
    { id: "jauneorreussite", name: "Jaune Or Réussite", hex: "#C9A227" },
    { id: "bleuindigosavoir", name: "Bleu Indigo Savoir", hex: "#4338CA" },
    { id: "coraildmotivation", name: "Corail Motivation", hex: "#E0724A" },
    { id: "vertfoncesagesse", name: "Vert Foncé Sagesse", hex: "#2F4A3E" },
    { id: "violetroyalexcellence", name: "Violet Royal Excellence", hex: "#6B3FA0" },
    { id: "bleupetroleconcentration", name: "Bleu Pétrole Concentration", hex: "#1E4E5F" },
  ],
  hotel: [
    { id: "bleuocean", name: "Bleu Océan", hex: "#1B6B93" },
    { id: "orhotel", name: "Or Hôtel", hex: "#B8923E" },
    { id: "beigesableplage", name: "Beige Sable Plage", hex: "#D9C5A0" },
    { id: "vertpalmier", name: "Vert Palmier", hex: "#3E6B4A" },
    { id: "bordeauxprestigehotel", name: "Bordeaux Prestige", hex: "#6B1E2B" },
    { id: "bleupiscineturquoise", name: "Bleu Piscine Turquoise", hex: "#2E9B9B" },
    { id: "blancperle", name: "Blanc Perle", hex: "#EDE7DB" },
    { id: "brunboisprecieux", name: "Brun Bois Précieux", hex: "#6B4A32" },
    { id: "rosepoudrespa", name: "Rose Poudré Spa", hex: "#C98A9E" },
    { id: "saugedetente", name: "Vert Sauge Détente", hex: "#8BA888" },
    { id: "marineelegance", name: "Marine Élégance", hex: "#1E3A5F" },
    { id: "doreluxe", name: "Doré Luxe", hex: "#C9A24A" },
    { id: "coraildcoucherdesoleil", name: "Corail Coucher de Soleil", hex: "#E07856" },
    { id: "grisperlehotel", name: "Gris Perle Hôtel", hex: "#C7C2B8" },
    { id: "vertemeraudejardin", name: "Vert Émeraude Jardin", hex: "#1E7A5F" },
    { id: "terracottamed", name: "Terracotta Méditerranée", hex: "#C6714A" },
    { id: "bleucieldetente", name: "Bleu Ciel Détente", hex: "#6C96B5" },
    { id: "champagnehotel", name: "Champagne", hex: "#E8D9B5" },
    { id: "bordeauxvin", name: "Bordeaux Vin", hex: "#5E1B2E" },
    { id: "vertforetretraite", name: "Vert Forêt Retraite", hex: "#2F4A3E" },
    { id: "argentelegant", name: "Argent Élégant", hex: "#A9AEB4" },
    { id: "ambrechaleureux", name: "Ambre Chaleureux", hex: "#B8860B" },
    { id: "turquoiselagon", name: "Turquoise Lagon", hex: "#178582" },
    { id: "prunenuit", name: "Prune Nuit", hex: "#5C3A5E" },
    { id: "ivoiredouceur", name: "Ivoire Douceur", hex: "#E5DFCF" },
  ],
  medical: [
    { id: "bleumedical", name: "Bleu Médical", hex: "#2E86AB" },
    { id: "vertsoin", name: "Vert Soin", hex: "#3E8B6F" },
    { id: "blanclinique", name: "Blanc Clinique", hex: "#EAF2F0" },
    { id: "turquoisesante", name: "Turquoise Santé", hex: "#2E9B9B" },
    { id: "bleucielapaisant", name: "Bleu Ciel Apaisant", hex: "#6BA8C4" },
    { id: "vertmenthemedical", name: "Vert Menthe Médical", hex: "#5CA88A" },
    { id: "grisclinique", name: "Gris Clinique", hex: "#7A8590" },
    { id: "bleumarineconfiance", name: "Bleu Marine Confiance", hex: "#1E3A5F" },
    { id: "saugebienetre", name: "Vert Sauge Bien-être", hex: "#8BA888" },
    { id: "bleupastel", name: "Bleu Pastel", hex: "#A8C4D4" },
    { id: "coraildouxsante", name: "Corail Doux Santé", hex: "#E8917B" },
    { id: "vertemeraudevitalite", name: "Vert Émeraude Vitalité", hex: "#1E7A5F" },
    { id: "lavandeapaisante", name: "Lavande Apaisante", hex: "#9B8AC4" },
    { id: "bleupetrolepro", name: "Bleu Pétrole Pro", hex: "#1E4E5F" },
    { id: "blanccassecabinet", name: "Blanc Cassé Cabinet", hex: "#E8E2D5" },
    { id: "vertforetnature", name: "Vert Forêt Nature", hex: "#2F4A3E" },
    { id: "bleuardoiseserieux", name: "Bleu Ardoise Sérieux", hex: "#495867" },
    { id: "rosepoudrepediatrie", name: "Rose Poudré Pédiatrie", hex: "#C98A9E" },
    { id: "turquoiseprofondmed", name: "Turquoise Profond", hex: "#0E7C7B" },
    { id: "vertolivedoux", name: "Vert Olive Doux", hex: "#6B7B3A" },
    { id: "bleuindigoexpertise", name: "Bleu Indigo Expertise", hex: "#4338CA" },
    { id: "grisbleutemedical", name: "Gris Bleuté Médical", hex: "#56708A" },
    { id: "vertclairfraicheur", name: "Vert Clair Fraîcheur", hex: "#8FBFA3" },
    { id: "bordeauxdiscret", name: "Bordeaux Discret", hex: "#6B2737" },
    { id: "bleuglaciermed", name: "Bleu Glacier", hex: "#6C96B5" },
  ],
  service: [
    { id: "marinepro", name: "Bleu Marine", hex: "#1E3A8A" },
    { id: "indigopro", name: "Indigo", hex: "#4338CA" },
    { id: "cielpro", name: "Bleu Ciel", hex: "#2E86AB" },
    { id: "violetpro", name: "Violet Profond", hex: "#5B2C6F" },
    { id: "grisbleute", name: "Gris Bleuté", hex: "#56708A" },
    { id: "turquoisepro", name: "Turquoise", hex: "#178582" },
    { id: "emeraudepro", name: "Émeraude", hex: "#1E7A5F" },
    { id: "bordeauxpro", name: "Bordeaux Pro", hex: "#7A2E3B" },
    { id: "corporate", name: "Bleu Corporate", hex: "#2563EB" },
    { id: "bleunuitpro", name: "Bleu Nuit Pro", hex: "#142850" },
    { id: "anthracitepro", name: "Gris Anthracite Pro", hex: "#3A3F47" },
    { id: "royal", name: "Violet Royal", hex: "#6B3FA0" },
    { id: "bleuroi", name: "Bleu Roi", hex: "#1D4ED8" },
    { id: "mentepro", name: "Vert Menthe Pro", hex: "#2E8B77" },
    { id: "bordeauxelegant", name: "Bordeaux Élégant", hex: "#6B2737" },
    { id: "ardoisepro", name: "Gris Ardoise Pro", hex: "#4A5568" },
    { id: "acierpro", name: "Bleu Acier Pro", hex: "#4A6FA5" },
    { id: "prunepro", name: "Prune Pro", hex: "#5C3A5E" },
    { id: "turquoiseprofond", name: "Turquoise Profond", hex: "#0E7C7B" },
    { id: "bleuglacier", name: "Bleu Glacier", hex: "#6C96B5" },
    { id: "rosepoudrepro", name: "Rose Poudré Pro", hex: "#A5677E" },
    { id: "sapinpro", name: "Vert Sapin Pro", hex: "#2E4636" },
    { id: "doredidscret", name: "Doré Discret", hex: "#A68B3C" },
    { id: "charbonpro", name: "Charbon", hex: "#2C2F33" },
    { id: "horizon", name: "Bleu Horizon", hex: "#3B6E8F" },
  ],
};

// Nouveau modèle : un seul plan payant (site + domaine), deux extensions possibles,
// deux durées possibles (6 mois ou 1 an, avec réduction sur l'annuel).
export const PRIX = {
  com: { semestre: 25000, an: 45000 },
  sn: { semestre: 35000, an: 63000 },
};

export const DOMAINES = [
  { id: "com", label: ".com", note: "Extension internationale, la plus courante" },
  { id: "sn", label: ".sn", note: "Extension sénégalaise, coût d'enregistrement plus élevé" },
];

export const DUREES = [
  { id: "semestre", label: "6 mois", note: null },
  { id: "an", label: "1 an", note: "Économisez en payant l'année complète" },
];

// Tarif d'une modification demandée par le client APRÈS que son site soit
// payé et en ligne (statut "actif"). Facturé automatiquement — voir
// modifier_site_proprietaire()/modifier_site_par_jeton() dans schema.sql —
// et affiché au client à l'étape tarifs (CreerSite.js) et dans le formulaire
// d'édition (EditerSite.js) pour qu'il n'y ait aucune surprise.
export const PRIX_MODIFICATION = 500;

export const PAIEMENTS = {
  wave: { label: "Wave", icon: Smartphone, color: "#00A9E0", bg: "#E6F7FC" },
  orange_money: { label: "Orange Money", icon: Smartphone, color: "#FF6600", bg: "#FFF1E6" },
  visa: { label: "Carte Visa", icon: CreditCard, color: "#1A1F71", bg: "#EDEEF7" },
};

export const CLIENTS_CONFIANCE = [
  { nom: "Casa Rama", secteur: "Restaurant & Fast-food", icon: Utensils, domaine: "casarama.com" },
  { nom: "Yas Body Care", secteur: "Cosmétique naturelle", icon: Leaf, domaine: "samasite.sn/yasbodycare" },
  { nom: "Dyny Bio & Bon", secteur: "Produits du terroir", icon: ShoppingBasket, domaine: "dynybioetbon.com" },
  { nom: "Epi du Terroir", secteur: "Produits du terroir", icon: ShoppingBasket, domaine: "samasite.sn/epiduterroir" },
  { nom: "Teranga Packaging", secteur: "Artisanat & Réparation", icon: Settings2, domaine: "terangapackaging.com" },
  { nom: "INAYA Consulting", secteur: "Présentation de service", icon: User, domaine: "samasite.sn/inayaconsulting" },
  { nom: "CSI Madrassa", secteur: "École & Formation", icon: GraduationCap, domaine: "csimadrassa.com" },
  { nom: "FELDÉ Jus'Nat", secteur: "Produits du terroir", icon: ShoppingBasket, domaine: "feldejusnat.com" },
  { nom: "Keur Yaye Rakhma", secteur: "Restaurant & Fast-food", icon: Utensils, domaine: "samasite.sn/keuryayerakhma" },
];

export const CLIENTS_INITIAUX = [
  { id: 1, nom: "Sénégal Wax Déco", secteur: "Artisanat & Réparation", secteurId: "artisanat", statut: "essai", joursRestants: 2 },
  { id: 2, nom: "Thiof Express", secteur: "Restaurant & Fast-food", secteurId: "restaurant", statut: "essai", joursRestants: 1 },
  { id: 3, nom: "Ndiaye Conseil", secteur: "Présentation de service", secteurId: "service", statut: "essai", joursRestants: 1 },
  { id: 4, nom: "Sokhna Beauté", contactNom: "Sokhna Diop", secteur: "Cosmétique naturelle", secteurId: "cosmetique", statut: "a_livrer", extension: "com", duree: "semestre", domaine: "sokhnabeaute.com", montant: 25000, paiement: "orange_money", dateCommande: "24 août 2026", whatsapp: "77 512 34 56", email: "sokhna.diop@gmail.com" },
  { id: 5, nom: "Ferme Baol", contactNom: "Moussa Fall", secteur: "Produits du terroir", secteurId: "alimentaire", statut: "a_livrer", extension: "sn", duree: "semestre", domaine: "fermebaol.sn", montant: 35000, paiement: "wave", dateCommande: "23 août 2026", whatsapp: "70 234 56 78", email: "moussa.fall@fermebaol.sn" },
  { id: 6, nom: "Casa Rama", contactNom: "Aïda Sarr", secteur: "Restaurant & Fast-food", secteurId: "restaurant", statut: "actif", extension: "com", duree: "an", domaine: "casarama.com", renouvellement: "12 fév. 2027", domaineBientot: false, montant: 45000, paiement: "wave", dateCommande: "12 août 2026", whatsapp: "76 445 12 90", email: "aida.sarr@casarama.sn" },
  { id: 7, nom: "Yas Body Care", contactNom: "Khadija Ndour", secteur: "Cosmétique naturelle", secteurId: "cosmetique", statut: "actif", extension: "com", duree: "semestre", domaine: "yasbodycare.com", renouvellement: "3 déc. 2026", domaineBientot: false, montant: 25000, paiement: "visa", dateCommande: "3 juin 2026", whatsapp: "78 890 22 14", email: "khadija.ndour@yasbodycare.com" },
  { id: 8, nom: "JOOR Garage", contactNom: "Ibrahima Sy", secteur: "Artisanat & Réparation", secteurId: "artisanat", statut: "actif", extension: "sn", duree: "semestre", domaine: "joorgarage.sn", renouvellement: "20 jan. 2027", domaineBientot: true, montant: 35000, paiement: "orange_money", dateCommande: "20 juil. 2026", whatsapp: "77 663 90 08", email: "ibrahima.sy@joorgarage.sn" },
  { id: 9, nom: "Studio Kaay", contactNom: "Mamadou Kaay", secteur: "Présentation de service", secteurId: "service", statut: "expire", typeExpiration: "essai", joursDepuisExpiration: 5, whatsapp: "77 234 56 78", email: "mamadou.kaay@gmail.com" },
  { id: 10, nom: "Mburu Tak", contactNom: "Fatou Ndao", secteur: "Restaurant & Fast-food", secteurId: "restaurant", statut: "expire", typeExpiration: "essai", joursDepuisExpiration: 12, whatsapp: "76 891 23 45", email: "fatou.ndao@gmail.com" },
  { id: 11, nom: "Dakar Fresh Fruits", contactNom: "Ousmane Diallo", secteur: "Produits du terroir", secteurId: "alimentaire", statut: "expire", typeExpiration: "abonnement", joursDepuisExpiration: 9, domaine: "dakarfreshfruits.com", extension: "com", montant: 25000, whatsapp: "70 456 78 90", email: "ousmane.diallo@dakarfreshfruits.sn" },
];

export const FAQ = [
  {
    q: "Que se passe-t-il si je ne paie pas après les 2 jours d'essai ?",
    r: "Le site est automatiquement désactivé. Vos informations restent conservées quelques jours, le temps de vous décider — rien n'est perdu immédiatement.",
  },
  {
    q: "Le numéro WhatsApp est-il obligatoire ?",
    r: "Oui, c'est le seul canal de commande ou de contact affiché sur votre site — vos clients n'ont besoin d'aucune application supplémentaire.",
  },
  {
    q: "Puis-je modifier mon site après sa création ?",
    r: "Oui. Depuis votre espace client, vous pouvez modifier vos informations, vos produits ou services à tout moment.",
  },
  {
    q: "Quelle est la différence entre un domaine .com et un domaine .sn ?",
    r: "Les deux sont livrés sous 48h après paiement. Le .sn (extension sénégalaise) coûte plus cher à l'enregistrement, d'où son tarif plus élevé — 35 000 F contre 25 000 F pour un .com, par période de 6 mois.",
  },
  {
    q: "Que se passe-t-il si je ne renouvelle pas mon domaine ?",
    r: "Vous êtes prévenu par e-mail avant l'échéance pour renouveler sans interruption de votre site.",
  },
  {
    q: "Puis-je payer pour toute l'année d'un coup ?",
    r: "Oui, le paiement annuel est disponible et revient moins cher que deux paiements semestriels séparés.",
  },
  {
    q: "Dois-je savoir coder pour utiliser Sama Site ?",
    r: "Non. Tout se fait par formulaire : catégorie, couleurs, textes, photos et numéro WhatsApp.",
  },
];

export const COMMENT_CA_MARCHE = [
  { n: 1, titre: "Choisissez votre secteur", texte: "Sélectionnez le secteur d'activité qui correspond à votre entreprise.", icon: Store },
  { n: 2, titre: "Personnalisez votre site", texte: "Ajoutez votre logo, vos couleurs, vos textes et vos photos facilement.", icon: Edit3 },
  { n: 3, titre: "Ajoutez vos produits ou services", texte: "Présentez ce que vous proposez avec vos prix et vos descriptions.", icon: LayoutGrid },
  { n: 4, titre: "Activez la commande via WhatsApp", texte: "Vos clients vous contactent directement sur WhatsApp en un clic.", icon: MessageCircle },
  { n: 5, titre: "Prévisualisez votre site", texte: "Visualisez votre site en temps réel et vérifiez chaque détail.", icon: Eye },
  { n: 6, titre: "Publiez votre site gratuitement", texte: "Mettez votre site en ligne gratuitement pendant 2 jours d'essai.", icon: Rocket },
  { n: 7, titre: "Profitez de votre essai de 2 jours", texte: "Testez toutes les fonctionnalités sans engagement.", icon: CalendarDays },
  { n: 8, titre: "Passez à la version payante", texte: "Choisissez votre formule et effectuez le paiement en toute sécurité.", icon: CreditCard },
  { n: 9, titre: "Obtenez votre nom de domaine", texte: "Recevez votre domaine personnalisé (.com ou .sn) et restez en ligne.", icon: Globe },
];

// Numéro WhatsApp de Sama Site pour l'assistance aux utilisateurs de la plateforme.
export const WHATSAPP_SUPPORT = "221774181434";
export const WHATSAPP_AVATAR = "data:image/webp;base64,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";
export const LOGO_SAMASITE = "data:image/webp;base64,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";

/* ---------------------------------------------------------
   PETITS COMPOSANTS PARTAGÉS
--------------------------------------------------------- */
export function AnneauCompteARebours({ joursRestants, total = 2, size = 48 }) {
  const r = (size - 7) / 2;
  const c = 2 * Math.PI * r;
  const fraction = Math.max(0, joursRestants) / total;
  const urgence = joursRestants <= 1;
  return (
    <div style={{ width: size, height: size, position: "relative" }} className="shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.bleuClairBord} strokeWidth="4.5" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={urgence ? T.rouge : T.jaune}
          strokeWidth="4.5" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold leading-none" style={{ color: urgence ? T.rouge : T.encre, fontSize: size * 0.34 }}>
          {joursRestants}
        </span>
      </div>
    </div>
  );
}

// Drapeau du Sénégal en SVG (plutôt qu'un emoji, pour un rendu net et professionnel sur tous les appareils).
export function DrapeauSenegal({ size = 18, className = "" }) {
  const h = size;
  const w = Math.round(size * 1.5);
  return (
    <svg width={w} height={h} viewBox="0 0 30 20" className={className} style={{ borderRadius: 2, display: "block" }}>
      <rect width="10" height="20" x="0" fill="#00853F" />
      <rect width="10" height="20" x="10" fill="#FDEF42" />
      <rect width="10" height="20" x="20" fill="#E31B23" />
      <polygon points="15,6 16.18,9.6 20,9.6 16.9,11.9 18.1,15.5 15,13.2 11.9,15.5 13.1,11.9 10,9.6 13.82,9.6"
        fill="#00853F" />
    </svg>
  );
}

export function Badge({ children, tone = "bleu" }) {
  const styles = {
    bleu: { background: T.bleuClair, color: T.bleu },
    jaune: { background: T.jauneFond, color: T.jauneFonce },
    vert: { background: T.vertFond, color: T.vert },
    rouge: { background: T.rougeFond, color: T.rouge },
    gris: { background: "#F1F5F9", color: T.gris },
  };
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={styles[tone]}>
      {children}
    </span>
  );
}

export function assombrir(hex, pct) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + pct, g = ((num >> 8) & 0x00ff) + pct, b = (num & 0x0000ff) + pct;
  r = Math.min(255, Math.max(0, r)); g = Math.min(255, Math.max(0, g)); b = Math.min(255, Math.max(0, b));
  return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

export function hexToHsl(hex) {
  const num = parseInt(hex.slice(1), 16);
  let r = ((num >> 16) & 0xff) / 255, g = ((num >> 8) & 0xff) / 255, b = (num & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to255 = (v) => Math.round((v + m) * 255);
  return "#" + [to255(r), to255(g), to255(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// À partir d'une couleur choisie, dérive ses 2 variantes : une claire (fond du site)
// et une foncée (accent) — même teinte, cohérence monochrome façon charte de marque.
export function deriverVariantes(hex) {
  const [h, s] = hexToHsl(hex);
  return {
    clair: hslToHex(h, Math.max(20, s * 0.5), 90),
    fonce: hslToHex(h, Math.min(100, s + 8), 28),
  };
}

export function genererSchema(hexPrincipal) {
  const [h, s] = hexToHsl(hexPrincipal);
  return {
    primaire: hexPrincipal,
    fond: hslToHex(h, Math.max(15, s * 0.35), 96),
    accent: hslToHex(h, Math.min(100, s + 5), 30),
  };
}

// Échantillonne une image (logo) et renvoie sa couleur dominante approximative.
export function extraireCouleurDominante(dataUrl, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const taille = 32;
    canvas.width = taille; canvas.height = taille;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, taille, taille);
    let r = 0, g = 0, b = 0, n = 0;
    try {
      const data = ctx.getImageData(0, 0, taille, taille).data;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 100) continue;
        const rr = data[i], gg = data[i + 1], bb = data[i + 2];
        // Ignore le blanc/noir/gris quasi neutres pour capter la couleur la plus caractéristique du logo.
        const maxC = Math.max(rr, gg, bb), minC = Math.min(rr, gg, bb);
        if (maxC - minC < 18) continue;
        r += rr; g += gg; b += bb; n++;
      }
      if (n === 0) { r = 37; g = 99; b = 235; n = 1; } // repli sur le bleu Sama Site
      const hex = "#" + [r, g, b].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("");
      callback(hex);
    } catch (e) {
      callback("#2563EB");
    }
  };
  img.src = dataUrl;
}
