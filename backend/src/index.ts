// =============================================================================
//  MediaCloud — Serveur backend (Express)
//  Développé par LM-Code
//
//  Rôle : recevoir les fichiers, les ranger dans stockage/, enregistrer leurs
//  informations dans MySQL et les renvoyer en streaming au navigateur.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { initialiserBaseDeDonnees } from './db/initialiser.js';
import { ErreurHttp, gestionnaireErreurs } from './middleware/erreurs.js';
import categoriesRouter from './routes/categories.js';
import mediasRouter from './routes/medias.js';
import playlistsRouter from './routes/playlists.js';
import progressionsRouter from './routes/progressions.js';
import statsRouter from './routes/stats.js';
import { preparerDossiers } from './stockage.js';

const app = express();

// ─── Middlewares globaux ──────────────────────────────────────────────────────

// helmet ajoute des en-têtes de sécurité HTTP
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        // blob: et data: servent aux aperçus d'images avant l'envoi
        'img-src': ["'self'", 'data:', 'blob:'],
        'media-src': ["'self'", 'blob:'],
        'frame-src': ["'self'"],
        // Application utilisée en HTTP sur le réseau local : on ne force pas HTTPS
        'upgrade-insecure-requests': null,
      },
    },
    strictTransportSecurity: false,
  }),
);
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json({ limit: '1mb' }));

// ─── Routes de l'API ──────────────────────────────────────────────────────────

app.use('/api/medias', mediasRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/progressions', progressionsRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/stats', statsRouter);

app.get('/api/sante', (_req, res) => {
  res.json({ statut: 'ok', date: new Date().toISOString() });
});

// Toute autre URL /api/... n'existe pas
app.use('/api', () => {
  throw new ErreurHttp(404, 'Route introuvable.');
});

// ─── Frontend compilé (mode production : npm run build puis npm start) ────────
// Le backend sert alors aussi le site React : un seul port à ouvrir sur le NAS.

if (fs.existsSync(config.dossierFrontend)) {
  app.use(express.static(config.dossierFrontend));
  // Toutes les autres URLs renvoient index.html (c'est React qui gère les pages)
  app.get('/{*chemin}', (_req, res) => {
    res.sendFile(path.join(config.dossierFrontend, 'index.html'));
  });
}

// ─── Gestion des erreurs (toujours en dernier) ───────────────────────────────

app.use(gestionnaireErreurs);

// ─── Démarrage ────────────────────────────────────────────────────────────────

async function demarrer(): Promise<void> {
  try {
    preparerDossiers();
    await initialiserBaseDeDonnees();
  } catch (erreur) {
    console.error('\n[serveur] Impossible de se connecter à MySQL :', (erreur as Error).message);
    console.error('[serveur] Vérifiez que WAMP est démarré et le fichier backend/.env\n');
    process.exit(1);
  }

  const serveur = app.listen(config.port, () => {
    console.log(`[serveur] MediaCloud démarré sur http://localhost:${config.port}`);
    console.log(`[serveur] Fichiers stockés dans : ${config.dossierStockage}`);
  });

  // Pas de limite de temps : l'envoi d'un film de plusieurs Go peut être long
  serveur.requestTimeout = 0;
}

void demarrer();
