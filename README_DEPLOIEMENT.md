# Sama Site — Guide de déploiement (de zéro à en ligne)

Ce guide suppose que vous n'avez **aucun compte** technique pour l'instant.
Comptez environ 45 minutes la première fois. Tout ce qui est listé ici est
**gratuit** pour démarrer (aucune carte bancaire requise pour Supabase/Vercel).

---

## Étape 1 — Créer votre base de données (Supabase)

1. Allez sur https://supabase.com → "Start your project" → connectez-vous avec Google ou un e-mail.
2. Cliquez sur "New project". Donnez-lui un nom (ex : `sama-site`), choisissez un mot de passe de base de données (notez-le quelque part), région : Europe ou proche du Sénégal si disponible.
3. Attendez ~2 minutes que le projet soit prêt.
4. Dans le menu de gauche, cliquez sur **SQL Editor** → **New query**.
5. Ouvrez le fichier `supabase/schema.sql` fourni, copiez tout son contenu, collez-le dans l'éditeur, puis cliquez sur **Run**.
   → Cela crée vos tables (`sites`, `relances`) et les règles de sécurité.
6. Allez dans **Project Settings** (icône engrenage) → **API**.
   - Copiez la valeur **Project URL** → c'est votre `NEXT_PUBLIC_SUPABASE_URL`
   - Copiez la valeur **anon public** (sous "Project API keys") → c'est votre `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Étape 2 — Créer votre compte administrateur

1. Toujours dans Supabase, allez dans **Authentication** → **Users** → **Add user** → **Create new user**.
2. Entrez votre e-mail (`oumarchamaba@gmail.com`) et un mot de passe (ex : `ChamSamaSite`).
3. Cochez "Auto Confirm User" pour ne pas avoir à confirmer par e-mail.
4. Cliquez sur **Create user**. C'est avec cet e-mail et ce mot de passe que vous vous connecterez sur `/admin/login`.

## Étape 2 bis — Activer l'assistant IA (facultatif mais recommandé)

L'assistant "Améliorer avec l'IA" (reformulation de texte) a besoin d'une clé API Anthropic pour fonctionner une fois le site déployé.

1. Allez sur https://console.anthropic.com et connectez-vous (ou créez un compte).
2. Menu **Settings** → **API Keys** → **Create Key**. Copiez la clé (elle commence par `sk-ant-...`).
3. Cette clé est payante à l'usage (facturée par Anthropic selon le nombre de reformulations demandées) — vous devrez ajouter un moyen de paiement sur le compte Anthropic pour que la clé fonctionne.
4. Vous ajouterez cette clé comme variable d'environnement `ANTHROPIC_API_KEY` à l'étape 5 (Vercel) — **jamais** dans le code, ni avec le préfixe `NEXT_PUBLIC_`.

Si vous sautez cette étape, tout le reste du site fonctionne normalement — seul le bouton "Améliorer avec l'IA" affichera une erreur.

## Étape 3 — Préparer le projet en local (optionnel mais recommandé)

Si vous avez un ordinateur avec Node.js installé :

```bash
cd sama-site
cp .env.example .env.local
# Ouvrez .env.local et collez vos vraies valeurs de l'étape 1
npm install
npm run dev
```

Ouvrez http://localhost:3000 pour tester en local avant de mettre en ligne.

## Étape 4 — Mettre le code sur GitHub

1. Créez un compte sur https://github.com si vous n'en avez pas.
2. Créez un nouveau dépôt (bouton vert "New").
3. Depuis votre dossier `sama-site`, exécutez :
```bash
git init
git add .
git commit -m "Premier envoi de Sama Site"
git branch -M main
git remote add origin https://github.com/VOTRE-NOM/sama-site.git
git push -u origin main
```

## Étape 5 — Déployer sur Vercel (l'hébergement)

1. Allez sur https://vercel.com → "Sign up" → connectez-vous avec votre compte GitHub.
2. Cliquez sur "Add New" → "Project" → sélectionnez votre dépôt `sama-site`.
3. Avant de cliquer sur "Deploy", ouvrez la section **Environment Variables** et ajoutez :
   - `NEXT_PUBLIC_SUPABASE_URL` = (votre valeur de l'étape 1)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (votre valeur de l'étape 1)
   - `ANTHROPIC_API_KEY` = (votre valeur de l'étape 2 bis, si vous voulez activer l'assistant IA)
4. Cliquez sur **Deploy**. Après 1-2 minutes, votre site est en ligne sur une adresse du type `sama-site.vercel.app`.

## Étape 6 — Brancher votre nom de domaine (samasite.com ou .sn)

