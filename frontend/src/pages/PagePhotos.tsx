// =============================================================================
//  Page "Photos" : galerie regroupée par mois, avec visionneuse plein écran.
// =============================================================================
import { Heart, Image as IconeImage, Play, Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { EnTetePage } from '@/components/layout/EnTetePage';
import { BarreFiltres, type Tri } from '@/components/medias/BarreFiltres';
import { Vignette } from '@/components/medias/Vignette';
import { Button } from '@/components/ui/button';
import { EtatErreur, EtatVide, Squelettes } from '@/components/ui/etats';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { TYPES } from '@/lib/medias';
import { formaterTaille } from '@/lib/utils';
import { mediasService } from '@/services/medias.service';
import type { Media } from '@/types';

/** "2025-03-14…" → "mars 2025" */
const mois = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

const PagePhotos: React.FC = () => {
  useTitrePage('Photos');
  const config = TYPES.photo;
  const { categoriesDuType, ouvrirEnvoi, ouvrirApercu } = useBibliotheque();
  const [categorie, setCategorie] = useState<number | null>(null);
  const [tri, setTri] = useState<Tri>('recent');

  const {
    donnees: photos,
    chargement,
    erreur,
  } = useRequete(() => mediasService.lister({ type: 'photo', categorie, tri }), [categorie, tri]);

  // Regroupement par mois d'ajout (uniquement pour les tris par date)
  const groupes = useMemo(() => {
    if (!photos) return [];
    if (tri !== 'recent' && tri !== 'ancien') return [['', photos]] as [string, Media[]][];
    const resultat = new Map<string, Media[]>();
    for (const p of photos)
      resultat.set(mois(p.ajouteLe), [...(resultat.get(mois(p.ajouteLe)) ?? []), p]);
    return [...resultat.entries()];
  }, [photos, tri]);

  const total = photos?.reduce((s, p) => s + p.taille, 0) ?? 0;

  return (
    <div>
      <EnTetePage
        icone={config.icone}
        titre="Photos"
        couleur={config.couleur}
        fond={config.fond}
        sousTitre={photos ? `${photos.length} photo(s) · ${formaterTaille(total)}` : 'Chargement…'}
        actions={
          <>
            {photos && photos.length > 1 && (
              <Button variant="secondary" onClick={() => ouvrirApercu(photos, 0)}>
                <Play className="h-4 w-4" /> Diaporama
              </Button>
            )}
            <Button
              onClick={() => ouvrirEnvoi({ type: 'photo', categorieId: categorie ?? undefined })}
            >
              <Plus className="h-4 w-4" /> Ajouter des photos
            </Button>
          </>
        }
      />

      <div className="mb-6">
        <BarreFiltres
          categories={categoriesDuType('photo')}
          categorie={categorie}
          onCategorie={setCategorie}
          tri={tri}
          onTri={setTri}
          tris={['recent', 'ancien', 'titre', 'taille']}
        />
      </div>

      {erreur && <EtatErreur message={erreur} />}
      {chargement && !photos && <Squelettes format="carre" />}

      {photos && photos.length === 0 && (
        <EtatVide
          icone={IconeImage}
          titre="Aucune photo pour l’instant"
          message="Ajoutez vos souvenirs : des miniatures légères sont créées automatiquement."
          action={
            <Button onClick={() => ouvrirEnvoi({ type: 'photo' })}>
              <Plus className="h-4 w-4" /> Ajouter des photos
            </Button>
          }
        />
      )}

      <div className="space-y-8">
        {groupes.map(([titre, liste]) => (
          <section key={titre || 'tout'}>
            {titre && <h2 className="mb-3 text-lg font-bold capitalize">{titre}</h2>}
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-6 2xl:grid-cols-8">
              {liste.map((p) => (
                <button
                  key={p.id}
                  onClick={() => photos && ouvrirApercu(photos, photos.indexOf(p))}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                  title={p.titre}
                >
                  <Vignette
                    url={p.urlMiniature ?? p.urlFichier}
                    type="photo"
                    alt={p.titre}
                    className="transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
                  {p.favori && (
                    <Heart className="absolute right-1.5 top-1.5 h-4 w-4 fill-rose-500 text-rose-500 drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default PagePhotos;
