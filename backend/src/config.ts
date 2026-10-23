// =============================================================================
//  Configuration centrale du backend
//  Toutes les valeurs viennent du fichier backend/.env (avec des valeurs par
//  défaut si une variable est absente).
// =============================================================================
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Dossier du fichier actuel (backend/src ou backend/dist une fois compilé)
const dossierActuel = path.dirname(fileURLToPath(import.meta.url));

// Racine du projet : media-cloud/
export const RACINE_PROJET = path.resolve(dossierActuel, '../..');

export const config = {
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  // Connexion MySQL
  bdd: {
    hote: process.env.DB_HOTE ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    utilisateur: process.env.DB_UTILISATEUR ?? 'root',
    motDePasse: process.env.DB_MOT_DE_PASSE ?? '',
    nom: process.env.DB_NOM ?? 'media_cloud',
  },

  // Dossier de stockage des fichiers (relatif à la racine du projet)
  dossierStockage: path.resolve(RACINE_PROJET, process.env.DOSSIER_STOCKAGE ?? 'stockage'),

  // Taille max d'un fichier envoyé (Mo → octets)
  tailleMaxOctets: Number(process.env.TAILLE_MAX_MO ?? 20480) * 1024 * 1024,

  // Dossier contenant schema.sql et donnees.sql
  dossierSql: path.join(RACINE_PROJET, 'database'),

  // Build du frontend (servi par le backend en production)
  dossierFrontend: path.join(RACINE_PROJET, 'frontend', 'dist'),
};
