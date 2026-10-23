// =============================================================================
//  Rangée horizontale défilante (comme sur Netflix), avec flèches.
// =============================================================================
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RangeeProps {
  titre: string;
  icone?: React.ReactNode;
  lienVoirTout?: string;
  children: React.ReactNode;
  largeurCarte?: string; // classe Tailwind
}

export const Rangee: React.FC<RangeeProps> = ({
  titre,
  icone,
  lienVoirTout,
  children,
  largeurCarte = 'w-64',
}) => {
  const conteneur = useRef<HTMLDivElement>(null);

  const defiler = (sens: 1 | -1) => {
    const el = conteneur.current;
    if (el) el.scrollBy({ left: sens * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="group/rangee">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
          {icone}
          {titre}
        </h2>
        <div className="flex items-center gap-1">
          {lienVoirTout && (
            <Link
              to={lienVoirTout}
              className="mr-2 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Tout voir
            </Link>
          )}
          <button
            onClick={() => defiler(-1)}
            className="hidden h-8 w-8 place-items-center rounded-full border bg-card transition hover:bg-accent sm:grid"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => defiler(1)}
            className="hidden h-8 w-8 place-items-center rounded-full border bg-card transition hover:bg-accent sm:grid"
            aria-label="Suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={conteneur}
        className={cn(
          'sans-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 pt-1',
          // chaque enfant direct a une largeur fixe
          `[&>*]:shrink-0 [&>*]:snap-start`,
        )}
      >
        {React.Children.map(children, (enfant) => (
          <div className={largeurCarte}>{enfant}</div>
        ))}
      </div>
    </section>
  );
};
