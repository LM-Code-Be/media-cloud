// =============================================================================
//  Gestion des fichiers sur le disque (le "NAS")
//
//  Organisation du dossier stockage/ :
//    stockage/
//      ├── temporaire/   ← fichiers en cours d'envoi
//      ├── miniatures/   ← images d'aperçu (jaquettes, pochettes…)
//      ├── film/  serie/  video/  musique/  photo/  document/
// =============================================================================
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { config } from './config.js';
import { TYPES_MEDIA, type TypeMedia } from './utils/types.js';

const DOSSIER_TEMPORAIRE = path.join(config.dossierStockage, 'temporaire');
const DOSSIER_MINIATURES = 'miniatures';

/** Crée tous les sous-dossiers de stockage s'ils n'existent pas. */
export function preparerDossiers(): void {
  for (const dossier of ['temporaire', DOSSIER_MINIATURES, ...TYPES_MEDIA]) {
    fs.mkdirSync(path.join(config.dossierStockage, dossier), { recursive: true });
  }
}

/** Génère un nom de fichier unique en gardant l'extension d'origine. */
function nomUnique(nomOriginal: string): string {
  const extension = path.extname(nomOriginal).toLowerCase();
  return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
}

/**
 * Middleware "multer" : reçoit les fichiers envoyés par le formulaire et les
 * écrit directement sur le disque (dans temporaire/), sans les charger en
 * mémoire. Indispensable pour les gros films !
 */
export const upload = multer({
  storage: multer.diskStorage({
    destination: DOSSIER_TEMPORAIRE,
    filename: (_req, fichier, callback) => callback(null, nomUnique(fichier.originalname)),
  }),
  limits: { fileSize: config.tailleMaxOctets },
  // Les navigateurs envoient les noms de fichiers en UTF-8 : garde les accents ("été.jpg")
  defParamCharset: 'utf8',
});

/**
 * Déplace un fichier du dossier temporaire vers son dossier final.
 * Renvoie le chemin RELATIF (ex : "film/123-abc.mp4") à enregistrer en base.
 */
export async function rangerFichier(
  cheminTemporaire: string,
  dossier: TypeMedia | 'miniatures',
): Promise<string> {
  const relatif = path.posix.join(dossier, path.basename(cheminTemporaire));
  await fs.promises.rename(cheminTemporaire, cheminAbsolu(relatif));
  return relatif;
}

/** Écrit une image (ex : pochette d'album) directement dans miniatures/. */
export async function enregistrerMiniature(
  donnees: Uint8Array,
  extension: string,
): Promise<string> {
  const relatif = path.posix.join(DOSSIER_MINIATURES, nomUnique(`image.${extension}`));
  await fs.promises.writeFile(cheminAbsolu(relatif), donnees);
  return relatif;
}

/** Supprime un fichier sans planter s'il n'existe déjà plus. */
export async function supprimerFichier(relatifOuAbsolu: string | null | undefined): Promise<void> {
  if (!relatifOuAbsolu) return;
  const chemin = path.isAbsolute(relatifOuAbsolu) ? relatifOuAbsolu : cheminAbsolu(relatifOuAbsolu);
  await fs.promises.rm(chemin, { force: true });
}

/**
 * Transforme un chemin relatif en chemin absolu, en vérifiant qu'il reste
 * bien DANS le dossier de stockage (sécurité : empêche "../../windows").
 */
export function cheminAbsolu(relatif: string): string {
  const absolu = path.resolve(config.dossierStockage, relatif);
  if (!absolu.startsWith(config.dossierStockage + path.sep)) {
    throw new Error('Chemin de fichier invalide');
  }
  return absolu;
}

/** Espace disque total et libre du disque qui contient le stockage. */
export async function espaceDisque(): Promise<{ total: number; libre: number }> {
  const infos = await fs.promises.statfs(config.dossierStockage);
  return { total: infos.blocks * infos.bsize, libre: infos.bavail * infos.bsize };
}
