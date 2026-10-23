// =============================================================================
//  Route /api/stats : chiffres du tableau de bord
// =============================================================================
import { Router } from 'express';
import { selectionner, selectionnerUn } from '../db/connexion.js';
import { espaceDisque } from '../stockage.js';
import { TYPES_MEDIA, type TypeMedia } from '../utils/types.js';

const router = Router();

router.get('/', async (_req, res) => {
  // Nombre de fichiers et place occupée, par type
  const lignes = await selectionner<{ type: TypeMedia; nombre: number; taille: number }>(
    'SELECT type, COUNT(*) AS nombre, COALESCE(SUM(taille), 0) AS taille FROM medias GROUP BY type',
  );

  // On part de 0 pour chaque type, puis on remplit avec les résultats SQL
  const parType = Object.fromEntries(
    TYPES_MEDIA.map((type) => [type, { nombre: 0, taille: 0 }]),
  ) as Record<TypeMedia, { nombre: number; taille: number }>;
  for (const ligne of lignes) parType[ligne.type] = { nombre: ligne.nombre, taille: ligne.taille };

  const totaux = await selectionnerUn<{ favoris: number; vues: number; duree: number }>(
    `SELECT
       COALESCE(SUM(favori), 0) AS favoris,
       COALESCE(SUM(vues), 0)   AS vues,
       COALESCE(SUM(duree), 0)  AS duree
     FROM medias`,
  );

  res.json({
    parType,
    nombreTotal: lignes.reduce((total, l) => total + l.nombre, 0),
    tailleTotale: lignes.reduce((total, l) => total + l.taille, 0),
    favoris: totaux?.favoris ?? 0,
    vues: totaux?.vues ?? 0,
    dureeTotale: totaux?.duree ?? 0,
    disque: await espaceDisque(),
  });
});

export default router;
