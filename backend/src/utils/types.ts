// =============================================================================
//  Types partagés + conversion "ligne SQL" → "objet JSON" envoyé au frontend
// =============================================================================

/** Les 6 types de médias gérés par l'application. */
export const TYPES_MEDIA = ['film', 'serie', 'video', 'musique', 'photo', 'document'] as const;
export type TypeMedia = (typeof TYPES_MEDIA)[number];

/** Types qui se lisent dans le lecteur vidéo. */
export const TYPES_VIDEO: TypeMedia[] = ['film', 'serie', 'video'];

/**
 * Vérifie qu'un fichier correspond bien au type choisi.
 * On regarde le type MIME envoyé par le navigateur ET l'extension,
 * car certains formats (.mkv…) n'ont pas toujours de MIME reconnu.
 */
export function fichierCompatible(type: TypeMedia, mime: string, nom: string): boolean {
  const extension = nom.split('.').pop()?.toLowerCase() ?? '';
  switch (type) {
    case 'film':
    case 'serie':
    case 'video':
      return (
        mime.startsWith('video/') || ['mkv', 'avi', 'mov', 'm4v', 'wmv', 'ts'].includes(extension)
      );
    case 'musique':
      return (
        mime.startsWith('audio/') ||
        ['mp3', 'flac', 'm4a', 'ogg', 'wav', 'aac', 'opus'].includes(extension)
      );
    case 'photo':
      return mime.startsWith('image/');
    case 'document':
      return true; // tous les fichiers sont acceptés comme documents
  }
}

/** Une ligne telle que renvoyée par la requête SQL `SELECT_MEDIA`. */
export interface LigneMedia {
  id: number;
  type: TypeMedia;
  titre: string;
  description: string | null;
  categorieId: number | null;
  categorieNom: string | null;
  annee: number | null;
  artiste: string | null;
  album: string | null;
  serie: string | null;
  saison: number | null;
  episode: number | null;
  nomOriginal: string;
  mime: string;
  taille: number;
  duree: number | null;
  miniature: string | null;
  favori: number;
  vues: number;
  derniereLecture: Date | null;
  ajouteLe: Date;
  modifieLe: Date;
  progressionPosition: number | null;
  progressionDuree: number | null;
  progressionTermine: number | null;
}

/**
 * Requête de base pour lire des médias, avec le nom de la catégorie et la
 * progression de lecture. Les colonnes sont renommées (AS) en camelCase.
 * On ajoute ensuite WHERE / ORDER BY selon les besoins.
 */
export const SELECT_MEDIA = `
  SELECT
    m.id, m.type, m.titre, m.description,
    m.categorie_id      AS categorieId,
    c.nom               AS categorieNom,
    m.annee, m.artiste, m.album, m.serie, m.saison, m.episode,
    m.nom_original      AS nomOriginal,
    m.mime, m.taille, m.duree, m.miniature, m.favori, m.vues,
    m.derniere_lecture  AS derniereLecture,
    m.ajoute_le         AS ajouteLe,
    m.modifie_le        AS modifieLe,
    p.position          AS progressionPosition,
    p.duree             AS progressionDuree,
    p.termine           AS progressionTermine
  FROM medias m
  LEFT JOIN categories c   ON c.id = m.categorie_id
  LEFT JOIN progressions p ON p.media_id = m.id
`;

/** Transforme une ligne SQL en objet propre pour le frontend. */
export function formaterMedia(ligne: LigneMedia) {
  const { miniature, progressionPosition, progressionDuree, progressionTermine, ...reste } = ligne;
  const version = new Date(ligne.modifieLe).getTime(); // évite le cache navigateur après modification

  return {
    ...reste,
    favori: ligne.favori === 1,
    // URLs utilisées directement par les balises <video>, <img>, <a download>
    urlFichier: `/api/medias/${ligne.id}/fichier`,
    urlTelechargement: `/api/medias/${ligne.id}/fichier?telecharger=1`,
    urlMiniature: miniature ? `/api/medias/${ligne.id}/miniature?v=${version}` : null,
    progression:
      progressionPosition !== null
        ? {
            position: progressionPosition,
            duree: progressionDuree ?? 0,
            termine: progressionTermine === 1,
          }
        : null,
  };
}

export type Media = ReturnType<typeof formaterMedia>;
