// =============================================================================
//  Script "npm run db:init"
//  Crée la base et les tables sans démarrer le serveur.
// =============================================================================
import { config } from '../config.js';
import { initialiserBaseDeDonnees } from './initialiser.js';

try {
  await initialiserBaseDeDonnees();
  console.log(`[bdd] La base "${config.bdd.nom}" est prête.`);
} catch (erreur) {
  console.error('[bdd] Impossible d’initialiser la base :', (erreur as Error).message);
  process.exit(1);
}
