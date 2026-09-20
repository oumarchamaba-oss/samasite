import "./globals.css";

const DESCRIPTION = "Créez votre site e-commerce WhatsApp en quelques minutes, sans coder.";

export const metadata = {
  metadataBase: new URL("https://samasite.com"),
  title: { default: "Sama Site", template: "%s — Sama Site" },
  description: DESCRIPTION,
  openGraph: {
    title: "Sama Site",
    description: DESCRIPTION,
    url: "https://samasite.com",
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
