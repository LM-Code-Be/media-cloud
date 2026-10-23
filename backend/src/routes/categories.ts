// =============================================================================
//  Routes /api/categories
// =============================================================================
import { Router } from 'express';
import { z } from 'zod';
import { executer, selectionner, selectionnerUn } from '../db/connexion.js';
import { ErreurHttp } from '../middleware/erreurs.js';
import { TYPES_MEDIA } from '../utils/types.js';
import { lireId } from '../utils/validation.js';

const router = Router();

const CategorieSchema = z.object({
  type: z.enum(TYPES_MEDIA),
  nom: z.string().trim().min(1, 'Le nom est obligatoire').max(100),
});

// Requête commune : la catégorie + le nombre de médias qu'elle contient
const SELECT_CATEGORIE = `
  SELECT c.id, c.type, c.nom, c.cree_le AS creeLe, COUNT(m.id) AS nombreMedias
  FROM categories c
  LEFT JOIN medias m ON m.categorie_id = c.id
`;

async function trouverCategorie(id: number) {
  const categorie = await selectionnerUn(`${SELECT_CATEGORIE} WHERE c.id = ? GROUP BY c.id`, [id]);
  if (!categorie) throw new ErreurHttp(404, 'Catégorie introuvable.');
  return categorie;
}

// ─── GET /api/categories?type=film ────────────────────────────────────────────

router.get('/', async (req, res) => {
  const type = z.enum(TYPES_MEDIA).optional().parse(req.query.type);
  const categories = type
    ? await selectionner(`${SELECT_CATEGORIE} WHERE c.type = ? GROUP BY c.id ORDER BY c.nom`, [
        type,
      ])
    : await selectionner(`${SELECT_CATEGORIE} GROUP BY c.id ORDER BY c.type, c.nom`);
  res.json(categories);
});

// ─── POST /api/categories ─────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { type, nom } = CategorieSchema.parse(req.body);
  const { idInsere } = await executer('INSERT INTO categories (type, nom) VALUES (?, ?)', [
    type,
    nom,
  ]);
  res.status(201).json(await trouverCategorie(idInsere));
});

// ─── PUT /api/categories/:id : renommer ───────────────────────────────────────

router.put('/:id', async (req, res) => {
  const id = lireId(req.params.id);
  const { nom } = CategorieSchema.pick({ nom: true }).parse(req.body);
  const { lignesModifiees } = await executer('UPDATE categories SET nom = ? WHERE id = ?', [
    nom,
    id,
  ]);
  if (lignesModifiees === 0) throw new ErreurHttp(404, 'Catégorie introuvable.');
  res.json(await trouverCategorie(id));
});

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────
// Les médias de cette catégorie sont conservés (ON DELETE SET NULL).

router.delete('/:id', async (req, res) => {
  const id = lireId(req.params.id);
  const { lignesModifiees } = await executer('DELETE FROM categories WHERE id = ?', [id]);
  if (lignesModifiees === 0) throw new ErreurHttp(404, 'Catégorie introuvable.');
  res.status(204).end();
});

export default router;
