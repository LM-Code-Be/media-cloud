// =============================================================================
//  Menu "⋯" d'un média : lire, modifier, favori, playlist, télécharger,
//  supprimer… Utilisé sur toutes les cartes et listes.
// =============================================================================
import {
  CheckCircle2,
  Download,
  Heart,
  HeartOff,
  ListMusic,
  ListPlus,
  MoreVertical,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useLecteur } from '@/contexts/LecteurContext';
import { estVideo } from '@/lib/medias';
import { cn } from '@/lib/utils';
import { mediasService } from '@/services/medias.service';
import type { Media } from '@/types';

interface MenuMediaProps {
  media: Media;
  onLire?: () => void;
  onSupprime?: () => void;
  className?: string;
}

export const MenuMedia: React.FC<MenuMediaProps> = ({ media, onLire, onSupprime, className }) => {
  const { ouvrirEdition, ouvrirAjoutPlaylist, basculerFavori, supprimerMedia, rafraichir } =
    useBibliotheque();
  const { ajouterALaFile } = useLecteur();

  const marquerVu = async (vu: boolean) => {
    if (vu) await mediasService.sauverProgression(media.id, media.duree ?? 1, media.duree ?? 1);
    else await mediasService.effacerProgression(media.id);
    toast({ title: vu ? 'Marqué comme vu' : 'Marqué comme non vu', description: media.titre });
    rafraichir();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground',
            className,
          )}
          aria-label="Actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        {onLire && (
          <DropdownMenuItem onClick={onLire}>
            <Play className="mr-2 h-4 w-4" /> Lire
          </DropdownMenuItem>
        )}
        {media.type === 'musique' && (
          <DropdownMenuItem onClick={() => ajouterALaFile(media)}>
            <ListMusic className="mr-2 h-4 w-4" /> Ajouter à la file d’attente
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => void basculerFavori(media)}>
          {media.favori ? (
            <HeartOff className="mr-2 h-4 w-4" />
          ) : (
            <Heart className="mr-2 h-4 w-4" />
          )}
          {media.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => ouvrirAjoutPlaylist(media)}>
          <ListPlus className="mr-2 h-4 w-4" /> Ajouter à une playlist
        </DropdownMenuItem>
        {estVideo(media.type) &&
          (media.progression ? (
            <DropdownMenuItem onClick={() => void marquerVu(false)}>
              <RotateCcw className="mr-2 h-4 w-4" /> Marquer comme non vu
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => void marquerVu(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Marquer comme vu
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => ouvrirEdition(media)}>
          <Pencil className="mr-2 h-4 w-4" /> Modifier les informations
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={media.urlTelechargement} download>
            <Download className="mr-2 h-4 w-4" /> Télécharger
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onClick={() => void supprimerMedia(media).then((ok) => ok && onSupprime?.())}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
