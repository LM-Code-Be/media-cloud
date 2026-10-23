// =============================================================================
//  Appels à l'API pour les catégories (/api/categories)
// =============================================================================
import { api } from './api';
import type { Categorie, TypeMedia } from '@/types';

export const categoriesService = {
  lister: () => api.get<Categorie[]>('/api/categories'),
  creer: (type: TypeMedia, nom: string) => api.post<Categorie>('/api/categories', { type, nom }),
  renommer: (id: number, nom: string) => api.put<Categorie>(`/api/categories/${id}`, { nom }),
  supprimer: (id: number) => api.delete(`/api/categories/${id}`),
};
