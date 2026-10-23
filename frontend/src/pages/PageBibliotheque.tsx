// =============================================================================
//  Page générique d'une bibliothèque vidéo (Films, Vidéos) :
//  filtres par catégorie, tri, grille de cartes.
// =============================================================================
import { Plus, Shuffle } from 'lucide-react';
import React, { useState } from 'react';
import { EnTetePage, Grille } from '@/components/layout/EnTetePage';
import { BarreFiltres, type Tri } from '@/components/medias/BarreFiltres';
import { CarteMedia } from '@/components/medias/CarteMedia';
import { Button } from '@/components/ui/button';
import { EtatErreur, EtatVide, Squelettes } from '@/components/ui/etats';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useOuvrirMedia } from '@/hooks/useOuvrirMedia';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { TYPES } from '@/lib/medias';
import { formaterTaille, melanger } from '@/lib/utils';
import { mediasService } from '@/services/medias.service';
import type { TypeMedia } from '@/types';

const PageBibliotheque: React.FC<{ type: TypeMedia }> = ({ type }) => {
  const config = TYPES[type];
  useTitrePage(config.libelle);

  const { categoriesDuType, ouvrirEnvoi } = useBibliotheque();
  const { ouvrir, lire } = useOuvrirMedia();
  const [categorie, setCategorie] = useState<number | null>(null);
  const [tri, setTri] = useState<Tri>('recent');

  const {
    donnees: medias,
    chargement,
    erreur,
  } = useRequete(() => mediasService.lister({ type, categorie, tri }), [type, categorie, tri]);

  const total = medias?.reduce((somme, m) => somme + m.taille, 0) ?? 0;

  return (
    <div>
      <EnTetePage
        icone={config.icone}
        titre={config.libelle}
        couleur={config.couleur}
        fond={config.fond}
        sousTitre={
          medias ? `${medias.length} élément(s) · ${formaterTaille(total)}` : 'Chargement…'
        }
        actions={
          <>
            {medias && medias.length > 1 && (
              <Button
                variant="secondary"
                onClick={() => {
                  const liste = melanger(medias);
                  lire(liste[0], liste);
                }}
              >
                <Shuffle className="h-4 w-4" /> Aléatoire
              </Button>
            )}
            <Button onClick={() => ouvrirEnvoi({ type, categorieId: categorie ?? undefined })}>
              <Plus className="h-4 w-4" /> Ajouter {config.avecArticle}
            </Button>
          </>
        }
      />

      <div className="mb-6">
        <BarreFiltres
          categories={categoriesDuType(type)}
          categorie={categorie}
          onCategorie={setCategorie}
          tri={tri}
          onTri={setTri}
        />
      </div>

      {erreur && <EtatErreur message={erreur} />}
      {chargement && !medias && <Squelettes />}

      {medias && medias.length === 0 && (
        <EtatVide
          icone={config.icone}
          titre={
            categorie ? 'Rien dans cette catégorie' : `Aucun ${config.singulier} pour l’instant`
          }
          message="Ajoutez vos fichiers : ils seront rangés et prêts à être lus depuis tous vos appareils."
          action={
            <Button onClick={() => ouvrirEnvoi({ type })}>
              <Plus className="h-4 w-4" /> Ajouter {config.avecArticle}
            </Button>
          }
        />
      )}

      {medias && medias.length > 0 && (
        <Grille>
          {medias.map((m) => (
            <CarteMedia
              key={m.id}
              media={m}
              onOuvrir={() => ouvrir(m, medias)}
              onLire={() => lire(m, medias)}
            />
          ))}
        </Grille>
      )}
    </div>
  );
};

export default PageBibliotheque;
