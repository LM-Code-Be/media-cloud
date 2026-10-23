// =============================================================================
//  Contexte "Bibliothèque" : données et actions partagées par toutes les pages
//    - catégories et statistiques
//    - "version" : un compteur qui augmente après chaque modification, pour
//      que les pages rechargent automatiquement leurs données
//    - ouverture des fenêtres (envoi, modification, playlist, aperçu,
//      confirmation)
//    - actions rapides sur un média (favori, suppression)
// =============================================================================
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { categoriesService } from '@/services/categories.service';
import { mediasService } from '@/services/medias.service';
import { statsService } from '@/services/playlists.service';
import type { Categorie, Media, Stats, TypeMedia } from '@/types';

/** Valeurs pré-remplies dans la fenêtre d'envoi (ex : nom de la série). */
export interface PreRemplissage {
  type?: TypeMedia;
  serie?: string;
  saison?: number;
  categorieId?: number;
  fichiers?: File[]; // fichiers déposés par glisser-déposer
}

export interface DemandeConfirmation {
  titre: string;
  message: string;
  bouton?: string;
  danger?: boolean;
}

interface ValeurBibliotheque {
  categories: Categorie[];
  categoriesDuType: (type: TypeMedia) => Categorie[];
  stats: Stats | null;
  version: number;
  rafraichir: () => void;

  // Fenêtres
  envoi: PreRemplissage | null;
  ouvrirEnvoi: (preRemplissage?: PreRemplissage) => void;
  fermerEnvoi: () => void;
  mediaEnEdition: Media | null;
  ouvrirEdition: (media: Media | null) => void;
  mediaPourPlaylist: Media | null;
  ouvrirAjoutPlaylist: (media: Media | null) => void;
  apercu: { liste: Media[]; index: number } | null;
  ouvrirApercu: (liste: Media[], index: number) => void;
  fermerApercu: () => void;
  confirmation: DemandeConfirmation | null;
  confirmer: (demande: DemandeConfirmation) => Promise<boolean>;
  repondreConfirmation: (reponse: boolean) => void;

  // Actions
  basculerFavori: (media: Media) => Promise<Media | null>;
  supprimerMedia: (media: Media) => Promise<boolean>;
}

const BibliothequeContext = createContext<ValeurBibliotheque | null>(null);

export const BibliothequeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [version, setVersion] = useState(0);

  const [envoi, setEnvoi] = useState<PreRemplissage | null>(null);
  const [mediaEnEdition, ouvrirEdition] = useState<Media | null>(null);
  const [mediaPourPlaylist, ouvrirAjoutPlaylist] = useState<Media | null>(null);
  const [apercu, setApercu] = useState<{ liste: Media[]; index: number } | null>(null);
  const [confirmation, setConfirmation] = useState<DemandeConfirmation | null>(null);
  const resoudreConfirmation = useRef<((reponse: boolean) => void) | null>(null);

  // Recharge catégories + statistiques à chaque nouvelle "version"
  useEffect(() => {
    categoriesService
      .lister()
      .then(setCategories)
      .catch(() => undefined);
    statsService
      .obtenir()
      .then(setStats)
      .catch(() => undefined);
  }, [version]);

  const rafraichir = useCallback(() => setVersion((v) => v + 1), []);

  const categoriesDuType = useCallback(
    (type: TypeMedia) => categories.filter((c) => c.type === type),
    [categories],
  );

  /** Affiche une fenêtre de confirmation et attend la réponse (oui/non). */
  const confirmer = useCallback((demande: DemandeConfirmation) => {
    setConfirmation(demande);
    return new Promise<boolean>((resoudre) => {
      resoudreConfirmation.current = resoudre;
    });
  }, []);

  const repondreConfirmation = useCallback((reponse: boolean) => {
    resoudreConfirmation.current?.(reponse);
    resoudreConfirmation.current = null;
    setConfirmation(null);
  }, []);

  const basculerFavori = useCallback(
    async (media: Media) => {
      try {
        const misAJour = await mediasService.basculerFavori(media.id);
        toast({
          title: misAJour.favori ? 'Ajouté aux favoris' : 'Retiré des favoris',
          description: media.titre,
        });
        rafraichir();
        return misAJour;
      } catch (erreur) {
        toast({ variant: 'destructive', title: 'Erreur', description: (erreur as Error).message });
        return null;
      }
    },
    [rafraichir],
  );

  const supprimerMedia = useCallback(
    async (media: Media) => {
      const ok = await confirmer({
        titre: 'Supprimer ce fichier ?',
        message: `« ${media.titre} » sera définitivement supprimé du disque. Cette action est irréversible.`,
        bouton: 'Supprimer',
        danger: true,
      });
      if (!ok) return false;
      try {
        await mediasService.supprimer(media.id);
        toast({ title: 'Fichier supprimé', description: media.titre });
        rafraichir();
        return true;
      } catch (erreur) {
        toast({
          variant: 'destructive',
          title: 'Suppression impossible',
          description: (erreur as Error).message,
        });
        return false;
      }
    },
    [confirmer, rafraichir],
  );

  return (
    <BibliothequeContext.Provider
      value={{
        categories,
        categoriesDuType,
        stats,
        version,
        rafraichir,
        envoi,
        ouvrirEnvoi: (pre) => setEnvoi(pre ?? {}),
        fermerEnvoi: () => setEnvoi(null),
        mediaEnEdition,
        ouvrirEdition,
        mediaPourPlaylist,
        ouvrirAjoutPlaylist,
        apercu,
        ouvrirApercu: (liste, index) => setApercu({ liste, index }),
        fermerApercu: () => setApercu(null),
        confirmation,
        confirmer,
        repondreConfirmation,
        basculerFavori,
        supprimerMedia,
      }}
    >
      {children}
    </BibliothequeContext.Provider>
  );
};

export function useBibliotheque(): ValeurBibliotheque {
  const contexte = useContext(BibliothequeContext);
  if (!contexte) throw new Error('useBibliotheque doit être utilisé dans <BibliothequeProvider>');
  return contexte;
}
