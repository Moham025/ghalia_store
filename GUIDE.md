# Ghalia Store

Le site comprend un catalogue mobile, des filtres, les détails d’un article, une demande de commande WhatsApp et un espace `/admin` pour ajouter les photos et les informations. Les commandes sont des demandes envoyées par le client sur WhatsApp ; cette version n’enregistre pas de commande et ne réserve pas le stock automatiquement. Le message de commande inclut le lien public de la photo de couverture : WhatsApp peut en afficher une miniature si l’aperçu des liens est activé. Le lien reste présent si l’aperçu ne s’affiche pas ; la photo n’est pas jointe comme fichier.

## Connecter Supabase

1. Créer un projet Supabase **Free**.
2. Dans **SQL Editor**, exécuter `supabase/01-base.sql`, puis `supabase/02-catalogue.sql`, dans cet ordre. Ne pas les exécuter sur une base existante contenant des données sans vérification préalable.
3. Dans **Authentication > Users**, créer ton utilisateur avec une adresse e-mail et un mot de passe. Dans les réglages Auth, désactiver les inscriptions publiques : seuls les administrateurs créés manuellement utilisent ce site.
4. Remplacer l’adresse dans `supabase/03-administrateur.sql` par celle du compte, puis exécuter ce fichier.
5. Dans le panneau **Connect** de Supabase, récupérer l’URL du projet et la clé **publishable**. Configurer `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` dans l’environnement d’hébergement. Pour le développement local, copier `.env.example` dans `.env` et renseigner ces deux valeurs.
6. Ouvrir `/admin`, se connecter et importer les photos du dossier en brouillons. Les articles déjà présents sont ignorés lors d’une reprise. Les photos importées seront stockées dans le bucket Supabase `produits`.

Aucune clé `secret` ou `service_role` n’est nécessaire. Les accès sont protégés par les règles RLS et la table `admins`. Les jetons de connexion sont dans des cookies HttpOnly. Tous les formulaires d’écriture passent par le serveur, qui conserve les droits du compte Supabase connecté.

## Ajouter des articles

Cliquer sur **Ajouter un article**, choisir jusqu’à 8 photos JPG, PNG ou WebP, saisir la référence (par exemple `3.2`), le titre, le prix, les tailles et les quantités. Les photos sont optimisées avant envoi. Le bouton de chaque vignette permet de choisir la couverture. Enregistrer en brouillon ou activer **Publier sur la boutique**. Une publication exige une photo, un prix et une taille en stock.

La tranche d’âge est déduite de la référence : 1 = 0–2 ans, 2 = 3–5 ans, 3 = 6–9 ans, 4 = 10–13 ans. Les références physiques sont conservées. Les noms préremplis et les photos regroupées sont provisoires : vérifier particulièrement `1.4`, `2.11` et `3.13` avant publication. Les genres sont initialement « mixte », à corriger dans chaque fiche.

Les 101 originaux n’ont pas été modifiés. Les copies WebP regroupent 95 références et 99 photos ; seules les images strictement identiques dans une même référence ont été dédupliquées. `2.28` et `4.28` restent deux références distinctes.

Sans connexion Supabase, le site reste un aperçu avec prix et stocks non renseignés, et la sauvegarde est désactivée. Quand Supabase est connecté, seuls les articles actifs sont visibles en boutique. Une erreur de connexion n’affiche jamais le catalogue d’aperçu à la place des données réelles.

Les fichiers déjà téléversés mais retirés d’une fiche ou abandonnés pendant un import restent dans Storage ; prévoir leur nettoyage à mesure que le catalogue grandit. Ne pas supprimer un objet encore utilisé par une fiche.

## Développement

`npm run install:ci`, `npm run dev`, `npm run build`. Vérification TypeScript : `node node_modules/typescript/bin/tsc --noEmit`.

## Déployer sur Cloudflare Workers

La boutique publique est disponible sur https://ghalia-store.sanou-moham92.workers.dev. Le dépôt contient `wrangler.jsonc`. Après avoir connecté Cloudflare à GitHub, configurer le répertoire racine du build sur la racine de ce dépôt, la commande de build sur `npm run build` et la commande de déploiement sur `npx wrangler deploy`. Définir les deux variables d'environnement `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` dans le Worker. Elles sont nécessaires au catalogue et à l'administration ; ne pas les mettre dans `wrangler.jsonc`.

Pour un déploiement depuis l'ordinateur, utiliser `npm run deploy:cloudflare` après `wrangler login`. Vérifier ensuite la page boutique et `/admin` sur l'URL `workers.dev` fournie par Cloudflare.

Le dossier parent contient les documents de référence d’origine ; ils sont conservés. L’aperçu Sites reste privé. La boutique publique est hébergée sur Cloudflare Workers.
