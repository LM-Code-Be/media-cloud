import React from 'react';
import { cn } from '@/lib/utils';

/** Logo MediaCloud : un nuage avec un bouton lecture, aux couleurs de l'accent. */
export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 shadow-lg shadow-primary/30',
      className,
    )}
  >
    <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden>
      <path
        d="M18 46h27a11 11 0 0 0 1.6-21.9A15 15 0 0 0 17.6 27.5 9.3 9.3 0 0 0 18 46z"
        fill="white"
      />
      <path d="M28.5 30v11l9.5-5.5z" className="fill-primary" />
    </svg>
  </div>
);
