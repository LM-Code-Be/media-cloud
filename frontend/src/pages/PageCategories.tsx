// =============================================================================
//  Page "Catégories" : créer, renommer et supprimer les catégories
//  de chaque type de média.
// =============================================================================
import { Check, FolderTree, Pencil, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { EnTetePage } from '@/components/layout/EnTetePage';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useTitrePage } from '@/hooks/useTitrePage';
import { LISTE_TYPES, TYPES } from '@/lib/medias';
import { cn } from '@/lib/utils';
import { categoriesService } from '@/services/categories.service';
import type { Categorie, TypeMedia } from '@/types';

/** Une ligne de catégorie, avec renommage "sur place". */
const LigneCategorie: React.FC<{ categorie: Categorie }> = ({ categorie }) => {
  const { rafraichir, confirmer } = useBibliotheque();
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(categorie.nom);

  const renommer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await categoriesService.renommer(categorie.id, nom.trim());
      setEdition(false);
      rafraichir();
    } catch (erreur) {
      toast({ variant: 'destructive', title: 'Erreur', description: (erreur as Error).message });
    }
  };

  const supprimer = async () => {
    const ok = await confirmer({
      titre: 'Supprimer la catégorie ?',
      message:
        categorie.nombreMedias > 0
          ? `Les ${categorie.nombreMedias} média(s) de « ${categorie.nom} » seront conservés, mais sans catégorie.`
          : `La catégorie « ${categorie.nom} » sera supprimée.`,
      bouton: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    await categoriesService.supprimer(categorie.id);
    toast({ title: 'Catégorie supprimée', description: categorie.nom });
    rafraichir();
  };

  if (edition) {
    return (
      <form onSubmit={(e) => void renommer(e)} className="flex items-center gap-2 px-3 py-2">
        <input
          autoFocus
          className="champ h-9"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          maxLength={100}
        />
        <Button type="submit" size="icon" className="h-9 w-9" disabled={!nom.trim()}>
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9"
          onClick={() => setEdition(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </form>
    );
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5">
      <span className="flex-1 text-sm font-medium">{categorie.nom}</span>
      <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
        {categorie.nombreMedias}
      </span>
      <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <button
          onClick={() => setEdition(true)}
          title="Renommer"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => void supprimer()}
          title="Supprimer"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const PageCategories: React.FC = () => {
  useTitrePage('Catégories');
  const { categoriesDuType, rafraichir } = useBibliotheque();
  const [nouveaux, setNouveaux] = useState<Partial<Record<TypeMedia, string>>>({});

  const ajouter = async (e: React.FormEvent, type: TypeMedia) => {
    e.preventDefault();
    const nom = nouveaux[type]?.trim();
    if (!nom) return;
    try {
      await categoriesService.creer(type, nom);
      setNouveaux({ ...nouveaux, [type]: '' });
      rafraichir();
    } catch (erreur) {
      toast({ variant: 'destructive', title: 'Erreur', description: (erreur as Error).message });
    }
  };

  return (
    <div>
      <EnTetePage
        icone={FolderTree}
        titre="Catégories"
        couleur="text-lime-500"
        fond="bg-lime-500/10"
        sousTitre="Organisez chaque bibliothèque avec vos propres catégories."
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {LISTE_TYPES.map((type) => {
          const { icone: Icone, libelle, couleur, fond } = TYPES[type];
          const categories = categoriesDuType(type);
          return (
            <section
              key={type}
              className="flex flex-col overflow-hidden rounded-2xl border bg-card"
            >
              <header className="flex items-center gap-3 border-b px-4 py-3">
                <div className={cn('grid h-9 w-9 place-items-center rounded-xl', fond)}>
                  <Icone className={cn('h-4 w-4', couleur)} />
                </div>
                <h2 className="flex-1 font-semibold">{libelle}</h2>
                <span className="text-xs text-muted-foreground">{categories.length}</span>
              </header>
              <div className="flex-1 divide-y">
                {categories.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Aucune catégorie
                  </p>
                )}
                {categories.map((c) => (
                  <LigneCategorie key={`${c.id}-${c.nom}`} categorie={c} />
                ))}
              </div>
              <form
                onSubmit={(e) => void ajouter(e, type)}
                className="flex gap-2 border-t bg-muted/30 p-3"
              >
                <input
                  className="champ h-9"
                  placeholder="Nouvelle catégorie…"
                  value={nouveaux[type] ?? ''}
                  onChange={(e) => setNouveaux({ ...nouveaux, [type]: e.target.value })}
                  maxLength={100}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={!nouveaux[type]?.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default PageCategories;
