# Sama Site — audit final

## Passe 1 (fournie initialement)
- Correction de `business.metier` → `site.metier` dans le générateur HTML.
- Suppression de la simulation de paiement automatique côté client.
- Essai maintenu à 2 jours.

## Passe 2
- **Bug critique** : `React.Fragment` utilisé sans import de `React` dans `CreerSite.js` (barre d'étapes) — plantage dès l'étape 1. Corrigé.
- **Donnée perdue** : lien Google Maps jamais enregistré en base. Colonne `lien_google_maps` ajoutée, insertion et lecture corrigées.
- **Faille de sécurité** : RLS jamais activée sur la table `paiements`. Corrigée.
- **Fonctionnalité restaurée** : sélecteur de mode de commande et icônes sociales, disparus de l'aperçu lors de la refonte visuelle, réintégrés (ordinateur + mobile).
- `lib/paiementGateway.js` réellement raccordé à `payerViaAPI` (au lieu d'exister sans être appelé).

## Passe 3
- **Bug fonctionnel** : `site.paye` référencé dans le générateur HTML téléchargeable — champ inexistant (la vraie colonne est `paiement_confirme`). Le fichier livré à un client payant aurait toujours affiché "Créé avec Sama Site". Corrigé.
- **Incohérence** : réseaux sociaux et mode de commande absents du fichier HTML téléchargeable alors que présents dans l'aperçu — ajoutés, avec un script JS qui recalcule dynamiquement les liens WhatsApp selon le mode choisi.
- Bug introduit puis corrigé dans la même passe : numéro WhatsApp non normalisé dans ce nouveau script.
- Mise en place d'une validation par vrai parseur (Babel) plutôt qu'un comptage manuel de caractères.

## Passe 4 (cette révision) — lecture intégrale de chaque fichier

- **Bug critique** : `Badge` utilisé dans `components/Accueil.js` (page d'accueil publique) sans jamais être importé. Aurait fait planter la page d'accueil pour **tous les visiteurs**, immédiatement. Trouvé grâce à un script de vérification croisée import/usage (ajouté à la méthode de vérification), pas par la seule lecture de syntaxe. Corrigé.
- **Modèle IA invalide** : `claude-sonnet-4-5` n'est pas un identifiant de modèle réel. Vérifié en ligne (recherche web, pas la mémoire) et corrigé en `claude-sonnet-5`, le bon identifiant actuel. Sans cette correction, l'assistant IA aurait toujours échoué une fois déployé.
- **Incohérence de sécurité** : `lib/genererDocumentPaiement.js` (factures/reçus) n'échappait pas le HTML des données client, contrairement au générateur de site. Corrigé.
- **Nettoyage** : commentaire orphelin en fin de fichier `CreerSite.js` (résidu d'une extraction précédente), retiré.
- **Vérifications structurelles supplémentaires** : les 9 secteurs ont chacun exactement 25 couleurs (225 au total) ; les 8 groupes de métiers de l'artisanat sont complets ; toutes les 88 icônes utilisées dans le code existent réellement dans la version exacte de `lucide-react` installée (vérifié par script contre le vrai paquet npm, pas seulement par lecture) ; tous les tons de badge utilisés (`jaune`, `rouge`, `vert`) sont bien définis ; toutes les propriétés de couleur (`T.xxx`) utilisées existent dans la palette.
- **Point de correction verbale (pas de code)** : le nombre réel de métiers d'artisanat est 52, et non 45 comme annoncé dans une réponse précédente — erreur d'addition de ma part, sans impact sur le fonctionnement réel.
- **Comportement à connaître, pas un bug** : le bouton "Payer maintenant" (chemin automatique, `payerViaAPI`) n'est plus affiché dans l'interface — seul le bouton manuel "J'ai déjà envoyé l'argent" est visible, avec un message honnête "Paiement en ligne bientôt disponible". C'est un choix délibéré et plus sûr (pas de bouton qui ne ferait qu'afficher une erreur). `payerViaAPI` et `lib/paiementGateway.js` restent en place, prêts à être reliés à un vrai bouton le jour où un fournisseur de paiement sera branché.

## Méthode de validation utilisée dans cette révision

1. Analyse syntaxique réelle des 24 fichiers via Babel (`@babel/preset-react` + `@babel/preset-env`).
2. Script de vérification croisée : chaque `import` correspond-il à un `export` réellement présent ? (sur tout le projet)
3. Script de vérification des composants JSX : chaque balise `<NomDeComposant>` utilisée est-elle importée ou définie localement ? (c'est ce qui a révélé le bug `Badge`)
4. Vérification des 88 icônes `lucide-react` utilisées contre la vraie bibliothèque installée (version exacte du `package.json`).
5. Vérification croisée de chaque nom de colonne référencé dans le code (`site.xxx`) contre les vraies colonnes du schéma SQL.
6. Lecture ligne par ligne de l'intégralité des 12 fichiers de composants et pages (pas seulement les zones précédemment modifiées).
7. Vérification en ligne (recherche web) du nom de modèle IA, plutôt que de se fier à la mémoire.

## Ce qui n'a pas pu être testé ici

Le build Next.js complet (`npm install` puis `npm run build`) n'a pas pu être exécuté dans cet environnement (pas de serveur Next.js disponible). C'est la seule vérification qui reste à faire, une première fois, dans l'environnement de déploiement — voir `README_DEPLOIEMENT.md`.

## Points de production à garder en tête

- Le schéma Supabase autorise des opérations anonymes larges sur `sites` (lecture et écriture), documenté comme compromis MVP pour permettre "Mon espace" sans compte client.
- Le paiement automatique réel n'est pas branché : `lib/paiementGateway.js` est le seul endroit à modifier le jour venu, et il faudra alors réafficher un bouton "Payer maintenant" dans `CreerSite.js` (étape 5) qui appelle `payerViaAPI`.
- La table `paiements` existe en base (RLS activée) mais n'est pas encore utilisée par l'application — fondation posée pour un futur historique détaillé.
