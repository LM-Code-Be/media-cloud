// =============================================================================
//  Configuration de chaque type de média : libellés, icône, couleur, page…
//  Centraliser ces infos ici évite de les répéter dans chaque composant.
// =============================================================================
import { Clapperboard, FileText, Film, Image, type LucideIcon, Music, Tv } from 'lucide-react';
import type { Media, TypeMedia } from '@/types';

interface ConfigType {
  libelle: string; // "Films"
  singulier: string; // "film"
  avecArticle: string; // "un film"
  icone: LucideIcon;
  couleur: string; // classe Tailwind de la couleur du texte
  fond: string; // classe Tailwind du fond coloré (léger)
  plein: string; // classe Tailwind du fond coloré (plein)
  chemin: string; // URL de la page
  accepte: string; // attribut "accept" du champ fichier
}

export const TYPES: Record<TypeMedia, ConfigType> = {
  film: {
    libelle: 'Films',
    singulier: 'film',
    avecArticle: 'un film',
    icone: Film,
    couleur: 'text-sky-500',
    fond: 'bg-sky-500/15',
    plein: 'bg-sky-400',
    chemin: '/films',
    accepte: 'video/*,.mkv,.avi,.mov,.m4v,.wmv',
  },
  serie: {
    libelle: 'Séries',
    singulier: 'épisode',
    avecArticle: 'un épisode',
    icone: Tv,
    couleur: 'text-violet-500',
    fond: 'bg-violet-500/15',
    plein: 'bg-violet-400',
    chemin: '/series',
    accepte: 'video/*,.mkv,.avi,.mov,.m4v,.wmv',
  },
  video: {
    libelle: 'Vidéos',
    singulier: 'vidéo',
    avecArticle: 'une vidéo',
    icone: Clapperboard,
    couleur: 'text-rose-500',
    fond: 'bg-rose-500/15',
    plein: 'bg-rose-400',
    chemin: '/videos',
    accepte: 'video/*,.mkv,.avi,.mov,.m4v,.wmv',
  },
  musique: {
    libelle: 'Musique',
    singulier: 'titre',
    avecArticle: 'de la musique',
    icone: Music,
    couleur: 'text-emerald-500',
    fond: 'bg-emerald-500/15',
    plein: 'bg-emerald-400',
    chemin: '/musique',
    accepte: 'audio/*,.flac,.m4a,.opus',
  },
  photo: {
    libelle: 'Photos',
    singulier: 'photo',
    avecArticle: 'des photos',
    icone: Image,
    couleur: 'text-amber-500',
    fond: 'bg-amber-500/15',
    plein: 'bg-amber-400',
    chemin: '/photos',
    accepte: 'image/*',
  },
  document: {
    libelle: 'Documents',
    singulier: 'document',
    avecArticle: 'des documents',
    icone: FileText,
    couleur: 'text-orange-500',
    fond: 'bg-orange-500/15',
    plein: 'bg-orange-400',
    chemin: '/documents',
    accepte: '*',
  },
};

export const LISTE_TYPES = Object.keys(TYPES) as TypeMedia[];

/** Types lus dans le lecteur vidéo. */
export const TYPES_VIDEO: TypeMedia[] = ['film', 'serie', 'video'];

export const estVideo = (type: TypeMedia): boolean => TYPES_VIDEO.includes(type);

/** Devine le type de média à partir d'un fichier choisi. */
export function deviner(fichier: File): TypeMedia {
  const ext = fichier.name.split('.').pop()?.toLowerCase() ?? '';
  if (fichier.type.startsWith('video/') || ['mkv', 'avi', 'mov', 'm4v', 'wmv'].includes(ext))
    return 'video';
  if (fichier.type.startsWith('audio/') || ['flac', 'm4a', 'opus'].includes(ext)) return 'musique';
  if (fichier.type.startsWith('image/')) return 'photo';
  return 'document';
}

/** Sous-titre d'un média : "S01 · E03", "Artiste — Album", "2019"… */
export function sousTitre(media: Media): string {
  if (media.type === 'serie') {
    const numero =
      media.saison != null && media.episode != null
        ? `S${String(media.saison).padStart(2, '0')} · E${String(media.episode).padStart(2, '0')}`
        : null;
    return [media.serie, numero].filter(Boolean).join(' · ');
  }
  if (media.type === 'musique') return [media.artiste, media.album].filter(Boolean).join(' — ');
  return [media.annee, media.categorieNom].filter(Boolean).join(' · ');
}

/** Lien vers la page qui affiche le mieux un média. */
export function lienMedia(media: Media): string {
  if (media.type === 'serie' && media.serie) return `/series/${encodeURIComponent(media.serie)}`;
  return `/media/${media.id}`;
}