1. Achetez le nom de domaine chez un registrar (ex : Namecheap, OVH pour le `.com`, ou NIC Sénégal pour le `.sn` — https://www.nic.sn).
2. Dans Vercel, ouvrez votre projet → **Settings** → **Domains** → entrez `samasite.com` → **Add**.
3. Vercel vous donne 1 ou 2 enregistrements DNS à ajouter (type A ou CNAME) chez votre registrar.
4. Ajoutez-les dans l'interface de gestion DNS de votre registrar. La propagation prend entre 10 minutes et quelques heures.

**Votre application est maintenant en ligne, avec une vraie base de données et une vraie connexion.**

---

## Ce qui fonctionne déjà réellement avec cette base

- Un client remplit le parcours en 5 étapes (secteur, métier si artisanat, couleurs, contenu, essai) → son site est **vraiment enregistré** en base de données Supabase.
- Les 9 secteurs, les 125 couleurs, les 45 métiers de l'artisanat, l'assistant IA de reformulation (via une vraie route serveur sécurisée), le rendu ordinateur/smartphone : **tout est présent**, fidèle au prototype.
- Vous vous connectez sur `/admin/login` avec un **vrai mot de passe vérifié par Supabase**, pas un code en dur.
- Le tableau de bord `/admin/dashboard` affiche les **vraies données** de tous vos clients (à livrer, actifs, essai, expirés), avec téléchargement de site utilisant leur **vrai contenu** (plus le générique).
- **Factures et reçus** : dans chaque ligne client, un bouton génère une facture (avant paiement) ou un reçu (après paiement confirmé) — document HTML imprimable, avec un bouton "Imprimer / Enregistrer en PDF" (utilise la fonction d'impression du navigateur, aucune bibliothèque PDF nécessaire).
- **Onglet Renouvellements** : liste tous les abonnements actifs triés par date d'échéance la plus proche, pour savoir qui recontacter avant la fin des 6 mois ou de l'année — avec relance WhatsApp/e-mail en un clic.
- **Le paiement en ligne est honnête** : aucune activation automatique n'est simulée. À l'étape 5, le client voit toujours l'option "Payer maintenant", mais tant qu'aucun fournisseur réel n'est branché, elle affiche clairement "Le paiement en ligne n'est pas encore configuré" et redirige vers le paiement manuel. Ainsi, personne ne peut activer un site sans paiement réellement vérifié.
- Le paiement manuel fonctionne dès aujourd'hui : le client indique avoir envoyé l'argent, la commande reste en attente, et vous cliquez sur "Marquer comme payé" dans le dashboard une fois l'argent reçu et vérifié.
- **Modes de commande** (sur place / à emporter / livraison, selon le secteur) et **réseaux sociaux** sont bien présents sur les deux rendus (ordinateur et smartphone) du site généré.

## Où brancher la vraie API de paiement, quand vous l'aurez

Tout est déjà prêt pour ce jour-là. Ouvrez `lib/paiementGateway.js` — la fonction `demarrerPaiement` contient un commentaire qui indique exactement quoi remplacer (avec un exemple pour CinetPay) pour qu'un vrai appel API démarre une transaction et que la confirmation se fasse automatiquement via un webhook, sans changer le reste de l'application.

## Limite de sécurité à connaître (MVP)

Pour que "Mon espace" fonctionne sans que vos clients aient besoin de créer un compte, le fichier `supabase/schema.sql` autorise la lecture et la mise à jour des sites à toute personne connaissant l'identifiant technique (UUID) d'un site — un peu comme un lien de partage imprévisible. C'est un compromis courant pour démarrer vite, mais ce n'est pas une vraie authentification cliente. Si vous stockez des informations sensibles ou grandissez fortement, il vaudra la peine de remplacer ces règles par un vrai système de compte client (Supabase Auth, comme pour l'admin).

## Ce qu'il reste à faire, dans l'ordre logique

1. **Automatiser les paiements** dès que vous avez un compte marchand : CinetPay (https://cinetpay.com) ou PayTech (https://paytech.sn) acceptent Wave et Orange Money et ont une API simple à brancher — nécessite en général un NINEA/registre de commerce. Le point d'intégration est déjà prêt dans `lib/paiementGateway.js`.
2. La table `paiements` existe déjà dans `supabase/schema.sql` (pensée pour un futur historique détaillé des paiements et renouvellements), mais **le code de l'application ne l'utilise pas encore** : les factures/reçus et le dashboard lisent toujours directement les colonnes de paiement sur `sites`. C'est une fondation posée pour plus tard, pas une fonctionnalité active aujourd'hui.
3. **Envoi d'e-mails automatique** (confirmation, livraison de domaine) via un service comme Resend (https://resend.com, gratuit jusqu'à 100 e-mails/jour) — aujourd'hui ces e-mails sont à envoyer manuellement.
4. **Upload d'images vers un vrai stockage** (Supabase Storage) plutôt qu'en base64 dans la base de données — fonctionne tel quel, mais alourdit la base à mesure que les clients ajoutent des photos.
5. **Achat de domaine automatisé** : possible plus tard via l'API d'un registrar, mais l'achat manuel (comme vous le faites déjà) reste tout à fait viable au démarrage.
6. Renforcer la sécurité de "Mon espace" (voir la limite ci-dessus) si le besoin s'en fait sentir.
