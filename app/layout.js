import "./globals.css";
import { LOGO_SAMASITE } from "../lib/data";

const DESCRIPTION = "Créez votre site e-commerce WhatsApp en quelques minutes, sans coder.";

export const metadata = {
  metadataBase: new URL("https://samasite.online"),
  title: { default: "Sama Site", template: "%s — Sama Site" },
  description: DESCRIPTION,
  // Icône d'onglet du navigateur pour les pages de la plateforme elle-même
  // (accueil, /creer, /espace, etc.) : le logo Sama Site, pas l'icône
  // générique app/icon.svg. Les pages qui rendent le site d'UN commerce
  // (app/s/[slug]/page.js, app/site/[token]/layout.js) redéfinissent ce
  // champ avec le logo du commerce — voir lib/sitePublic.js.
  icons: { icon: { url: LOGO_SAMASITE, type: "image/webp" } },
  openGraph: {
    title: "Sama Site",
    description: DESCRIPTION,
    url: "https://samasite.online",
    siteName: "Sama Site",
    locale: "fr_SN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sama Site",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
