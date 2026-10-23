// =============================================================================
//  Appels à l'API pour les playlists (/api/playlists) et les statistiques
// =============================================================================
import { api } from './api';
import type { Playlist, PlaylistDetaillee, Stats } from '@/types';

export const playlistsService = {
  lister: () => api.get<Playlist[]>('/api/playlists'),
  obtenir: (id: number) => api.get<PlaylistDetaillee>(`/api/playlists/${id}`),
  creer: (nom: string, description?: string) =>
    api.post<Playlist>('/api/playlists', { nom, description }),
  modifier: (id: number, nom: string, description?: string | null) =>
    api.put<Playlist>(`/api/playlists/${id}`, { nom, description }),
  supprimer: (id: number) => api.delete(`/api/playlists/${id}`),
  ajouterMedia: (id: number, mediaId: number) =>
    api.post<Playlist>(`/api/playlists/${id}/medias`, { mediaId }),
  retirerMedia: (id: number, mediaId: number) =>
    api.delete(`/api/playlists/${id}/medias/${mediaId}`),
};

export const statsService = {
  obtenir: () => api.get<Stats>('/api/stats'),
};
