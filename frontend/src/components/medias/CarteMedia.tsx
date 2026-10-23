// =============================================================================
//  Carte d'un média (style YouTube / Netflix) :
//  miniature, durée, barre de progression, titre et menu d'actions.
// =============================================================================
import { Heart, Pause, Play } from 'lucide-react';
import React from 'react';
import { useLecteur } from '@/contexts/LecteurContext';
import { sousTitre } from '@/lib/medias';
import { cn, formaterDuree, pourcentage } from '@/lib/utils';
import type { Media } from '@/types';
import { MenuMedia } from './MenuMedia';
import { Vignette } from './Vignette';

interface CarteMediaProps {
  media: Media;
  onOuvrir: () => void; // clic sur la carte
  onLire?: () => void; // clic sur le bouton lecture
  format?: 'video' | 'carre';
  className?: string;
}

export const CarteMedia: React.FC<CarteMediaProps> = ({
  media,
  onOuvrir,
  onLire,
  format = 'video',
  className,
}) => {
  const { morceau, enLecture, basculerLecture } = useLecteur();
  const estEnCours = morceau?.id === media.id;
  const progression = media.progression;

  return (
    <div className={cn('group relative min-w-0', className)}>
      {/* Miniature */}
      <button
        onClick={onOuvrir}
        className={cn(
          'relative block w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 transition duration-300',
          'group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/30 group-hover:ring-primary/50',
          format === 'video' ? 'aspect-video' : 'aspect-square',
        )}
      >
        <Vignette
          // Une photo sans miniature s'affiche directement
          url={media.urlMiniature ?? (media.type === 'photo' ? media.urlFichier : null)}
          type={media.type}
          alt={media.titre}
          className="transition duration-500 group-hover:scale-105"
        />

        {/* Voile + bouton lecture au survol */}
        <div className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/40">
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              if (!onLire) return;
              e.stopPropagation();
              // Morceau déjà en cours : le bouton sert de pause / reprise
              if (estEnCours) basculerLecture();
              else onLire();
            }}
            className={cn(
              'grid h-12 w-12 scale-75 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl transition',
              'group-hover:scale-100 group-hover:opacity-100',
              estEnCours && 'scale-100 opacity-100',
            )}
          >
            {estEnCours && enLecture ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" />
            )}
          </span>
        </div>

        {/* Badges */}
        {media.duree ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formaterDuree(media.duree)}
          </span>
        ) : null}
        {media.favori && (
          <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
          </span>
        )}
        {progression?.termine && (
          <span className="absolute right-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
            Vu
          </span>
        )}

        {/* Barre de progression "déjà regardé" */}
        {progression && !progression.termine && progression.position > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
            <div
              className="h-full bg-primary"
              style={{ width: `${pourcentage(progression.position, progression.duree)}%` }}
            />
          </div>
        )}
      </button>

      {/* Titre + menu */}
      <div className="mt-2.5 flex items-start gap-1">
        <button onClick={onOuvrir} className="min-w-0 flex-1 text-left">
          <h3
            className={cn('truncate text-sm font-semibold', estEnCours && 'text-primary')}
            title={media.titre}
          >
            {media.titre}
          </h3>
          <p className="truncate text-xs text-muted-foreground">{sousTitre(media) || ' '}</p>
        </button>
        <MenuMedia
          media={media}
          onLire={onLire}
          className="-mr-1 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
        />
      </div>
    </div>
  );
};
