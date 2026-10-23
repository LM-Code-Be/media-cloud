// =============================================================================
//  Contexte "Lecteur" : tout ce qui concerne la lecture.
//    - Musique : une file d'attente jouée par un seul <audio> pour toute
//      l'application (la musique continue quand on change de page).
//    - Vidéo : la liste à enchaîner (épisodes d'une série, playlist…).
//
//  La position de lecture (qui change 4 fois par seconde) est dans un
//  contexte séparé : seuls les composants qui l'affichent sont redessinés.
// =============================================================================
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediasService } from '@/services/medias.service';
import type { Media } from '@/types';

export type Repetition = 'aucune' | 'tout' | 'un';

interface ValeurLecteur {
  // ─── Musique ───
  file: Media[];
  index: number;
  morceau: Media | null;
  enLecture: boolean;
  volume: number;
  aleatoire: boolean;
  repetition: Repetition;
  lireMusique: (liste: Media[], index?: number) => void;
  ajouterALaFile: (media: Media) => void;
  basculerLecture: () => void;
  suivant: () => void;
  precedent: () => void;
  chercher: (secondes: number) => void;
  changerVolume: (volume: number) => void;
  basculerAleatoire: () => void;
  changerRepetition: () => void;
  arreter: () => void;
  mettreEnPause: () => void;
  // ─── Vidéo ───
  fileVideo: Media[];
  lireVideo: (liste: Media[], index?: number, remplacer?: boolean) => void;
}

const LecteurContext = createContext<ValeurLecteur | null>(null);
const PositionContext = createContext({ position: 0, duree: 0 });

function volumeSauvegarde(): number {
  try {
    return Number(localStorage.getItem('mc_volume') ?? 0.8);
  } catch {
    return 0.8;
  }
}

export const LecteurProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [file, setFile] = useState<Media[]>([]);
  const [index, setIndex] = useState(-1);
  const [jeton, setJeton] = useState(0); // force la relecture d'un même morceau
  const [enLecture, setEnLecture] = useState(false);
  const [position, setPosition] = useState(0);
  const [duree, setDuree] = useState(0);
  const [volume, setVolume] = useState(volumeSauvegarde);
  const [aleatoire, setAleatoire] = useState(false);
  const [repetition, setRepetition] = useState<Repetition>('aucune');
  const [fileVideo, setFileVideo] = useState<Media[]>([]);

  const morceau = file[index] ?? null;

  // Nouveau morceau → on le charge et on lance la lecture
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !morceau) return;
    audio.src = morceau.urlFichier;
    audio.play().catch(() => setEnLecture(false));
    mediasService.compterVue(morceau.id).catch(() => undefined);
  }, [morceau?.id, jeton]); // volontairement : uniquement quand le morceau change

  // Volume appliqué et mémorisé
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    try {
      localStorage.setItem('mc_volume', String(volume));
    } catch {
      // ignore
    }
  }, [volume]);

  // ─── Actions musique ────────────────────────────────────────────────────

  const lireMusique = (liste: Media[], i = 0) => {
    if (liste.length === 0) return;
    setFile(liste);
    setIndex(i);
    setJeton((j) => j + 1);
  };

  const ajouterALaFile = (media: Media) => {
    if (!morceau) return lireMusique([media]);
    setFile((actuelle) => [...actuelle, media]);
  };

  const basculerLecture = () => {
    const audio = audioRef.current;
    if (!audio || !morceau) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  /** Passe au morceau suivant. `automatique` = fin naturelle du morceau. */
  const suivant = (automatique = false) => {
    if (file.length === 0) return;
    if (automatique && repetition === 'un') {
      setJeton((j) => j + 1);
      return;
    }
    let prochain = index + 1;
    if (aleatoire && file.length > 1) {
      do prochain = Math.floor(Math.random() * file.length);
      while (prochain === index);
    }
    if (prochain >= file.length) {
      if (repetition === 'aucune' && automatique) return setEnLecture(false);
      prochain = 0;
    }
    setIndex(prochain);
    setJeton((j) => j + 1);
  };

  const precedent = () => {
    const audio = audioRef.current;
    // Après 3 secondes, "précédent" revient au début du morceau
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setIndex((i) => Math.max(0, i - 1));
    setJeton((j) => j + 1);
  };

  const chercher = (secondes: number) => {
    if (audioRef.current) audioRef.current.currentTime = secondes;
  };

  const arreter = () => {
    audioRef.current?.pause();
    audioRef.current?.removeAttribute('src');
    setFile([]);
    setIndex(-1);
    setEnLecture(false);
  };

  const mettreEnPause = () => audioRef.current?.pause();

  // ─── Vidéo ──────────────────────────────────────────────────────────────

  /** `remplacer` : passe à l'épisode suivant sans ajouter d'étape dans l'historique */
  const lireVideo = (liste: Media[], i = 0, remplacer = false) => {
    if (!liste[i]) return;
    mettreEnPause();
    setFileVideo(liste);
    navigate(`/lecture/${liste[i].id}`, { replace: remplacer });
  };

  // ─── Touches multimédia du clavier / écran de verrouillage ─────────────
  // (Media Session API : affiche le titre et la pochette dans le système)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !morceau) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: morceau.titre,
      artist: morceau.artiste ?? '',
      album: morceau.album ?? '',
      artwork: morceau.urlMiniature ? [{ src: morceau.urlMiniature }] : [],
    });
    navigator.mediaSession.setActionHandler('play', basculerLecture);
    navigator.mediaSession.setActionHandler('pause', basculerLecture);
    navigator.mediaSession.setActionHandler('nexttrack', () => suivant());
    navigator.mediaSession.setActionHandler('previoustrack', precedent);
  });

  return (
    <LecteurContext.Provider
      value={{
        file,
        index,
        morceau,
        enLecture,
        volume,
        aleatoire,
        repetition,
        lireMusique,
        ajouterALaFile,
        basculerLecture,
        suivant: () => suivant(),
        precedent,
        chercher,
        changerVolume: setVolume,
        basculerAleatoire: () => setAleatoire((a) => !a),
        changerRepetition: () =>
          setRepetition((r) => (r === 'aucune' ? 'tout' : r === 'tout' ? 'un' : 'aucune')),
        arreter,
        mettreEnPause,
        fileVideo,
        lireVideo,
      }}
    >
      <PositionContext.Provider value={{ position, duree }}>
        {children}
        {/* L'unique lecteur audio de l'application (invisible) */}
        <audio
          ref={audioRef}
          onPlay={() => setEnLecture(true)}
          onPause={() => setEnLecture(false)}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuree(e.currentTarget.duration)}
          onEnded={() => suivant(true)}
        />
      </PositionContext.Provider>
    </LecteurContext.Provider>
  );
};

export function useLecteur(): ValeurLecteur {
  const contexte = useContext(LecteurContext);
  if (!contexte) throw new Error('useLecteur doit être utilisé dans <LecteurProvider>');
  return contexte;
}

/** Position et durée du morceau en cours (mis à jour en continu). */
export const usePositionAudio = () => useContext(PositionContext);
