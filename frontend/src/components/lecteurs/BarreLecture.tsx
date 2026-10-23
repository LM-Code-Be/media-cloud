// =============================================================================
//  Barre de lecture musicale, fixée en bas de l'écran (style Spotify).
//  Elle reste visible quand on change de page : la musique continue.
// =============================================================================
import {
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Vignette } from '@/components/medias/Vignette';
import { useLecteur, usePositionAudio } from '@/contexts/LecteurContext';
import { cn, formaterDuree, pourcentage } from '@/lib/utils';

/** Bouton rond de la barre */
const BoutonIcone: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { actif?: boolean }
> = ({ actif, className, ...props }) => (
  <button
    {...props}
    className={cn(
      'grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground',
      actif && 'text-primary hover:text-primary',
      className,
    )}
  />
);

/** Barre de progression du morceau (dans un composant à part car elle change sans arrêt) */
const Progression: React.FC = () => {
  const { position, duree } = usePositionAudio();
  const { chercher } = useLecteur();
  return (
    <div className="flex w-full items-center gap-2 text-[11px] tabular-nums text-muted-foreground">
      <span className="w-10 text-right">{formaterDuree(position)}</span>
      <input
        type="range"
        min={0}
        max={duree || 0}
        step={0.1}
        value={position}
        onChange={(e) => chercher(Number(e.target.value))}
        className="curseur flex-1"
        style={{ '--progression': `${pourcentage(position, duree)}%` } as React.CSSProperties}
        aria-label="Position"
      />
      <span className="w-10">{formaterDuree(duree)}</span>
    </div>
  );
};

const ProgressionMince: React.FC = () => {
  const { position, duree } = usePositionAudio();
  return (
    <div className="absolute inset-x-0 top-0 h-0.5 bg-muted md:hidden">
      <div className="h-full bg-primary" style={{ width: `${pourcentage(position, duree)}%` }} />
    </div>
  );
};

export const BarreLecture: React.FC = () => {
  const lecteur = useLecteur();
  const { morceau, enLecture, volume, aleatoire, repetition, file, index } = lecteur;
  const [fileVisible, setFileVisible] = useState(false);
  const [volumeAvantMuet, setVolumeAvantMuet] = useState(0.8);

  if (!morceau) return null;

  const IconeVolume = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const basculerMuet = () => {
    if (volume > 0) {
      setVolumeAvantMuet(volume);
      lecteur.changerVolume(0);
    } else lecteur.changerVolume(volumeAvantMuet);
  };

  return (
    <>
      {/* File d'attente */}
      {fileVisible && (
        <div className="fixed bottom-24 right-4 z-40 flex max-h-[60vh] w-80 flex-col overflow-hidden rounded-2xl border bg-popover shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-semibold">File d’attente</p>
            <span className="text-xs text-muted-foreground">{file.length} titres</span>
          </div>
          <ul className="overflow-y-auto p-2">
            {file.map((m, i) => (
              <li key={`${m.id}-${i}`}>
                <button
                  onClick={() => lecteur.lireMusique(file, i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-accent',
                    i === index && 'bg-primary/10',
                  )}
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md">
                    <Vignette url={m.urlMiniature} type="musique" alt="" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'truncate text-sm',
                        i === index && 'font-semibold text-primary',
                      )}
                    >
                      {m.titre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.artiste ?? 'Artiste inconnu'}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur-xl">
        {/* Sur mobile : simple trait de progression en haut de la barre */}
        <ProgressionMince />
        <div className="mx-auto grid h-20 grid-cols-[1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_2fr_1fr]">
          {/* Morceau en cours */}
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'h-12 w-12 shrink-0 overflow-hidden rounded-lg shadow',
                enLecture && 'ring-2 ring-primary/50',
              )}
            >
              <Vignette url={morceau.urlMiniature} type="musique" alt={morceau.titre} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{morceau.titre}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[morceau.artiste, morceau.album].filter(Boolean).join(' — ') || 'Artiste inconnu'}
              </p>
            </div>
          </div>

          {/* Commandes */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <BoutonIcone
                onClick={lecteur.basculerAleatoire}
                actif={aleatoire}
                className="hidden md:grid"
                title="Lecture aléatoire"
              >
                <Shuffle className="h-4 w-4" />
              </BoutonIcone>
              <BoutonIcone onClick={lecteur.precedent} className="hidden sm:grid" title="Précédent">
                <SkipBack className="h-4 w-4 fill-current" />
              </BoutonIcone>
              <button
                onClick={lecteur.basculerLecture}
                className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background transition hover:scale-105"
                aria-label={enLecture ? 'Pause' : 'Lecture'}
              >
                {enLecture ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                )}
              </button>
              <BoutonIcone onClick={lecteur.suivant} title="Suivant">
                <SkipForward className="h-4 w-4 fill-current" />
              </BoutonIcone>
              <BoutonIcone
                onClick={lecteur.changerRepetition}
                actif={repetition !== 'aucune'}
                className="hidden md:grid"
                title="Répéter"
              >
                {repetition === 'un' ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </BoutonIcone>
            </div>
            <div className="hidden w-full max-w-xl md:block">
              <Progression />
            </div>
          </div>

          {/* Volume, file, fermer */}
          <div className="hidden items-center justify-end gap-1 md:flex">
            <BoutonIcone
              onClick={() => setFileVisible((v) => !v)}
              actif={fileVisible}
              title="File d’attente"
            >
              <ListMusic className="h-4 w-4" />
            </BoutonIcone>
            <BoutonIcone onClick={basculerMuet} title="Muet">
              <IconeVolume className="h-4 w-4" />
            </BoutonIcone>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => lecteur.changerVolume(Number(e.target.value))}
              className="curseur w-24"
              style={{ '--progression': `${volume * 100}%` } as React.CSSProperties}
              aria-label="Volume"
            />
            <BoutonIcone onClick={lecteur.arreter} title="Fermer le lecteur">
              <X className="h-4 w-4" />
            </BoutonIcone>
          </div>
        </div>
      </div>
    </>
  );
};
