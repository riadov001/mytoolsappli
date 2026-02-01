#!/bin/bash

# 🚨 Arrêt à la moindre erreur
set -e

echo "🔹 Début du script Railway-complete.sh"

# 1️⃣ Vérification des dépendances Node.js et npm
if ! command -v node &> /dev/null; then
  echo "Node.js n'est pas installé. Abort."
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "npm n'est pas installé. Abort."
  exit 1
fi

# 2️⃣ Installation des dépendances
echo "📦 Installation des dépendances npm..."
npm install

# 3️⃣ Vérification de la variable d'environnement DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erreur : DATABASE_URL non défini !"
  echo "Ajoute DATABASE_URL via Railway Variables avant le déploiement."
  exit 1
fi

# 4️⃣ Création du fichier .env local
echo "🔧 Création de .env.local..."
cat > .env.local <<EOL
DATABASE_URL=$DATABASE_URL
PORT=3000
SESSION_SECRET=$(openssl rand -hex 16)
NODE_ENV=production
EOL

# 5️⃣ Build frontend React + Vite
echo "⚡ Build du frontend React..."
npm run build

# 6️⃣ Exécution des migrations Drizzle
echo "📊 Exécution des migrations Drizzle..."
npx drizzle-kit migrate:dev

# 7️⃣ Création d'un admin par défaut si non existant
echo "👤 Création de l'admin par défaut..."
node -e "
import { pool } from './shared/db.js';
import bcrypt from 'bcrypt';

(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  const res = await pool.query(\"INSERT INTO users (email, password, role) VALUES ('admin@myjantes.com', $1, 'admin') ON CONFLICT (email) DO NOTHING\", [hash]);
  console.log('Admin par défaut créé ou déjà existant.');
  process.exit(0);
})();
"

# 8️⃣ Lancement du backend Node.js en mode production
echo "🚀 Lancement du serveur Node.js..."
npm run start