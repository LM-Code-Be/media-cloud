// =============================================================================
//  Routes /api/progressions
//  Sauvegarde de la position de lecture ("reprendre où je me suis arrêté").
// =============================================================================
import { Router } from 'express';
import { z } from 'zod';
import { executer } from '../db/connexion.js';
import { lireId } from '../utils/validation.js';

const router = Router();

const ProgressionSchema = z.object({
  position: z.number().nonnegative(),
  duree: z.number().nonnegative(),
});

// ─── PUT /api/progressions/:mediaId ───────────────────────────────────────────
// Crée la ligne si elle n'existe pas, sinon la met à jour ("upsert").

router.put('/:mediaId', async (req, res) => {
  const mediaId = lireId(req.params.mediaId);
  const { position, duree } = ProgressionSchema.parse(req.body);

  // Considéré comme "terminé" au-delà de 95 % (générique de fin…)
  const termine = duree > 0 && position / duree >= 0.95 ? 1 : 0;

  await executer(
    `INSERT INTO progressions (media_id, position, duree, termine)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE position = ?, duree = ?, termine = ?`,
    [mediaId, position, duree, termine, position, duree, termine],
  );

  // On profite de la sauvegarde pour enregistrer la durée réelle du média
  if (duree > 0) {
    await executer('UPDATE medias SET duree = ? WHERE id = ? AND duree IS NULL', [
      Math.round(duree),
      mediaId,
    ]);
  }

  res.json({ position, duree, termine: termine === 1 });
});

// ─── DELETE /api/progressions/:mediaId : "marquer comme non vu" ───────────────

router.delete('/:mediaId', async (req, res) => {
  await executer('DELETE FROM progressions WHERE media_id = ?', [lireId(req.params.mediaId)]);
  res.status(204).end();
});

export default router;
