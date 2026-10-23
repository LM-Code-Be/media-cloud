// =============================================================================
//  Hook "useOuvrirMedia" : ouvre / lit un média de la bonne façon selon
//  son type. Utilisé par toutes les pages pour un comportement identique.
//    - film / vidéo  → page de détail      (lire : lecteur vidéo)
//    - série         → page de la série    (lire : lecteur vidéo)
//    - musique       → lecture immédiate dans la barre du bas
//    - photo / doc   → visionneuse
// =============================================================================
import { useNavigate } from 'react-router-dom';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useLecteur } from '@/contexts/LecteurContext';
import { estVideo, lienMedia } from '@/lib/medias';
import type { Media } from '@/types';

export function useOuvrirMedia() {
  const navigate = useNavigate();
  const { ouvrirApercu } = useBibliotheque();
  const { lireMusique, lireVideo } = useLecteur();

  /** Lance la lecture d'un média, en gardant la liste pour enchaîner. */
  const lire = (media: Media, liste: Media[] = [media]) => {
    // On ne garde que les médias du même "genre" (vidéos avec vidéos…)
    const memeGenre = liste.filter((m) =>
      estVideo(media.type) ? estVideo(m.type) : m.type === media.type,
    );
    const index = Math.max(
      0,
      memeGenre.findIndex((m) => m.id === media.id),
    );

    if (estVideo(media.type)) lireVideo(memeGenre, index);
    else if (media.type === 'musique') lireMusique(memeGenre, index);
    else ouvrirApercu(memeGenre, index);
  };

  /** Ouvre la page / la vue la plus adaptée au média. */
  const ouvrir = (media: Media, liste: Media[] = [media]) => {
    if (estVideo(media.type)) navigate(lienMedia(media));
    else lire(media, liste);
  };

  return { ouvrir, lire };
}
