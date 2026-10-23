import type { LucideIcon } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface EnTetePageProps {
  icone: LucideIcon;
  titre: string;
  sousTitre?: React.ReactNode;
  couleur?: string; // couleur de l'icône
  fond?: string; // fond de l'icône
  actions?: React.ReactNode;
}

/** En-tête commun à toutes les pages : icône, titre, sous-titre, boutons. */
export const EnTetePage: React.FC<EnTetePageProps> = ({
  icone: Icone,
  titre,
  sousTitre,
  couleur = 'text-primary',
  fond = 'bg-primary/10',
  actions,
}) => (
  <div className="mb-6 flex flex-wrap items-center gap-4">
    <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', fond)}>
      <Icone className={cn('h-6 w-6', couleur)} />
    </div>
    <div className="min-w-0 flex-1">
      <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{titre}</h1>
      {sousTitre && <p className="text-sm text-muted-foreground">{sousTitre}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

/** Grille responsive pour les cartes. */
export const Grille: React.FC<{ children: React.ReactNode; format?: 'video' | 'carre' }> = ({
  children,
  format = 'video',
}) => (
  <div
    className={cn(
      'grid gap-x-4 gap-y-6',
      format === 'video'
        ? 'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    )}
  >
    {children}
  </div>
);
