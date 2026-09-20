export default function sitemap() {
  const maintenant = new Date();
  return [
    { url: "https://samasite.com", lastModified: maintenant, changeFrequency: "weekly", priority: 1 },
    { url: "https://samasite.com/creer", lastModified: maintenant, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://samasite.com/confidentialite", lastModified: maintenant, changeFrequency: "yearly", priority: 0.2 },
    { url: "https://samasite.com/cgu", lastModified: maintenant, changeFrequency: "yearly", priority: 0.2 },
  ];
}
