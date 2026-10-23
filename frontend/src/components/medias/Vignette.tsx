// =============================================================================
//  Image d'aperçu d'un média. S'il n'y a pas de miniature, on affiche un
//  joli dégradé avec l'icône du type (film, musique…).
// =============================================================================
import React, { useState } from 'react';
import { TYPES } from '@/lib/medias';
import { cn } from '@/lib/utils';
import type { TypeMedia } from '@/types';

interface VignetteProps {
  url: string | null;
  type: TypeMedia;
  alt: string;
  className?: string;
}

export const Vignette: React.FC<VignetteProps> = ({ url, type, alt, className }) => {
  const [enErreur, setEnErreur] = useState(false);
  const { icone: Icone, couleur } = TYPES[type];

  if (url && !enErreur) {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy" // chargée seulement quand elle devient visible
        onError={() => setEnErreur(true)}
        className={cn('h-full w-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'grid h-full w-full place-items-center bg-gradient-to-br from-muted via-muted/60 to-primary/20',
        className,
      )}
    >
      <Icone className={cn('h-1/3 max-h-14 w-1/3 max-w-14 opacity-80', couleur)} />
    </div>
  );
};
