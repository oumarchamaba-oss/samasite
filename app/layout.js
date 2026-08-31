import "./globals.css";

export const metadata = {
  title: "Sama Site",
  description: "Créez votre site e-commerce WhatsApp en quelques minutes, sans coder.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
