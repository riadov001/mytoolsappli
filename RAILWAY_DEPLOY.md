# 🚂 Guide de déploiement sur Railway.app

## 📋 Prérequis

1. Un compte GitHub (gratuit)
2. Un compte Railway.app (gratuit - 5$ de crédits offerts)

## 🚀 Étapes de déploiement

### 1️⃣ Préparer le code sur GitHub

1. **Créer un nouveau repository sur GitHub** :
   - Allez sur https://github.com/new
   - Nommez votre repository (ex: `myjantes-app`)
   - Laissez-le **Public** ou **Private** (au choix)
   - **Ne cochez PAS** "Add a README file"
   - Cliquez sur "Create repository"

2. **Pousser votre code depuis Replit** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Railway deployment"
   git branch -M main
   git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
   git push -u origin main
   ```

### 2️⃣ Déployer sur Railway

1. **Créer un compte Railway** :
   - Allez sur https://railway.app
   - Cliquez sur "Start a New Project"
   - Connectez-vous avec GitHub

2. **Créer un nouveau projet** :
   - Cliquez sur "+ New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository `myjantes-app`

3. **Ajouter une base de données PostgreSQL** :
   - Dans votre projet Railway, cliquez sur "+ New"
   - Sélectionnez "Database" → "Add PostgreSQL"
   - Railway créera automatiquement une base de données

### 3️⃣ Configurer les variables d'environnement

Dans Railway, allez dans votre service (l'application) → onglet "Variables" :

**Variables requises :**

```env
NODE_ENV=production
SESSION_SECRET=votre-secret-super-securise-changez-moi
PORT=5000
```

**La variable `DATABASE_URL` sera automatiquement créée** par Railway quand vous liez la base de données.

### 4️⃣ Lier la base de données à l'application

1. Dans Railway, sélectionnez votre service d'application
2. Allez dans l'onglet "Settings" → "Service"
3. Dans la section "Variables", vérifiez que `DATABASE_URL` est présent
4. Si non, cliquez sur "+" → "Reference" → Sélectionnez la base PostgreSQL → Variable `DATABASE_URL`

### 5️⃣ Déployer et migrer la base de données

1. **Le déploiement se fait automatiquement** après le push sur GitHub
2. Railway va :
   - Installer les dépendances (`npm install`)
   - Builder l'application (`npm run build`)
   - Démarrer l'application (`npm start`)

3. **Migrer le schéma de base de données** :
   - Ouvrez le terminal Railway (dans le service) ou utilisez Railway CLI
   - Exécutez : `npm run db:push`

### 6️⃣ Importer les données initiales (optionnel)

Pour importer les utilisateurs admin et les données de test :

1. Ouvrez le terminal Railway
2. Exécutez le script de configuration :
   ```bash
   npm run db:push
   npx tsx scripts/setup-admins.ts
   ```

Ou connectez-vous à la base de données PostgreSQL Railway et exécutez le script SQL `export_production_data.sql`.

## 🌐 Accéder à votre application

Une fois le déploiement terminé :

1. Railway génère automatiquement une URL publique : `https://votre-app.up.railway.app`
2. Vous pouvez également configurer un **domaine personnalisé** (gratuit)

## 🔐 Comptes admin disponibles

Après avoir exécuté `scripts/setup-admins.ts` :

- **Email :** admin@myjantes.fr
- **Email :** administrateur@myjantes.fr
- **Mot de passe :** admin123

## 💰 Coûts

Railway offre **5$ de crédits gratuits par mois**, ce qui est largement suffisant pour :
- Une petite application Express.js
- Une base de données PostgreSQL
- Trafic modéré

**Consommation estimée :** ~2-3$ par mois pour une utilisation normale.

## 🔧 Dépannage

### Erreur : "The endpoint has been disabled"
- Vérifiez que `DATABASE_URL` est bien configuré
- Assurez-vous que la base PostgreSQL Railway est active

### L'application ne démarre pas
- Vérifiez les logs dans Railway → onglet "Deployments"
- Assurez-vous que toutes les variables d'environnement sont configurées

### Problème de build
- Vérifiez que `package.json` contient bien les scripts `build` et `start`
- Les devDependencies ne doivent contenir que les outils de build

## 📚 Ressources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway) pour le support
