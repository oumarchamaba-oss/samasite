// Ajouté lors de l'audit sécurité de septembre 2026 : le projet n'avait
// jusqu'ici AUCUN next.config.js, donc AUCUN en-tête de sécurité HTTP n'était
// envoyé (au-delà des quelques valeurs par défaut ajoutées par l'hébergeur).
//
// Volontairement PAS de Content-Security-Policy ici : l'application charge
// les polices Google Fonts (app/globals.css), passe par l'authentification
// Supabase (redirections OAuth Google comprises) et affiche des images en
// base64 (logos/bannières importés par les clients) — une CSP mal réglée
// casserait silencieusement l'un de ces éléments, et elle ne peut pas être
// vérifiée dans cet environnement (pas de navigateur réel disponible ici).
// Recommandé en suivi, à tester manuellement avant activation :
// script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
// font-src https://fonts.gstatic.com; img-src 'self' data: https:;
// connect-src 'self' https://*.supabase.co https://accounts.google.com;
// frame-ancestors 'none'.
//
// Les en-têtes ci-dessous, eux, ne changent rien au fonctionnement de
// l'application (aucun risque de casse) et apportent une protection réelle :
// - X-Content-Type-Options : empêche un navigateur de "deviner" un type de
//   fichier différent de celui déclaré (protection contre certains XSS).
// - X-Frame-Options / frame-ancestors : empêche que le site (ou le tableau de
//   bord admin) soit chargé dans une <iframe> sur un autre site — protection
//   contre le clickjacking. Aucune page de Sama Site n'a besoin d'être
//   affichée en iframe ailleurs.
// - Referrer-Policy : évite d'envoyer l'URL complète (pouvant contenir un
//   jeton d'édition privé /site/[jeton]) comme référent à un site externe
//   quand un visiteur clique sur un lien sortant.
// - Permissions-Policy : désactive l'accès caméra/micro/géolocalisation par
//   défaut — l'application n'en a besoin nulle part.
const enTetesSecurite = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: enTetesSecurite,
      },
    ];
  },
};

module.exports = nextConfig;
