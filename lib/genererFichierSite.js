import { SECTEURS, SECTEUR_COULEURS, RESEAUX_SOCIAUX, MODES_LIVRAISON, genererSchema, trouverMetier, formaterHoraires, paletteIdPour } from "./data";

const esc = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const attr = (value = "") => esc(value);

function normaliserNumero(number) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("221") ? digits : `221${digits.replace(/^0/, "")}`;
}
function wa(number, message = "") {
  const full = normaliserNumero(number);
  if (!full) return "#";
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

function normaliserItems(rawItems) {
  return (rawItems || []).map((it) => typeof it === "string" ? { texte: it, image: null, description: "", prix: "", categorie: "" } : { image: null, description: "", prix: "", categorie: "", ...it });
}

export function genererFichierSite(site) {
  const secteur = SECTEURS.find((s) => s.id === site.secteur_id) || SECTEURS[0];
  const demoMetier = site.metier ? trouverMetier(site.metier)?.demo : null;
  const demoActif = demoMetier || secteur.demo;
  const nom = site.nom_entreprise || demoActif.nom;
  const accroche = site.accroche || demoActif.accroche;
  // BUG CORRIGÉ (21/09/2026) : ce générateur (utilisé par le bouton "Télécharger
  // le site" du dashboard admin) affichait les produits de démo du secteur quand
  // l'entreprise n'avait encore rempli aucun produit — même bug que SiteDesktop.js,
  // corrigé ici en miroir pour que le fichier téléchargé soit cohérent avec le site publié.
  const items = normaliserItems(site.produits || []);
  const estService = secteur.type === "service";
  const catalogueLabel = secteur.libelleCatalogue || (estService ? "Services" : "Produits");
  const actionLabel = secteur.libelleAction || (estService ? "Demander" : "Commander");
  const paletteId = paletteIdPour(secteur, { metierGroupe: site.metier_groupe });
  const couleursDispo = SECTEUR_COULEURS[paletteId] || SECTEUR_COULEURS.service;
  const c = site.couleurs || genererSchema(couleursDispo[0].hex);
  const paye = site.statut === "actif";
  // Paiement en ligne (Orange Money, Wave, Free Money, Visa, Mastercard, via
  // Versus Finances Tech) : n'apparaît JAMAIS sur un site non payé (essai),
  // et seulement une fois activé par l'administrateur avec la vraie clé API
  // du commerçant — voir supabase/migration_selfhosted_20260922_paiement_en_ligne.sql
  // et lib/paiementBoutiqueGateway.js (même règle que SiteDesktop.js).
  const paiementActif = paye && !!site.paiement_en_ligne_actif;
  const heroFonce = c.primaire;
  const footerFonce = c.accent;
  const whatsapp = site.whatsapp || "";
  const modesDispo = (site.modes_livraison && site.modes_livraison.length ? site.modes_livraison : secteur.modesLivraison) || [];
  const generalWa = wa(whatsapp, `Bonjour ${nom}, je souhaite ${actionLabel.toLowerCase()} via votre site.`);
  const reseauxActifs = RESEAUX_SOCIAUX.filter((r) => site.reseaux?.[r.id]?.trim());
  const socialHTML = reseauxActifs.map((r) => `<a href="${attr(site.reseaux[r.id])}" target="_blank" rel="noopener noreferrer" aria-label="${attr(r.label || r.id)}" class="social">${r.id.slice(0,2).toUpperCase()}</a>`).join("");
  const horairesFormates = formaterHoraires(site.horaires);
  const horairesHTML = horairesFormates.length
    ? `<div class="hours"><div class="footer-title">Horaires</div>${horairesFormates.map((h) => `<div class="hours-row"><span>${esc(h.label)}</span><span>${esc(h.texte)}</span></div>`).join("")}</div>`
    : "";
  const modesHTML = modesDispo.length > 1 ? `<div class="modes">${modesDispo.map((id, i) => `<button class="mode ${i === 0 ? "active" : ""}" data-mode="${attr(id)}" data-label="${attr(MODES_LIVRAISON[id]?.label || id)}">${esc(MODES_LIVRAISON[id]?.label || id)}</button>`).join("")}</div>` : "";
  const categories = ["Tous", ...new Set(items.map((it) => it.categorie).filter(Boolean))];
  const logoHTML = site.logo_url ? `<img src="${attr(site.logo_url)}" class="logo" alt="Logo ${attr(nom)}">` : `<div class="logo-fallback">${esc(nom.slice(0,1).toUpperCase())}</div>`;
  const imageHero = site.banniere_url;
  const highlight = accroche.trim().split(/\s+/);
  const split = Math.max(0, highlight.length - 2);
  const heroTitle = `${esc(highlight.slice(0, split).join(" "))}${split ? " " : ""}<span>${esc(highlight.slice(split).join(" "))}</span>`;

  const categoryHTML = categories.map((cat, i) => `<button class="cat ${i === 0 ? "active" : ""}" data-category="${attr(cat)}">${esc(cat)}</button>`).join("");
  const cardsHTML = items.map((item, i) => {
    const messageBase = `Bonjour ${nom}, je souhaite ${actionLabel.toLowerCase()} : ${item.texte}${item.prix ? ` (${item.prix})` : ""}`;
    const image = item.image ? `<img src="${attr(item.image)}" alt="${attr(item.texte)}">` : `<div class="image-placeholder">${estService ? "Service" : "Produit"}</div>`;
    const paiementHTML = paiementActif
      ? `<button type="button" class="pay-online" data-produit-id="${attr(item.id || "")}" data-produit-texte="${attr(item.texte)}" data-montant="${attr(item.prix || "")}">Payer en ligne</button><p class="pay-methodes">Orange Money · Wave · Free Money · Visa · Mastercard</p><p class="pay-note" hidden></p>`
      : "";
    return `<article class="card" data-category="${attr(item.categorie || "Tous")}">${image}<div class="card-body"><h3>${esc(item.texte)}</h3>${item.description ? `<p class="desc">${esc(item.description)}</p>` : ""}${item.prix ? `<p class="price">${esc(item.prix)}</p>` : ""}<a class="order" data-base="${attr(normaliserNumero(whatsapp))}" data-message="${attr(messageBase)}" href="${attr(wa(whatsapp, messageBase + "."))}" target="_blank" rel="noopener noreferrer">${esc(actionLabel)} <span>↗</span></a>${paiementHTML}</div></article>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(nom)}</title>
<meta name="description" content="${esc(accroche)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(nom)}">
<meta property="og:description" content="${esc(accroche)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(nom)}">
<meta name="twitter:description" content="${esc(accroche)}">
${imageHero && /^https?:\/\//.test(imageHero) ? `<meta property="og:image" content="${attr(imageHero)}">\n<meta name="twitter:image" content="${attr(imageHero)}">` : ""}
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='${c.primaire}'/><text x='32' y='43' font-family='Arial,sans-serif' font-size='34' font-weight='800' fill='#fff' text-anchor='middle'>${esc(nom.slice(0,1).toUpperCase())}</text></svg>`)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
<style>
:root{--primary:${c.primaire};--accent:${c.accent};--soft:${c.fond};--ink:#0F172A;--muted:#64748B;--line:#E2E8F0;--wa:#25D366}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fff;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}h1,h2,h3{font-family:Poppins,Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}a{text-decoration:none;color:inherit}button{font:inherit}.header{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}.header-inner{max-width:1120px;margin:auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{display:flex;align-items:center;gap:10px;font-weight:800;min-width:0}.logo,.logo-fallback{width:40px;height:40px;border-radius:12px;object-fit:contain;background:var(--soft);display:flex;align-items:center;justify-content:center;color:var(--primary);font-weight:800}.brand span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nav{display:flex;gap:28px;font-size:14px;font-weight:600}.nav a:nth-child(n+2){color:var(--muted)}.header-cta,.hero-cta,.order{background:var(--wa);color:#fff;border:0;font-weight:800}.header-cta{padding:11px 17px;border-radius:999px;font-size:13px}.hero{position:relative;overflow:hidden;min-height:500px;display:flex;align-items:center;background:var(--soft)}.hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.hero-scrim{position:absolute;inset:0;background:linear-gradient(100deg,rgba(255,255,255,.97) 0%,rgba(255,255,255,.90) 38%,rgba(255,255,255,.55) 62%,rgba(255,255,255,.12) 100%)}.hero-noimg{position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;padding-right:40px;background:linear-gradient(140deg,var(--soft),var(--primary)22)}.hero-noimg .hero-icon{width:110px;height:110px;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:800;color:var(--primary);opacity:.5}.hero-inner{position:relative;z-index:1;max-width:1120px;margin:auto;width:100%;padding:72px 24px}.hero-copy{max-width:560px}.eyebrow{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--primary)}h1{font-size:clamp(40px,5vw,64px);line-height:1.02;letter-spacing:-.04em;margin:16px 0 0;max-width:620px}h1 span{color:var(--primary)}.hero-copy p{max-width:560px;font-size:17px;line-height:1.7;color:var(--muted);margin:22px 0}.hero-cta{display:inline-flex;align-items:center;gap:9px;width:max-content;padding:14px 22px;border-radius:999px}.credit{position:absolute;z-index:2;right:14px;bottom:14px;padding:7px 10px;border-radius:999px;background:rgba(15,23,42,.55);color:#fff;font-size:10px}.products{border-top:1px solid var(--line)}.products-inner{max-width:1120px;margin:auto;padding:64px 24px}.products h2{font-size:32px;margin:5px 0 24px;letter-spacing:-.03em}.categories{display:flex;gap:28px;overflow-x:auto;border-bottom:1px solid var(--line);scrollbar-width:none;margin-bottom:28px}.categories::-webkit-scrollbar,.cards::-webkit-scrollbar{display:none}.cat{border:0;background:transparent;color:var(--muted);padding:0 0 13px;white-space:nowrap;cursor:pointer;border-bottom:2px solid transparent}.cat.active{color:var(--primary);border-color:var(--primary);font-weight:800}.cards{display:flex;gap:18px;overflow-x:auto;scrollbar-width:none;padding-bottom:6px}.card{flex:0 0 270px;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.05)}.card>img,.image-placeholder{width:100%;height:170px;object-fit:cover}.image-placeholder{display:flex;align-items:center;justify-content:center;background:var(--soft);color:var(--primary);font-size:18px;font-weight:700}.card-body{padding:16px}.card h3{margin:0;font-size:15px;line-height:1.35}.desc{font-size:12px;line-height:1.5;color:var(--muted);margin:7px 0 0}.price{font-size:14px;font-weight:800;color:var(--primary);margin:9px 0 0}.order{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:14px;padding:11px;border-radius:999px;font-size:12px}.empty{padding:40px 0;color:var(--muted)}footer{background:var(--accent);color:#fff}.footer-inner{max-width:1120px;margin:auto;padding:50px 24px 20px;display:grid;grid-template-columns:1.5fr 1fr 1.2fr;gap:40px}.footer-brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:18px}.footer-brand .logo,.footer-brand .logo-fallback{background:rgba(255,255,255,.1);color:#fff}.footer p,.footer a,.footer div{color:rgba(255,255,255,.75);font-size:13px;line-height:1.6}.footer-title{font-size:11px!important;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:rgba(255,255,255,.45)!important;margin-bottom:12px}.footer-links{display:flex;flex-direction:column;gap:7px}.hours{margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12)}.hours-row{display:flex;justify-content:space-between;gap:12px;padding:2px 0}.modes{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}.mode{border:1.5px solid var(--line);background:#fff;color:var(--muted);padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer}.mode.active{border-color:var(--primary);color:var(--primary);background:var(--soft)}.socials{display:flex;gap:8px;margin-top:16px}.social{width:34px;height:34px;border-radius:999px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}.footer-bottom{max-width:1120px;margin:auto;padding:16px 24px 24px;border-top:1px solid rgba(255,255,255,.12);font-size:11px;color:rgba(255,255,255,.45)}@media(max-width:760px){.header-inner{padding:11px 16px}.nav{display:none}.header-cta{padding:9px 12px}.hero{min-height:420px}.hero-inner{padding:40px 20px 48px}.hero-copy p{font-size:15px}.products-inner{padding:44px 16px}.products h2{font-size:26px}.card{flex-basis:220px}.card>img,.image-placeholder{height:140px}.footer-inner{grid-template-columns:1fr;padding:38px 20px 18px;gap:26px}.footer-bottom{padding:14px 20px 20px}}
@keyframes kenBurns{from{transform:scale(1)}to{transform:scale(1.06)}}
.hero-bg{animation:kenBurns 18s ease-out infinite alternate;will-change:transform}
.card>img{transition:transform .5s cubic-bezier(.22,1,.36,1)}
.card:hover>img{transform:scale(1.07)}
.header-cta,.hero-cta,.order{position:relative;overflow:hidden}
.header-cta::after,.hero-cta::after,.order::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(115deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);transition:left .65s ease;pointer-events:none}
.header-cta:hover::after,.hero-cta:hover::after,.order:hover::after{left:130%}
.header{transition:box-shadow .3s ease,border-color .3s ease}
.header.scrolled{box-shadow:0 6px 20px rgba(15,23,42,.08);border-bottom-color:transparent}
.nav a{position:relative}
.nav a::after{content:"";position:absolute;left:50%;bottom:-4px;width:0%;height:2px;background:currentColor;transition:width .25s ease,left .25s ease}
.nav a:hover::after{width:100%;left:0%}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.hero-copy .eyebrow,.hero-copy h1,.hero-copy p,.hero-copy .hero-cta{animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}
.hero-copy h1{animation-delay:.09s}
.hero-copy p{animation-delay:.17s}
.hero-copy .hero-cta{animation-delay:.25s}
@media(prefers-reduced-motion:reduce){.hero-bg,.card>img,.header-cta::after,.hero-cta::after,.order::after,.header,.nav a::after,.hero-copy .eyebrow,.hero-copy h1,.hero-copy p,.hero-copy .hero-cta{animation:none!important;transition:none!important}}
.pay-online{display:flex;align-items:center;justify-content:center;width:100%;margin-top:8px;padding:10px;border-radius:999px;font-size:12px;font-weight:800;background:#fff;border:1.5px solid var(--primary);color:var(--primary);cursor:pointer}
.pay-methodes{font-size:9px;color:var(--muted);text-align:center;margin:6px 0 0;line-height:1.4}
.pay-note{font-size:9px;color:var(--primary);text-align:center;margin:4px 0 0;line-height:1.4}
</style></head>
<body>
<header class="header"><div class="header-inner"><a class="brand" href="#accueil">${logoHTML}<span>${esc(nom)}</span></a><nav class="nav"><a href="#accueil">Accueil</a><a href="#produits">${esc(catalogueLabel)}</a><a href="#contact">Contact</a></nav><a class="header-cta" href="${attr(generalWa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></header>
<main>
<section id="accueil" class="hero">${imageHero ? `<img class="hero-bg" src="${attr(imageHero)}" alt="${attr(nom)}"><div class="hero-scrim"></div>` : `<div class="hero-noimg"><div class="hero-icon">${esc(nom.slice(0,1).toUpperCase())}</div></div>`}<div class="hero-inner"><div class="hero-copy"><div class="eyebrow">Bienvenue chez ${esc(nom)}</div><h1>${heroTitle}</h1><p>${site.metier ? `${esc(site.metier)} — ` : ""}${estService ? "Des services pensés pour répondre simplement à vos besoins." : "Des produits sélectionnés avec soin pour vous."}</p><a class="hero-cta" href="${attr(generalWa)}" target="_blank" rel="noopener noreferrer">${esc(actionLabel)} sur WhatsApp ↗</a></div></div>${!paye ? `<div class="credit">Créé avec Sama Site</div>` : ""}</section>
<section id="produits" class="products"><div class="products-inner"><div class="eyebrow">Notre sélection</div><h2>${esc(catalogueLabel)}</h2>${modesHTML}<div class="categories">${categoryHTML}</div><div class="cards" id="cards">${cardsHTML || `<div class="empty">Ajoutez vos ${estService ? "services" : "produits"} depuis votre espace Sama Site.</div>`}</div></div></section>
</main>
<footer id="contact" class="footer"><div class="footer-inner"><div><div class="footer-brand">${logoHTML}<span>${esc(nom)}</span></div><p>${esc(accroche)}</p>${socialHTML ? `<div class="socials">${socialHTML}</div>` : ""}</div><div><div class="footer-title">Navigation</div><div class="footer-links"><a href="#accueil">Accueil</a><a href="#produits">${esc(catalogueLabel)}</a><a href="#contact">Contact</a></div></div><div><div class="footer-title">Contact</div>${whatsapp ? `<a href="${attr(generalWa)}" target="_blank" rel="noopener noreferrer">WhatsApp : ${esc(whatsapp)}</a>` : ""}${site.email ? `<div>${esc(site.email)}</div>` : ""}${site.adresse ? `<div>${esc(site.adresse)}</div>` : ""}${site.lien_google_maps ? `<a href="${attr(site.lien_google_maps)}" target="_blank" rel="noopener noreferrer">Voir sur Google Maps ↗</a>` : ""}${horairesHTML}</div></div><div class="footer-bottom">© ${new Date().getFullYear()} ${esc(nom)}. Tous droits réservés.${!paye ? " · Créé avec Sama Site" : ""}</div></footer>
<script>
(function(){
  const header=document.querySelector('.header');
  if(header){const onScroll=()=>header.classList.toggle('scrolled',window.scrollY>8);onScroll();window.addEventListener('scroll',onScroll,{passive:true});}
  const buttons=[...document.querySelectorAll('.cat')],cards=[...document.querySelectorAll('.card')];
  buttons.forEach(btn=>btn.addEventListener('click',()=>{buttons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const cat=btn.dataset.category;cards.forEach(card=>{card.style.display=cat==='Tous'||card.dataset.category===cat?'':'none';});}));

  const modeButtons=[...document.querySelectorAll('.mode')],orderLinks=[...document.querySelectorAll('.order')];
  function appliquerMode(label){orderLinks.forEach(a=>{const base=a.dataset.base,msg=a.dataset.message;if(!base)return;const full=label?msg+' ('+label+').':msg+'.';a.href='https://wa.me/'+base+'?text='+encodeURIComponent(full);});}
  modeButtons.forEach(btn=>btn.addEventListener('click',()=>{modeButtons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');appliquerMode(btn.dataset.label);}));
  if(modeButtons[0])appliquerMode(modeButtons[0].dataset.label);

  // Paiement en ligne (Versus) — tant que l'API réelle n'est pas branchée côté
  // serveur, la route renvoie toujours automatique:false : on affiche alors
  // un message clair plutôt que de simuler un paiement réussi (voir
  // lib/paiementBoutiqueGateway.js pour la même règle côté site publié).
  document.querySelectorAll('.pay-online').forEach(function(btn){
    btn.addEventListener('click',function(){
      var note=btn.parentElement.querySelector('.pay-note');
      btn.disabled=true;var texteInitial=btn.textContent;btn.textContent='…';
      fetch('https://samasite.online/api/paiement-boutique/initier',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({slug:${JSON.stringify(site.slug || "")},produitId:btn.dataset.produitId,produitTexte:btn.dataset.produitTexte,montant:btn.dataset.montant,moyenPaiement:null})
      }).then(function(r){return r.json();}).then(function(data){
        btn.disabled=false;btn.textContent=texteInitial;
        if(data&&data.automatique&&data.lienPaiement){window.location.href=data.lienPaiement;return;}
        if(note){note.hidden=false;note.textContent='Paiement en ligne bientôt disponible — commandez via WhatsApp en attendant.';}
      }).catch(function(){
        btn.disabled=false;btn.textContent=texteInitial;
        if(note){note.hidden=false;note.textContent='Paiement en ligne bientôt disponible — commandez via WhatsApp en attendant.';}
      });
    });
  });
})();
</script></body></html>`;
}

export function telechargerSite(site) {
  const html = genererFichierSite(site);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(site.nom_entreprise || "site").toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "site"}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
