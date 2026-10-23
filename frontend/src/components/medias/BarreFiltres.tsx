// =============================================================================
//  Barre de filtres : catégories (pastilles) + choix du tri.
// =============================================================================
import { ArrowUpDown } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import type { Categorie, FiltresMedias } from '@/types';

export type Tri = NonNullable<FiltresMedias['tri']>;

const LIBELLES_TRI: Partial<Record<Tri, string>> = {
  recent: 'Ajouts récents',
  ancien: 'Plus anciens',
  titre: 'Titre (A → Z)',
  annee: 'Année',
  vues: 'Les plus vus',
  taille: 'Taille',
  artiste: 'Artiste',
};

interface BarreFiltresProps {
  categories: Categorie[];
  categorie: number | null;
  onCategorie: (id: number | null) => void;
  tri: Tri;
  onTri: (tri: Tri) => void;
  tris?: Tri[];
}

export const BarreFiltres: React.FC<BarreFiltresProps> = ({
  categories,
  categorie,
  onCategorie,
  tri,
  onTri,
  tris = ['recent', 'ancien', 'titre', 'annee', 'vues', 'taille'],
}) => {
  const pastille = (actif: boolean) =>
    cn(
      'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
      actif
        ? 'border-primary bg-primary text-primary-foreground'
        : 'bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
    );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* "Tous" n'est pas une catégorie en base : c'est l'absence de filtre */}
      <div className="sans-scrollbar flex flex-1 gap-2 overflow-x-auto">
        <button className={pastille(categorie === null)} onClick={() => onCategorie(null)}>
          Tous
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={pastille(categorie === c.id)}
            onClick={() => onCategorie(c.id)}
          >
            {c.nom}
            {c.nombreMedias > 0 && <span className="ml-1.5 opacity-60">{c.nombreMedias}</span>}
          </button>
        ))}
      </div>

      <label className="relative flex shrink-0 items-center">
        <ArrowUpDown className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <select
          value={tri}
          onChange={(e) => onTri(e.target.value as Tri)}
          className="champ w-auto cursor-pointer appearance-none py-1.5 pl-9 pr-8"
          aria-label="Trier par"
        >
          {tris.map((t) => (
            <option key={t} value={t}>
              {LIBELLES_TRI[t]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
