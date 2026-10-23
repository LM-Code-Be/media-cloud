// =============================================================================
//  Types TypeScript partagés par tout le frontend.
//  Ils correspondent exactement aux réponses JSON du backend.
// =============================================================================

export type TypeMedia = 'film' | 'serie' | 'video' | 'musique' | 'photo' | 'document';

/** Position de lecture sauvegardée. */
export interface Progression {
  position: number; // secondes
  duree: number; // secondes
  termine: boolean;
}

export interface Media {
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
  taille: number; // octets
  duree: number | null; // secondes
  favori: boolean;
  vues: number;
  derniereLecture: string | null;
  ajouteLe: string;
  modifieLe: string;
  urlFichier: string;
  urlTelechargement: string;
  urlMiniature: string | null;
  progression: Progression | null;
}

export interface Categorie {
  id: number;
  type: TypeMedia;
  nom: string;
  nombreMedias: number;
  creeLe: string;
}

/** Une série = un regroupement d'épisodes portant le même nom. */
export interface Serie {
  nom: string;
  nombreEpisodes: number;
  nombreSaisons: number;
  annee: number | null;
  vues: number;
  ajouteLe: string;
  urlMiniature: string | null;
}

export interface Playlist {
  id: number;
  nom: string;
  description: string | null;
  nombreMedias: number;
  duree: number;
  urlMiniature: string | null;
  creeLe: string;
}

export interface PlaylistDetaillee extends Playlist {
  medias: Media[];
}

export interface Stats {
  parType: Record<TypeMedia, { nombre: number; taille: number }>;
  nombreTotal: number;
  tailleTotale: number;
  favoris: number;
  vues: number;
  dureeTotale: number;
  disque: { total: number; libre: number };
}

/** Filtres acceptés par GET /api/medias */
export interface FiltresMedias {
  type?: TypeMedia | TypeMedia[];
  categorie?: number | null;
  q?: string;
  favori?: boolean;
  serie?: string;
  enCours?: boolean;
  tri?:
    'recent' | 'ancien' | 'titre' | 'annee' | 'vues' | 'taille' | 'episode' | 'artiste' | 'lecture';
  limite?: number;
}

/** Champs modifiables d'un média. */
export type ChampsMedia = Partial<
  Pick<
    Media,
    | 'titre'
    | 'description'
    | 'categorieId'
    | 'annee'
    | 'artiste'
    | 'album'
    | 'serie'
    | 'saison'
    | 'episode'
    | 'duree'
  >
>;
