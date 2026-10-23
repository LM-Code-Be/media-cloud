// =============================================================================
//  Routes /api/medias
//  Lister, envoyer (upload), lire en streaming, modifier, supprimer…
// =============================================================================
import path from 'node:path';
import { Router, type Request } from 'express';
import { parseFile } from 'music-metadata';
import { z } from 'zod';
import { executer, selectionner, selectionnerUn } from '../db/connexion.js';
import { ErreurHttp } from '../middleware/erreurs.js';
import {
  cheminAbsolu,
  enregistrerMiniature,
  rangerFichier,
  supprimerFichier,
  upload,
} from '../stockage.js';
import {
  SELECT_MEDIA,
  TYPES_MEDIA,
  fichierCompatible,
  formaterMedia,
  type LigneMedia,
  type Media,
} from '../utils/types.js';
import { entierOptionnel, lireId, texteOptionnel } from '../utils/validation.js';

const router = Router();

// ─── Schémas de validation ────────────────────────────────────────────────────

/** Paramètres de la liste : /api/medias?type=film&q=matrix&tri=titre */
const FiltresSchema = z.object({
  // Un ou plusieurs types séparés par des virgules : "film,serie,video"
  type: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',') : []))
    .pipe(z.array(z.enum(TYPES_MEDIA))),
  categorie: z.coerce.number().int().positive().optional(),
  q: z.string().trim().max(100).optional(),
  favori: z.enum(['1', 'true']).optional(),
  serie: z.string().optional(),
  enCours: z.enum(['1', 'true']).optional(),
  tri: z
    .enum(['recent', 'ancien', 'titre', 'annee', 'vues', 'taille', 'episode', 'artiste', 'lecture'])
    .default('recent'),
  limite: z.coerce.number().int().min(1).max(1000).optional(),
});

/** Ordre SQL correspondant à chaque option de tri. */
const ORDRES_TRI: Record<z.infer<typeof FiltresSchema>['tri'], string> = {
  recent: 'm.ajoute_le DESC, m.id DESC',
  ancien: 'm.ajoute_le ASC, m.id ASC',
  titre: 'm.titre ASC',
  annee: 'm.annee IS NULL, m.annee DESC, m.titre ASC',
  vues: 'm.vues DESC, m.titre ASC',
  taille: 'm.taille DESC',
  episode: 'm.saison IS NULL, m.saison, m.episode IS NULL, m.episode, m.titre',
  artiste: 'm.artiste IS NULL, m.artiste, m.album, m.titre',
  lecture: 'COALESCE(p.mis_a_jour_le, m.derniere_lecture) DESC',
};

/** Champs modifiables d'un média (envoi et modification). */
const ChampsSchema = z.object({
  titre: texteOptionnel(255),
  description: texteOptionnel(5000),
  categorieId: entierOptionnel(1),
  annee: entierOptionnel(1800, 2100),
  artiste: texteOptionnel(255),
  album: texteOptionnel(255),
  serie: texteOptionnel(255),
  saison: entierOptionnel(0, 999),
  episode: entierOptionnel(0, 9999),
  duree: entierOptionnel(0),
});

// ─── Fonctions utilitaires ────────────────────────────────────────────────────

/** Récupère un média par son id, ou lève une erreur 404. */
async function trouverMedia(id: number): Promise<Media> {
  const ligne = await selectionnerUn<LigneMedia>(`${SELECT_MEDIA} WHERE m.id = ?`, [id]);
  if (!ligne) throw new ErreurHttp(404, 'Média introuvable.');
  return formaterMedia(ligne);
}

/** Récupère les fichiers envoyés par multer (champs "fichier" et "miniature"). */
function fichiersEnvoyes(req: Request) {
  const fichiers = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
  return { fichier: fichiers.fichier?.[0], miniature: fichiers.miniature?.[0] };
}

/** Lit les informations d'un fichier audio (titre, artiste, pochette…). */
async function lireTagsAudio(chemin: string) {
  try {
    const { common, format } = await parseFile(chemin, { duration: true });
    return {
      titre: common.title ?? null,
      artiste: common.artist ?? null,
      album: common.album ?? null,
      annee: common.year ?? null,
      duree: format.duration ? Math.round(format.duration) : null,
      pochette: common.picture?.[0] ?? null,
    };
  } catch {
    return null; // fichier sans tags lisibles : pas grave
  }
}

