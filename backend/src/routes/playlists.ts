// =============================================================================
//  Routes /api/playlists
// =============================================================================
import { Router } from 'express';
import { z } from 'zod';
import { executer, selectionner, selectionnerUn } from '../db/connexion.js';
import { ErreurHttp } from '../middleware/erreurs.js';
import { SELECT_MEDIA, formaterMedia, type LigneMedia } from '../utils/types.js';
import { lireId, texteOptionnel } from '../utils/validation.js';

const router = Router();

const PlaylistSchema = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire').max(100),
  description: texteOptionnel(500).optional(),
});

interface LignePlaylist {
  id: number;
  nom: string;
  description: string | null;
  nombreMedias: number;
  duree: number;
  idMiniature: string | null;
  creeLe: Date;
}

// Playlist + nombre de médias + durée totale + id d'un média ayant une miniature
const SELECT_PLAYLIST = `
  SELECT
    pl.id, pl.nom, pl.description, pl.cree_le AS creeLe,
    COUNT(m.id)                 AS nombreMedias,
    COALESCE(SUM(m.duree), 0)   AS duree,
    SUBSTRING_INDEX(
      GROUP_CONCAT(CASE WHEN m.miniature IS NOT NULL THEN m.id END ORDER BY pm.position),
      ',', 1
    )                           AS idMiniature
  FROM playlists pl
  LEFT JOIN playlist_medias pm ON pm.playlist_id = pl.id
  LEFT JOIN medias m           ON m.id = pm.media_id
`;

function formaterPlaylist({ idMiniature, ...playlist }: LignePlaylist) {
  return { ...playlist, urlMiniature: idMiniature ? `/api/medias/${idMiniature}/miniature` : null };
}

async function trouverPlaylist(id: number) {
  const ligne = await selectionnerUn<LignePlaylist>(
    `${SELECT_PLAYLIST} WHERE pl.id = ? GROUP BY pl.id`,
    [id],
  );
  if (!ligne) throw new ErreurHttp(404, 'Playlist introuvable.');
  return formaterPlaylist(ligne);
}

// ─── GET /api/playlists ───────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  const lignes = await selectionner<LignePlaylist>(
    `${SELECT_PLAYLIST} GROUP BY pl.id ORDER BY pl.modifie_le DESC`,
  );
  res.json(lignes.map(formaterPlaylist));
});

// ─── GET /api/playlists/:id : la playlist avec ses médias dans l'ordre ────────

router.get('/:id', async (req, res) => {
  const id = lireId(req.params.id);
  const playlist = await trouverPlaylist(id);
  const medias = await selectionner<LigneMedia>(
    `${SELECT_MEDIA}
     JOIN playlist_medias pm ON pm.media_id = m.id
     WHERE pm.playlist_id = ?
     ORDER BY pm.position, pm.ajoute_le`,
    [id],
  );
  res.json({ ...playlist, medias: medias.map(formaterMedia) });
});

// ─── POST /api/playlists ──────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { nom, description } = PlaylistSchema.parse(req.body);
  const { idInsere } = await executer('INSERT INTO playlists (nom, description) VALUES (?, ?)', [
    nom,
    description ?? null,
  ]);
  res.status(201).json(await trouverPlaylist(idInsere));
});

// ─── PUT /api/playlists/:id ───────────────────────────────────────────────────

router.put('/:id', async (req, res) => {
  const id = lireId(req.params.id);
  const { nom, description } = PlaylistSchema.parse(req.body);
  const { lignesModifiees } = await executer(
    'UPDATE playlists SET nom = ?, description = ? WHERE id = ?',
    [nom, description ?? null, id],
  );
  if (lignesModifiees === 0) throw new ErreurHttp(404, 'Playlist introuvable.');
  res.json(await trouverPlaylist(id));
});

// ─── DELETE /api/playlists/:id (les médias ne sont pas supprimés) ─────────────

router.delete('/:id', async (req, res) => {
  const { lignesModifiees } = await executer('DELETE FROM playlists WHERE id = ?', [
    lireId(req.params.id),
  ]);
  if (lignesModifiees === 0) throw new ErreurHttp(404, 'Playlist introuvable.');
  res.status(204).end();
});

// ─── POST /api/playlists/:id/medias : ajoute un média à la fin ────────────────

router.post('/:id/medias', async (req, res) => {
  const id = lireId(req.params.id);
  const mediaId = lireId(req.body?.mediaId);

  // INSERT IGNORE : si le média est déjà dans la playlist, rien ne se passe
  await executer(
    `INSERT IGNORE INTO playlist_medias (playlist_id, media_id, position)
     SELECT ?, ?, COALESCE(MAX(position), 0) + 1 FROM playlist_medias WHERE playlist_id = ?`,
    [id, mediaId, id],
  );
  await executer('UPDATE playlists SET modifie_le = NOW() WHERE id = ?', [id]);
  res.json(await trouverPlaylist(id));
});

// ─── DELETE /api/playlists/:id/medias/:mediaId ────────────────────────────────

router.delete('/:id/medias/:mediaId', async (req, res) => {
  const id = lireId(req.params.id);
  await executer('DELETE FROM playlist_medias WHERE playlist_id = ? AND media_id = ?', [
    id,
    lireId(req.params.mediaId),
  ]);
  res.json(await trouverPlaylist(id));
});

export default router;
