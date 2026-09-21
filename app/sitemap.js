export default function sitemap() {
  const maintenant = new Date();
  return [
    { url: "https://samasite.online", lastModified: maintenant, changeFrequency: "weekly", priority: 1 },
    { url: "https://samasite.online/creer", lastModified: maintenant, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://samasite.online/confidentialite", lastModified: maintenant, changeFrequency: "yearly", priority: 0.2 },
    { url: "https://samasite.online/cgu", lastModified: maintenant, changeFrequency: "yearly", priority: 0.2 },
  ];
}
