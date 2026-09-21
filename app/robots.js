export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/connexion",
        "/inscription",
        "/espace",
        "/mon-espace",
        "/api",
      ],
    },
    sitemap: "https://samasite.online/sitemap.xml",
  };
}
