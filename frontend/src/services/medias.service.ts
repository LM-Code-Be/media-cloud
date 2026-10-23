// =============================================================================
//  Appels à l'API pour les médias (/api/medias) et la progression de lecture
// =============================================================================
import { api, envoyerAvecProgression } from './api';
import type { ChampsMedia, FiltresMedias, Media, Serie, TypeMedia } from '@/types';

/** Transforme les filtres en "?type=film&tri=titre…" */
function versParametres(filtres: FiltresMedias): string {
  const parametres = new URLSearchParams();
  if (filtres.type) parametres.set('type', ([] as TypeMedia[]).concat(filtres.type).join(','));
  if (filtres.categorie) parametres.set('categorie', String(filtres.categorie));
  if (filtres.q) parametres.set('q', filtres.q);
  if (filtres.favori) parametres.set('favori', '1');
  if (filtres.serie) parametres.set('serie', filtres.serie);
  if (filtres.enCours) parametres.set('enCours', '1');
  if (filtres.tri) parametres.set('tri', filtres.tri);
  if (filtres.limite) parametres.set('limite', String(filtres.limite));
  const texte = parametres.toString();
  return texte ? `?${texte}` : '';
}

/** Données nécessaires pour envoyer un nouveau fichier. */
export interface NouvelEnvoi extends ChampsMedia {
  type: TypeMedia;
  fichier: File;
  miniature?: Blob | null;
}

export const mediasService = {
  lister: (filtres: FiltresMedias = {}) =>
    api.get<Media[]>(`/api/medias${versParametres(filtres)}`),

  obtenir: (id: number) => api.get<Media>(`/api/medias/${id}`),

  series: () => api.get<Serie[]>('/api/medias/series'),

  /** Envoie un fichier avec ses informations (formulaire multipart). */
  envoyer: (envoi: NouvelEnvoi, surProgression: (p: number) => void, signal?: AbortSignal) => {
    const { fichier, miniature, ...champs } = envoi;
    const donnees = new FormData();
    // Les champs texte AVANT le fichier
    for (const [cle, valeur] of Object.entries(champs)) {
      if (valeur !== null && valeur !== undefined && valeur !== '')
        donnees.append(cle, String(valeur));
    }
    if (miniature) donnees.append('miniature', miniature, 'miniature.jpg');
    donnees.append('fichier', fichier, fichier.name);
    return envoyerAvecProgression<Media>('/api/medias', donnees, surProgression, signal);
  },

  /** Modifie les informations (et éventuellement la miniature). */
  modifier: (
    id: number,
    champs: ChampsMedia,
    miniature?: File | null,
    supprimerMiniature = false,
  ) => {
    if (!miniature && !supprimerMiniature) return api.put<Media>(`/api/medias/${id}`, champs);
    const donnees = new FormData();
    for (const [cle, valeur] of Object.entries(champs)) {
      if (valeur !== undefined) donnees.append(cle, valeur === null ? '' : String(valeur)); // "" = effacer
    }
    if (miniature) donnees.append('miniature', miniature);
    if (supprimerMiniature) donnees.append('supprimerMiniature', '1');
    return api.formulaire<Media>(`/api/medias/${id}`, 'PUT', donnees);
  },

  basculerFavori: (id: number) => api.post<Media>(`/api/medias/${id}/favori`),

  compterVue: (id: number) => api.post<void>(`/api/medias/${id}/vue`),

  supprimer: (id: number) => api.delete(`/api/medias/${id}`),

  // ─── Progression de lecture ───────────────────────────────────────────────

  sauverProgression: (id: number, position: number, duree: number) =>
    api.put(`/api/progressions/${id}`, { position, duree }),

  /**
   * Version "keepalive" : la requête part même si on quitte la page
   * (utile quand on ferme le lecteur vidéo).
   */
  sauverProgressionAuDepart: (id: number, position: number, duree: number) => {
    void fetch(`/api/progressions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, duree }),
      keepalive: true,
    }).catch(() => undefined);
  },

  effacerProgression: (id: number) => api.delete(`/api/progressions/${id}`),
};
