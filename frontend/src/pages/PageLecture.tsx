// =============================================================================
//  Lecteur vidéo plein écran
//  - Reprend automatiquement là où on s'était arrêté
//  - Sauvegarde la position toutes les 10 secondes (et en quittant)
//  - Enchaîne l'épisode suivant avec un compte à rebours
//  - Raccourcis clavier : Espace/K, F, ←/→, ↑/↓, M, N, P, Échap
// =============================================================================
import { AlertTriangle, ArrowLeft, Download, Maximize, SkipBack, SkipForward } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Vignette } from '@/components/medias/Vignette';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useLecteur } from '@/contexts/LecteurContext';
import { useTitrePage } from '@/hooks/useTitrePage';
import { sousTitre } from '@/lib/medias';
import { cn, formaterDuree } from '@/lib/utils';
import { mediasService } from '@/services/medias.service';
import type { Media } from '@/types';

const INTERVALLE_SAUVEGARDE = 10; // secondes
const DUREE_COMPTE_A_REBOURS = 8; // secondes avant l'épisode suivant

const PageLecture: React.FC = () => {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { fileVideo, lireVideo, mettreEnPause } = useLecteur();

  const [media, setMedia] = useState<Media | null>(null);
  const [file, setFile] = useState<Media[]>([]);
  const [erreurLecture, setErreurLecture] = useState(false);
  const [interfaceVisible, setInterfaceVisible] = useState(true);
  const [compteARebours, setCompteARebours] = useState<number | null>(null);

  const video = useRef<HTMLVideoElement>(null);
  const conteneur = useRef<HTMLDivElement>(null);
  const derniereSauvegarde = useRef(0);
  // Dernière position connue (la balise <video> n'existe plus quand on quitte la page)
  const positionActuelle = useRef({ position: 0, duree: 0 });
  const vueComptee = useRef(false);
  const minuteurInterface = useRef<ReturnType<typeof setTimeout>>();

  useTitrePage(media ? `▶ ${media.titre}` : 'Lecture');

  // La musique s'arrête quand on lance une vidéo
  useEffect(() => {
    mettreEnPause(); // une seule fois, à l'ouverture du lecteur
  }, []);

  // Chargement du média + de la liste à enchaîner
  useEffect(() => {
    let annule = false;
    setMedia(null);
    setErreurLecture(false);
    setCompteARebours(null);
    vueComptee.current = false;
    positionActuelle.current = { position: 0, duree: 0 };
    derniereSauvegarde.current = 0;

    mediasService
      .obtenir(id)
      .then(async (m) => {
        if (annule) return;
        setMedia(m);
        if (fileVideo.some((v) => v.id === id)) {
          setFile(fileVideo);
        } else if (m.type === 'serie' && m.serie) {
          // Accès direct à un épisode : on charge toute la série pour enchaîner
          const episodes = await mediasService.lister({
            type: 'serie',
            serie: m.serie,
            tri: 'episode',
          });
          if (!annule) setFile(episodes);
        } else {
          setFile([m]);
        }
      })
      .catch((e: Error) => {
        toast({ variant: 'destructive', title: 'Lecture impossible', description: e.message });
        navigate(-1);
      });

    return () => {
      annule = true;
    };
  }, [id]); // volontairement : uniquement quand cette valeur change

  const index = file.findIndex((m) => m.id === id);
  const suivant = index >= 0 ? file[index + 1] : undefined;
  const precedent = index > 0 ? file[index - 1] : undefined;

  /** Envoie la position actuelle au serveur. */
  const sauvegarder = useCallback(
    (auDepart = false) => {
      const { position, duree } = positionActuelle.current;
      if (!media || !duree || position < 1) return;
      derniereSauvegarde.current = position;
      if (auDepart) mediasService.sauverProgressionAuDepart(media.id, position, duree);
      else mediasService.sauverProgression(media.id, position, duree).catch(() => undefined);
    },
    [media],
  );

  /** Passe à un autre épisode de la liste. */
  const aller = useCallback(
    (cible: Media | undefined) => {
      if (!cible) return;
      sauvegarder(); // on mémorise où on en était avant de changer
      lireVideo(file, file.indexOf(cible), true);
    },
    [file, lireVideo, sauvegarder],
  );

  // Sauvegarde quand on quitte la page ou change d'épisode
  useEffect(() => {
    const avantFermeture = () => sauvegarder(true);
    window.addEventListener('beforeunload', avantFermeture);
    return () => {
      window.removeEventListener('beforeunload', avantFermeture);
      sauvegarder(true);
    };
  }, [sauvegarder]);

  // Compte à rebours avant l'épisode suivant
  useEffect(() => {
    if (compteARebours === null) return;
    if (compteARebours <= 0) {
      aller(suivant);
      return;
    }
    const minuteur = setTimeout(() => setCompteARebours((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(minuteur);
  }, [compteARebours, suivant, aller]);

  // Affiche l'interface au mouvement de la souris, la cache après 3 s
  const montrerInterface = () => {
    setInterfaceVisible(true);
    clearTimeout(minuteurInterface.current);
    minuteurInterface.current = setTimeout(() => {
      if (!video.current?.paused) setInterfaceVisible(false);
    }, 3000);
  };

  const pleinEcran = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void conteneur.current?.requestFullscreen();
  };

  // Raccourcis clavier
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      const v = video.current;
      if (!v || e.ctrlKey || e.metaKey || e.altKey) return;
      const actions: Record<string, () => void> = {
        ' ': () => (v.paused ? void v.play() : v.pause()),
        k: () => (v.paused ? void v.play() : v.pause()),
        f: pleinEcran,
        m: () => (v.muted = !v.muted),
        ArrowRight: () => (v.currentTime = Math.min(v.duration, v.currentTime + 10)),
        ArrowLeft: () => (v.currentTime = Math.max(0, v.currentTime - 10)),
        ArrowUp: () => (v.volume = Math.min(1, v.volume + 0.1)),
        ArrowDown: () => (v.volume = Math.max(0, v.volume - 0.1)),
        n: () => aller(suivant),
        p: () => aller(precedent),
        Escape: () => !document.fullscreenElement && navigate(-1),
      };
      const action = actions[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!action) return;
      e.preventDefault(); // évite que le lecteur natif réagisse aussi
      action();
      montrerInterface();
    };
    // "true" = phase de capture : on passe avant les commandes natives de <video>
    window.addEventListener('keydown', surTouche, true);
    return () => window.removeEventListener('keydown', surTouche, true);
  });

  // ─── Événements de la balise <video> ──────────────────────────────────────

  const surMetadonnees = () => {
    const v = video.current;
    const p = media?.progression;
    // Reprise automatique (sauf si presque fini)
    if (v && p && !p.termine && p.position > 5 && p.position < v.duration - 10) {
      v.currentTime = p.position;
      toast({
        title: `Reprise à ${formaterDuree(p.position)}`,
        description: 'Appuyez sur ← pour reculer de 10 s.',
      });
    }
  };

  const surLecture = () => {
    montrerInterface();
    if (!vueComptee.current && media) {
      vueComptee.current = true;
      mediasService.compterVue(media.id).catch(() => undefined);
    }
  };

  const surTemps = () => {
    const v = video.current;
    if (!v) return;
    positionActuelle.current = { position: v.currentTime, duree: v.duration };
    if (Math.abs(v.currentTime - derniereSauvegarde.current) >= INTERVALLE_SAUVEGARDE)
      sauvegarder();
  };

  const surFin = () => {
    sauvegarder();
    setInterfaceVisible(true);
    if (suivant) setCompteARebours(DUREE_COMPTE_A_REBOURS);
  };

  return (
    <div
      ref={conteneur}
      onMouseMove={montrerInterface}
      className={cn('fixed inset-0 z-50 bg-black', !interfaceVisible && 'cursor-none')}
    >
      {media && !erreurLecture && (
        <video
          key={media.id}
          ref={video}
          src={media.urlFichier}
          poster={media.urlMiniature ?? undefined}
          autoPlay
          controls
          playsInline
          className="h-full w-full"
          onLoadedMetadata={surMetadonnees}
          onPlay={surLecture}
          onPause={() => {
            sauvegarder();
            setInterfaceVisible(true);
          }}
          onTimeUpdate={surTemps}
          onEnded={surFin}
          onError={() => setErreurLecture(true)}
        />
      )}

      {/* Barre du haut */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent px-4 pb-16 pt-4 transition-opacity duration-300 sm:px-6',
          interfaceVisible ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="pointer-events-auto flex items-center gap-3 text-white">
          <button
            onClick={() => navigate(-1)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{media?.titre ?? 'Chargement…'}</p>
            {media && <p className="truncate text-sm text-white/70">{sousTitre(media)}</p>}
          </div>
          {precedent && (
            <button
              onClick={() => aller(precedent)}
              title="Précédent (P)"
              className="hidden h-11 w-11 place-items-center rounded-full transition hover:bg-white/10 sm:grid"
            >
              <SkipBack className="h-5 w-5" />
            </button>
          )}
          {suivant && (
            <button
              onClick={() => aller(suivant)}
              title="Suivant (N)"
              className="hidden h-11 w-11 place-items-center rounded-full transition hover:bg-white/10 sm:grid"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={pleinEcran}
            title="Plein écran (F)"
            className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Format non supporté par le navigateur */}
      {erreurLecture && media && (
        <div className="grid h-full place-items-center p-6 text-center text-white">
          <div className="max-w-md">
            <AlertTriangle className="mx-auto mb-4 h-14 w-14 text-amber-400" />
            <h2 className="text-xl font-bold">Ce fichier ne peut pas être lu dans le navigateur</h2>
            <p className="mt-2 text-sm text-white/70">
              Le format ou le codec ({media.mime}) n’est pas pris en charge. Les formats MP4 (H.264)
              et WebM fonctionnent partout. Vous pouvez télécharger le fichier pour le lire avec
              VLC.
            </p>
            <Button asChild className="mt-6">
              <a href={media.urlTelechargement} download>
                <Download className="h-4 w-4" /> Télécharger
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Épisode suivant */}
      {compteARebours !== null && suivant && (
        <div className="absolute bottom-24 right-4 w-80 overflow-hidden rounded-2xl border border-white/10 bg-black/85 text-white shadow-2xl backdrop-blur animate-in slide-in-from-right-8 sm:right-8">
          <div className="relative aspect-video">
            <Vignette url={suivant.urlMiniature} type={suivant.type} alt="" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{
                  width: `${((DUREE_COMPTE_A_REBOURS - compteARebours) / DUREE_COMPTE_A_REBOURS) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">
              À suivre dans {compteARebours} s
            </p>
            <p className="mt-1 truncate font-semibold">{suivant.titre}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => aller(suivant)}>
                Lire maintenant
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setCompteARebours(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageLecture;
