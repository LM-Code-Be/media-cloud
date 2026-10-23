// =============================================================================
//  Gestion centralisée des erreurs
//  Toute erreur levée dans une route arrive ici et est transformée en une
//  réponse JSON claire, en français : { erreur: "..." }
// =============================================================================
import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';

/** Erreur "métier" avec un code HTTP (404, 400…). */
export class ErreurHttp extends Error {
  constructor(
    public readonly statut: number,
    message: string,
  ) {
    super(message);
  }
}

export const gestionnaireErreurs: ErrorRequestHandler = (err, _req, res, _next) => {
  // Erreur prévue par notre code
  if (err instanceof ErreurHttp) {
    res.status(err.statut).json({ erreur: err.message });
    return;
  }

  // Données invalides (validation Zod)
  if (err instanceof ZodError) {
    const premier = err.issues[0];
    res.status(400).json({
      erreur: `Donnée invalide : ${premier.path.join('.') || 'requête'} (${premier.message})`,
    });
    return;
  }

  // Erreur pendant l'envoi d'un fichier
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Le fichier est trop volumineux.'
        : `Erreur d’envoi : ${err.message}`;
    res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ erreur: message });
    return;
  }

  // Erreurs MySQL courantes
  const code = (err as { code?: string }).code;
  if (code === 'ER_DUP_ENTRY') {
    res.status(409).json({ erreur: 'Cet élément existe déjà.' });
    return;
  }
  if (code === 'ER_NO_REFERENCED_ROW_2') {
    res.status(400).json({ erreur: 'Élément lié introuvable (catégorie ou média).' });
    return;
  }
  if (code === 'ECONNREFUSED') {
    res.status(503).json({ erreur: 'Base de données injoignable. WAMP / MySQL est-il démarré ?' });
    return;
  }

  // Erreur inattendue
  console.error('[erreur]', err);
  res.status(500).json({ erreur: 'Erreur interne du serveur.' });
};
