// =============================================================================
//  Petits outils de validation (bibliothèque Zod)
//  Les formulaires envoient souvent des textes vides "" : on les convertit
//  en null pour les enregistrer proprement en base.
// =============================================================================
import { z } from 'zod';

/** Convertit "", "null" et undefined en null. */
const videVersNull = (valeur: unknown) =>
  valeur === '' || valeur === 'null' || valeur === undefined ? null : valeur;

/** Texte facultatif (ex : artiste). "" devient null. */
export const texteOptionnel = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.preprocess(videVersNull, z.string().max(max).nullable()),
  );

/** Nombre entier facultatif (ex : année, saison). "" devient null. */
export const entierOptionnel = (min = 0, max = 4_294_967_295) =>
  z.preprocess(videVersNull, z.coerce.number().int().min(min).max(max).nullable());

/** Identifiant présent dans l'URL (ex : /api/medias/12). */
export const lireId = (valeur: unknown): number => z.coerce.number().int().positive().parse(valeur);
