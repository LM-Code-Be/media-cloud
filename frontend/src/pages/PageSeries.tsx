// =============================================================================
//  Page "Séries" : une carte par série (les épisodes sont regroupés).
// =============================================================================
import { Plus, Tv } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { EnTetePage, Grille } from '@/components/layout/EnTetePage';
import { Vignette } from '@/components/medias/Vignette';
import { Button } from '@/components/ui/button';
import { EtatErreur, EtatVide, Squelettes } from '@/components/ui/etats';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { TYPES } from '@/lib/medias';
import { mediasService } from '@/services/medias.service';

const PageSeries: React.FC = () => {
  useTitrePage('Séries');
  const { ouvrirEnvoi } = useBibliotheque();
  const { donnees: series, chargement, erreur } = useRequete(() => mediasService.series(), []);
  const config = TYPES.serie;

  return (
    <div>
      <EnTetePage
        icone={config.icone}
        titre="Séries"
        couleur={config.couleur}
        fond={config.fond}
        sousTitre={series ? `${series.length} série(s)` : 'Chargement…'}
        actions={
          <Button onClick={() => ouvrirEnvoi({ type: 'serie' })}>
            <Plus className="h-4 w-4" /> Ajouter des épisodes
          </Button>
        }
      />

      {erreur && <EtatErreur message={erreur} />}
      {chargement && !series && <Squelettes />}

      {series && series.length === 0 && (
        <EtatVide
          icone={Tv}
          titre="Aucune série pour l’instant"
          message="Ajoutez des épisodes : les noms comme « S01E02 » sont reconnus automatiquement."
          action={
            <Button onClick={() => ouvrirEnvoi({ type: 'serie' })}>
              <Plus className="h-4 w-4" /> Ajouter des épisodes
            </Button>
          }
        />
      )}

      {series && series.length > 0 && (
        <Grille>
          {series.map((s) => (
            <Link key={s.nom} to={`/series/${encodeURIComponent(s.nom)}`} className="group">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:ring-primary/50">
                <Vignette
                  url={s.urlMiniature}
                  type="serie"
                  alt={s.nom}
                  className="transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 text-white">
                  <p className="truncate text-lg font-bold drop-shadow">{s.nom}</p>
                  <p className="text-xs text-white/75">
                    {s.nombreSaisons > 1 ? `${s.nombreSaisons} saisons · ` : ''}
                    {s.nombreEpisodes} épisode{s.nombreEpisodes > 1 ? 's' : ''}
                    {s.annee ? ` · ${s.annee}` : ''}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </Grille>
      )}
    </div>
  );
};

export default PageSeries;