// ─── GET /api/medias : liste filtrée ──────────────────────────────────────────

router.get('/', async (req, res) => {
  const filtres = FiltresSchema.parse(req.query);
  const conditions: string[] = [];
  const parametres: unknown[] = [];

  if (filtres.type.length > 0) {
    conditions.push('m.type IN (?)');
    parametres.push(filtres.type);
  }
  if (filtres.categorie) {
    conditions.push('m.categorie_id = ?');
    parametres.push(filtres.categorie);
  }
  if (filtres.favori) conditions.push('m.favori = 1');
  if (filtres.serie) {
    conditions.push('m.serie = ?');
    parametres.push(filtres.serie);
  }
  // "Reprendre la lecture" : commencé mais pas terminé
  if (filtres.enCours) conditions.push('p.termine = 0 AND p.position > 5');
  if (filtres.q) {
    // La collation utf8mb4_unicode_ci ignore majuscules ET accents : "ete" trouve "Été"
    const terme = `%${filtres.q}%`;
    conditions.push(
      '(m.titre LIKE ? OR m.artiste LIKE ? OR m.album LIKE ? OR m.serie LIKE ? OR m.description LIKE ? OR m.nom_original LIKE ?)',
    );
    parametres.push(terme, terme, terme, terme, terme, terme);
  }

  let sql = SELECT_MEDIA;
  if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ` ORDER BY ${ORDRES_TRI[filtres.tri]}`;
  if (filtres.limite) {
    sql += ' LIMIT ?';
    parametres.push(filtres.limite);
  }

  const lignes = await selectionner<LigneMedia>(sql, parametres);
  res.json(lignes.map(formaterMedia));
});

// ─── GET /api/medias/series : les séries regroupées par nom ───────────────────

router.get('/series', async (_req, res) => {
  const series = await selectionner<{
    nom: string;
    nombreEpisodes: number;
    nombreSaisons: number;
    annee: number | null;
    idMiniature: string | null;
    vues: number;
    ajouteLe: Date;
  }>(`
    SELECT
      serie                          AS nom,
      COUNT(*)                       AS nombreEpisodes,
      COUNT(DISTINCT saison)         AS nombreSaisons,
      MIN(annee)                     AS annee,
      SUM(vues)                      AS vues,
      MAX(ajoute_le)                 AS ajouteLe,
      -- id du premier épisode qui possède une miniature
      SUBSTRING_INDEX(
        GROUP_CONCAT(CASE WHEN miniature IS NOT NULL THEN id END ORDER BY saison, episode),
        ',', 1
      )                              AS idMiniature
    FROM medias
    WHERE type = 'serie' AND serie IS NOT NULL
    GROUP BY serie
    ORDER BY MAX(ajoute_le) DESC
  `);

  res.json(
    series.map(({ idMiniature, ...serie }) => ({
      ...serie,
      urlMiniature: idMiniature ? `/api/medias/${idMiniature}/miniature` : null,
    })),
  );
});

// ─── GET /api/medias/:id ──────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  res.json(await trouverMedia(lireId(req.params.id)));
});

// ─── POST /api/medias : envoi d'un nouveau fichier ────────────────────────────
// Formulaire "multipart/form-data" avec :
//   - fichier    (obligatoire) : le média
//   - miniature  (facultatif)  : image d'aperçu
//   - type, titre, categorieId, annee, artiste, album, serie, saison, episode…

