// =============================================================================
//  Affichages "d'état" : liste vide, chargement, erreur.
// =============================================================================
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

/** Message quand une liste est vide, avec une action possible. */
export const EtatVide: React.FC<{
  icone: LucideIcon;
  titre: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icone: Icone, titre, message, action, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center',
      className,
    )}
  >
    <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
      <Icone className="h-8 w-8" />
    </div>
    <h3 className="text-lg font-semibold">{titre}</h3>
    {message && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/** Message d'erreur. */
export const EtatErreur: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
    <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
    <span>{message}</span>
  </div>
);

/** Rectangles gris animés affichés pendant le chargement. */
export const Squelettes: React.FC<{
  nombre?: number;
  className?: string;
  format?: 'video' | 'carre';
}> = ({ nombre = 12, className, format = 'video' }) => (
  <div
    className={cn(
      'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5',
      className,
    )}
  >
    {Array.from({ length: nombre }, (_, i) => (
      <div key={i} className="space-y-2">
        <div
          className={cn(
            'animate-pulse rounded-xl bg-muted',
            format === 'video' ? 'aspect-video' : 'aspect-square',
          )}
        />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
);
