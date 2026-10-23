// =============================================================================
//  Petites fonctions utilitaires (formatage, classes CSS…)
// =============================================================================
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combine des classes Tailwind proprement (gère les conflits). */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}

/** 1536000 → "1,5 Mo" */
export function formaterTaille(octets: number): string {
  if (!octets) return '0 o';
  const unites = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.min(Math.floor(Math.log(octets) / Math.log(1024)), unites.length - 1);
  const valeur = octets / 1024 ** i;
  return `${valeur.toLocaleString('fr-FR', { maximumFractionDigits: valeur < 10 && i > 0 ? 1 : 0 })} ${unites[i]}`;
}

/** 3725 → "1:02:05" ; 125 → "2:05" */
export function formaterDuree(secondes: number | null | undefined): string {
  if (secondes == null || !Number.isFinite(secondes)) return '0:00';
  const total = Math.max(0, Math.floor(secondes));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const deuxChiffres = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${deuxChiffres(m)}:${deuxChiffres(s)}` : `${m}:${deuxChiffres(s)}`;
}

/** 7380 → "2 h 03" ; 1500 → "25 min" */
export function formaterDureeLongue(secondes: number | null | undefined): string {
  if (!secondes) return '';
  if (secondes < 60) return `${Math.round(secondes)} s`;
  const h = Math.floor(secondes / 3600);
  const m = Math.round((secondes % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h} h ${m.toString().padStart(2, '0')}`;
}

/** Date lisible : "12 mars 2025" */
export function formaterDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Date relative : "il y a 3 jours" */
export function formaterDateRelative(date: string): string {
  const secondes = (Date.now() - new Date(date).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  if (secondes < 60) return 'à l’instant';
  if (secondes < 3600) return rtf.format(-Math.floor(secondes / 60), 'minute');
  if (secondes < 86400) return rtf.format(-Math.floor(secondes / 3600), 'hour');
  if (secondes < 86400 * 30) return rtf.format(-Math.floor(secondes / 86400), 'day');
  return formaterDate(date);
}

/** Pourcentage de lecture d'un média (0 à 100). */
export function pourcentage(position: number, duree: number): number {
  return duree > 0 ? Math.min(100, (position / duree) * 100) : 0;
}

/** "Mon.Film.2019.1080p.mkv" → "Mon Film 2019 1080p" */
export function titreDepuisNomFichier(nom: string): string {
  return nom
    .replace(/\.[^.]+$/, '') // retire l'extension
    .replace(/[._]+/g, ' ') // points et underscores → espaces
    .replace(/\s+/g, ' ')
    .trim();
}

/** Détecte "S01E05" (ou "1x05") dans un nom de fichier de série. */
export function detecterEpisode(nom: string): { saison: number; episode: number } | null {
  const resultat = /s(\d{1,2})[ ._-]?e(\d{1,3})/i.exec(nom) ?? /(\d{1,2})x(\d{2,3})/i.exec(nom);
  return resultat ? { saison: Number(resultat[1]), episode: Number(resultat[2]) } : null;
}

/** Extension d'un fichier en majuscules : "rapport.pdf" → "PDF" */
export function extension(nom: string): string {
  return nom.includes('.') ? nom.split('.').pop()!.toUpperCase() : '';
}

/** Mélange une liste (lecture aléatoire). */
export function melanger<T>(liste: T[]): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}
