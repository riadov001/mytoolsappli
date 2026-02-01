#!/bin/bash
# 🚗 Setup complet MyJantesAppV6 — Backend + Frontend PWA
# Auteur : ChatGPT (config Riad)
# Objectif : Générer, builder et push le projet complet sur GitHub (déploiement Railway)

echo "=============================================="
echo "🚀 Initialisation du projet MyJantesAppV6 (PWA)"
echo "=============================================="

# Dossiers de base
mkdir -p server client

###########################################
# 🧠 BACKEND — Express + PostgreSQL
###########################################
echo "📦 Création du backend Express..."

cat > server/package.json <<'EOF'
{
  "name": "myjantesappv6-backend",
  "version": "1.0.0",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "pg": "^8.11.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
EOF

cat > server/db.js <<'EOF'
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default pool;
EOF

cat > server/index.js <<'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.send('🚗 MyJantesAppV6 API running successfully!');
});

// Exemple DB
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as server_time');
    res.json({
      status: 'success',
      server_time: result.rows[0].server_time,
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
EOF

echo "📥 Installation des dépendances backend..."
cd server && npm install && cd ..

###########################################
# 💅 FRONTEND — React + PWA
###########################################
echo "🎨 Vérification du dossier client/ (frontend)..."

if [ ! -f "client/package.json" ]; then
  echo "⚙️  Création d'une app React avec Vite..."
  npm create vite@latest client -- --template react
fi

cd client

npm install
npm install serve

echo "VITE_API_URL=https://backend.myjantesappv6.up.railway.app" > .env

# ---------------------
# 🪶 Fichiers PWA
# ---------------------
mkdir -p public/icons

cat > public/manifest.json <<'EOF'
{
  "name": "MyJantesAppV6",
  "short_name": "MyJantes",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "description": "Application MyJantes - gestion et personnalisation de jantes automobiles",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
EOF

# Génère deux icônes basiques (blanches)
convert -size 192x192 canvas:white public/icons/icon-192.png
convert -size 512x512 canvas:white public/icons/icon-512.png

# Service Worker simple
cat > public/service-worker.js <<'EOF'
// service-worker.js — Mise en cache de base PWA
const CACHE_NAME = 'myjantes-cache-v1';
const URLS_TO_CACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
EOF

# Enregistre le SW dans React
cat > src/registerSW.js <<'EOF'
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(() => console.log('✅ Service Worker registered!'))
        .catch((err) => console.error('SW registration failed:', err));
    });
  }
}
EOF

# Modifie main.jsx pour inclure l’enregistrement
if ! grep -q "registerSW" src/main.jsx; then
  echo "🧩 Injection de l'enregistrement du Service Worker..."
  sed -i "1i import { registerSW } from './registerSW';" src/main.jsx
  echo "registerSW();" >> src/main.jsx
fi

echo "🏗️  Build du frontend React..."
npm run build
cd ..

###########################################
# 🚉 Railway configuration
###########################################
cat > railway.toml <<'EOF'
# 🚗 MyJantesAppV6 — Configuration Railway complète
[project]
name = "myjantesappv6"

[services.backend]
root = "server"
build = "npm install"
start = "npm start"
env = "production"
autoDeploy = true
port = 8080

[[services.backend.plugins]]
name = "PostgreSQL"

[services.frontend]
root = "client"
build = "npm install && npm run build"
start = "npx serve -s build -l 8081"
env = "production"
autoDeploy = true
port = 8081

[env]
VITE_API_URL = "https://${{ services.backend.domain }}"
NODE_ENV = "production"
EOF

###########################################
# 🔧 Commit et push
###########################################
git add .
git commit -m "🚀 Auto update: Backend + Frontend PWA MyJantesAppV6"
git push origin main

###########################################
# ✅ Fin
###########################################
echo "=============================================="
echo "✅ Projet MyJantesAppV6 PWA mis à jour sur GitHub"
echo "💡 Va sur Railway → Redeploy Latest"
echo "   Backend: https://backend.myjantesappv6.up.railway.app"
echo "   Frontend: https://frontend.myjantesappv6.up.railway.app"
echo "   PWA installable depuis le navigateur ✅"
echo "=============================================="