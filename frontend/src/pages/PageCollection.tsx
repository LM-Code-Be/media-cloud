// =============================================================================
//  Pages "Favoris" et "Recherche" : elles affichent des médias de tous les
//  types, regroupés par type (une section par type).
// =============================================================================
import { Heart, Search } from 'lucide-react';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { EnTetePage, Grille } from '@/components/layout/EnTetePage';
import { CarteMedia } from '@/components/medias/CarteMedia';
import { EtatErreur, EtatVide, Squelettes } from '@/components/ui/etats';
import { useOuvrirMedia } from '@/hooks/useOuvrirMedia';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { LISTE_TYPES, TYPES } from '@/lib/medias';
import { mediasService } from '@/services/medias.service';
import type { Media } from '@/types';
import { ListeTitres } from './PageMusique';

/** Affiche une liste de médias de types variés, section par section. */
const SectionsParType: React.FC<{ medias: Media[] }> = ({ medias }) => {
  const { ouvrir, lire } = useOuvrirMedia();

  return (
    <div className="space-y-10">
      {LISTE_TYPES.map((type) => {
        const liste = medias.filter((m) => m.type === type);
        if (liste.length === 0) return null;
        const { icone: Icone, libelle, couleur } = TYPES[type];
        return (
          <section key={type}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Icone className={`h-5 w-5 ${couleur}`} /> {libelle}
              <span className="text-sm font-normal text-muted-foreground">({liste.length})</span>
            </h2>
            {type === 'musique' ? (
              <ListeTitres titres={liste} />
            ) : (
              <Grille format={type === 'photo' || type === 'document' ? 'carre' : 'video'}>
                {liste.map((m) => (
                  <CarteMedia
                    key={m.id}
                    media={m}
                    format={type === 'photo' || type === 'document' ? 'carre' : 'video'}
                    onOuvrir={() => ouvrir(m, liste)}
                    onLire={() => lire(m, liste)}
                  />
                ))}
              </Grille>
            )}
          </section>
        );
      })}
    </div>
  );
};

export const PageFavoris: React.FC = () => {
  useTitrePage('Favoris');
  const { donnees, chargement, erreur } = useRequete(
    () => mediasService.lister({ favori: true, tri: 'titre' }),
    [],
  );

  return (
    <div>
      <EnTetePage
        icone={Heart}
        titre="Favoris"
        couleur="text-rose-500"
        fond="bg-rose-500/10"
        sousTitre={donnees ? `${donnees.length} élément(s)` : 'Chargement…'}
      />
      {erreur && <EtatErreur message={erreur} />}
      {chargement && !donnees && <Squelettes />}
      {donnees?.length === 0 && (
        <EtatVide
          icone={Heart}
          titre="Aucun favori"
          message="Cliquez sur « Ajouter aux favoris » dans le menu ⋮ d’un média pour le retrouver ici."
        />
      )}
      {donnees && <SectionsParType medias={donnees} />}
    </div>
  );
};

export const PageRecherche: React.FC = () => {
  const [parametres] = useSearchParams();
  const q = parametres.get('q')?.trim() ?? '';
  useTitrePage(q ? `Recherche « ${q} »` : 'Recherche');

  const { donnees, chargement, erreur } = useRequete(
    () => (q ? mediasService.lister({ q, tri: 'titre', limite: 300 }) : Promise.resolve([])),
    [q],
  );

  return (
    <div>
      <EnTetePage
        icone={Search}
        titre={q ? `« ${q} »` : 'Recherche'}
        sousTitre={chargement ? 'Recherche…' : `${donnees?.length ?? 0} résultat(s)`}
      />
      {erreur && <EtatErreur message={erreur} />}
      {chargement && !donnees && <Squelettes nombre={8} />}
      {!chargement && donnees?.length === 0 && (
        <EtatVide
          icone={Search}
          titre="Aucun résultat"
          message="La recherche porte sur les titres, artistes, albums, séries, descriptions et noms de fichiers."
        />
      )}
      {donnees && <SectionsParType medias={donnees} />}
    </div>
  );
};