router.post(
  '/',
  upload.fields([
    { name: 'fichier', maxCount: 1 },
    { name: 'miniature', maxCount: 1 },
  ]),
  async (req, res) => {
    const { fichier, miniature } = fichiersEnvoyes(req);
    // Chemins définitifs (pour pouvoir nettoyer si l'enregistrement échoue)
    let cheminFichier: string | null = null;
    let cheminMiniature: string | null = null;

    try {
      if (!fichier) throw new ErreurHttp(400, 'Aucun fichier reçu.');

      const type = z.enum(TYPES_MEDIA).parse(req.body.type);
      const champs = ChampsSchema.parse(req.body);

      if (!fichierCompatible(type, fichier.mimetype, fichier.originalname)) {
        throw new ErreurHttp(
          400,
          `Le fichier "${fichier.originalname}" n’est pas compatible avec ce type.`,
        );
      }
      if (miniature && !miniature.mimetype.startsWith('image/')) {
        throw new ErreurHttp(400, 'La miniature doit être une image.');
      }

      // Musique : on complète automatiquement avec les tags du fichier (ID3…)
      const tags = type === 'musique' ? await lireTagsAudio(fichier.path) : null;

      // Titre par défaut : tag audio, sinon nom du fichier sans extension
      const nomSansExtension = path.parse(fichier.originalname).name;
      const titre = champs.titre ?? tags?.titre ?? nomSansExtension;

      // On range le fichier dans son dossier définitif (stockage/<type>/)
      cheminFichier = await rangerFichier(fichier.path, type);

      // Miniature : celle envoyée, sinon la pochette de l'album
      if (miniature) {
        cheminMiniature = await rangerFichier(miniature.path, 'miniatures');
      } else if (tags?.pochette) {
        const extension = tags.pochette.format.split('/')[1] ?? 'jpg';
        cheminMiniature = await enregistrerMiniature(tags.pochette.data, extension);
      }

      const { idInsere } = await executer(
        `INSERT INTO medias
          (type, titre, description, categorie_id, annee, artiste, album, serie, saison, episode,
           fichier, nom_original, mime, taille, duree, miniature)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          type,
          titre,
          champs.description,
          champs.categorieId,
          champs.annee ?? tags?.annee ?? null,
          champs.artiste ?? tags?.artiste ?? null,
          champs.album ?? tags?.album ?? null,
          // Une série sans nom prend le titre comme nom de série
          type === 'serie' ? (champs.serie ?? titre) : null,
          type === 'serie' ? champs.saison : null,
          type === 'serie' ? champs.episode : null,
          cheminFichier,
          fichier.originalname,
          fichier.mimetype || 'application/octet-stream',
          fichier.size,
          champs.duree ?? tags?.duree ?? null,
          cheminMiniature,
        ],
      );

      res.status(201).json(await trouverMedia(idInsere));
    } catch (erreur) {
      // En cas d'erreur, on ne laisse pas traîner de fichiers temporaires
      for (const chemin of [fichier?.path, miniature?.path, cheminFichier, cheminMiniature]) {
        await supprimerFichier(chemin);
      }
      throw erreur;
    }
  },
);

// ─── PUT /api/medias/:id : modification des informations ──────────────────────
// Accepte du JSON, ou un formulaire multipart pour changer la miniature.

router.put('/:id', upload.single('miniature'), async (req, res) => {
  const nouvelleMiniature = req.file;

  try {
    const id = lireId(req.params.id);
    const actuel = await selectionnerUn<{ miniature: string | null; type: string }>(
      'SELECT miniature, type FROM medias WHERE id = ?',
      [id],
    );
    if (!actuel) throw new ErreurHttp(404, 'Média introuvable.');

    const corps = req.body ?? {};
    // .partial() : seuls les champs présents dans la requête sont modifiés
    const champs = ChampsSchema.partial().parse(corps);
    if (champs.titre === null) throw new ErreurHttp(400, 'Le titre est obligatoire.');

    // Correspondance "nom JSON" → "colonne SQL"
    const colonnes: Record<string, string> = {
      titre: 'titre',
      description: 'description',
      categorieId: 'categorie_id',
      annee: 'annee',
      artiste: 'artiste',
      album: 'album',
      serie: 'serie',
      saison: 'saison',
      episode: 'episode',
      duree: 'duree',
    };

    const miseAJour: string[] = [];
    const parametres: unknown[] = [];
    for (const [cle, valeur] of Object.entries(champs)) {
      if (valeur === undefined) continue;
      miseAJour.push(`${colonnes[cle]} = ?`);
      parametres.push(valeur);
    }

    // Nouvelle miniature envoyée, ou demande de suppression de l'actuelle
    let ancienneMiniatureASupprimer: string | null = null;
    if (nouvelleMiniature) {
      if (!nouvelleMiniature.mimetype.startsWith('image/')) {
        throw new ErreurHttp(400, 'La miniature doit être une image.');
      }
      miseAJour.push('miniature = ?');
      parametres.push(await rangerFichier(nouvelleMiniature.path, 'miniatures'));
      ancienneMiniatureASupprimer = actuel.miniature;
    } else if (corps.supprimerMiniature === '1' || corps.supprimerMiniature === true) {
      miseAJour.push('miniature = NULL');
      ancienneMiniatureASupprimer = actuel.miniature;
    }

    if (miseAJour.length > 0) {
      await executer(`UPDATE medias SET ${miseAJour.join(', ')} WHERE id = ?`, [...parametres, id]);
    }
    await supprimerFichier(ancienneMiniatureASupprimer);

    res.json(await trouverMedia(id));
  } catch (erreur) {
    await supprimerFichier(nouvelleMiniature?.path);
    throw erreur;
  }
});

// ─── POST /api/medias/:id/favori : ajoute / retire des favoris ────────────────

router.post('/:id/favori', async (req, res) => {
  const id = lireId(req.params.id);
  const { lignesModifiees } = await executer('UPDATE medias SET favori = NOT favori WHERE id = ?', [
    id,
  ]);
  if (lignesModifiees === 0) throw new ErreurHttp(404, 'Média introuvable.');
  res.json(await trouverMedia(id));
});

// ─── POST /api/medias/:id/vue : compte une lecture ────────────────────────────

router.post('/:id/vue', async (req, res) => {
  const id = lireId(req.params.id);
  await executer('UPDATE medias SET vues = vues + 1, derniere_lecture = NOW() WHERE id = ?', [id]);
  res.status(204).end();
});

// ─── GET /api/medias/:id/fichier : lecture en streaming / téléchargement ──────
// res.sendFile gère automatiquement les requêtes "Range" : le navigateur peut
// avancer dans une vidéo sans télécharger tout le fichier.

router.get('/:id/fichier', async (req, res) => {
  const id = lireId(req.params.id);
  const media = await selectionnerUn<{ fichier: string; mime: string; nom_original: string }>(
    'SELECT fichier, mime, nom_original FROM medias WHERE id = ?',
    [id],
  );
  if (!media) throw new ErreurHttp(404, 'Média introuvable.');

  const chemin = cheminAbsolu(media.fichier);

  if (req.query.telecharger) {
    res.download(chemin, media.nom_original);
    return;
  }

  const entetes: Record<string, string> = { 'Content-Type': media.mime };
  // Sécurité : une page HTML ou un SVG envoyé comme document ne doit pas
  // pouvoir exécuter de JavaScript dans l'application.
  if (/html|svg|xml/.test(media.mime)) entetes['Content-Security-Policy'] = 'sandbox';

  res.sendFile(chemin, { headers: entetes });
});

// ─── GET /api/medias/:id/miniature ────────────────────────────────────────────

router.get('/:id/miniature', async (req, res) => {
  const id = lireId(req.params.id);
  const media = await selectionnerUn<{ miniature: string | null }>(
    'SELECT miniature FROM medias WHERE id = ?',
    [id],
  );
  if (!media?.miniature) throw new ErreurHttp(404, 'Aucune miniature.');

  // Si l'URL contient "?v=..." (qui change à chaque modification), le
  // navigateur peut garder l'image en cache très longtemps.
  const versionnee = Boolean(req.query.v);
  res.sendFile(cheminAbsolu(media.miniature), {
    maxAge: versionnee ? '365d' : 0,
    immutable: versionnee,
  });
});

// ─── DELETE /api/medias/:id : supprime le média ET ses fichiers ───────────────

router.delete('/:id', async (req, res) => {
  const id = lireId(req.params.id);
  const media = await selectionnerUn<{ fichier: string; miniature: string | null }>(
    'SELECT fichier, miniature FROM medias WHERE id = ?',
    [id],
  );
  if (!media) throw new ErreurHttp(404, 'Média introuvable.');

  await executer('DELETE FROM medias WHERE id = ?', [id]);
  await supprimerFichier(media.fichier);
  await supprimerFichier(media.miniature);

  res.status(204).end();
});

export default router;
