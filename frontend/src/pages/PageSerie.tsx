// =============================================================================
//  Page d'une série : saisons, liste des épisodes, reprise automatique
//  au prochain épisode non terminé.
// =============================================================================
import { ArrowLeft, CheckCircle2, Play, Plus, Tv } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MenuMedia } from '@/components/medias/MenuMedia';
import { Vignette } from '@/components/medias/Vignette';
import { Button } from '@/components/ui/button';
import { EtatErreur, EtatVide } from '@/components/ui/etats';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useLecteur } from '@/contexts/LecteurContext';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { cn, formaterDureeLongue, pourcentage } from '@/lib/utils';
import { mediasService } from '@/services/medias.service';

const PageSerie: React.FC = () => {
  const nom = decodeURIComponent(useParams().nom ?? '');
  useTitrePage(nom);
  const { ouvrirEnvoi } = useBibliotheque();
  const { lireVideo } = useLecteur();

  const {
    donnees: episodes,
    chargement,
    erreur,
  } = useRequete(() => mediasService.lister({ type: 'serie', serie: nom, tri: 'episode' }), [nom]);

  // Liste des saisons présentes (null = épisodes sans saison)
  const saisons = useMemo(() => [...new Set((episodes ?? []).map((e) => e.saison))], [episodes]);

  // Prochain épisode à regarder : le premier qui n'est pas terminé
  const prochain = episodes?.find((e) => !e.progression?.termine) ?? episodes?.[0];
  const [saison, setSaison] = useState<number | null>(null);

  // Par défaut, on affiche la saison du prochain épisode
  useEffect(() => {
    if (prochain) setSaison(prochain.saison);
  }, [prochain?.id]); // volontairement : uniquement quand cette valeur change

  if (erreur) return <EtatErreur message={erreur} />;
  if (chargement && !episodes) return <div className="h-80 animate-pulse rounded-2xl bg-muted" />;
  if (!episodes || episodes.length === 0) {
    return (
      <EtatVide
        icone={Tv}
        titre="Série introuvable"
        message="Elle a peut-être été renommée ou supprimée."
        action={
          <Button asChild variant="secondary">
            <Link to="/series">Retour aux séries</Link>
          </Button>
        }
      />
    );
  }

  const episodesSaison = episodes.filter((e) => e.saison === saison);
  const vus = episodes.filter((e) => e.progression?.termine).length;
  const affiche = episodes.find((e) => e.urlMiniature) ?? episodes[0];
  const libelleSaison = (s: number | null) => (s == null ? 'Autres' : `Saison ${s}`);
  const libelleProchain =
    prochain?.saison != null && prochain.episode != null
      ? ` S${prochain.saison} É${prochain.episode}`
      : '';

  return (
    <div className="space-y-8">
      {/* Bannière */}
      <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0">
          <Vignette url={affiche.urlMiniature} type="serie" alt="" className="scale-110 blur-md" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/50" />
        </div>
        <div className="relative px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <Link
            to="/series"
            className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Séries
          </Link>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{nom}</h1>
          <p className="mt-2 text-muted-foreground">
            {saisons.length > 1 && `${saisons.length} saisons · `}
            {episodes.length} épisodes · {vus} vu{vus > 1 ? 's' : ''}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {prochain && (
              <Button
                size="lg"
                className="rounded-full"
                onClick={() => lireVideo(episodes, episodes.indexOf(prochain))}
              >
                <Play className="h-5 w-5 fill-current" />
                {prochain.progression && !prochain.progression.termine
                  ? 'Reprendre'
                  : vus > 0
                    ? 'Continuer'
                    : 'Commencer'}
                {libelleProchain}
              </Button>
            )}
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full"
              onClick={() =>
                ouvrirEnvoi({ type: 'serie', serie: nom, saison: saison ?? undefined })
              }
            >
              <Plus className="h-5 w-5" /> Ajouter des épisodes
            </Button>
          </div>
        </div>
      </section>

      {/* Onglets des saisons */}
      {saisons.length > 1 && (
        <div className="sans-scrollbar flex gap-2 overflow-x-auto border-b">
          {saisons.map((s) => (
            <button
              key={String(s)}
              onClick={() => setSaison(s)}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition',
                saison === s
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {libelleSaison(s)}
            </button>
          ))}
        </div>
      )}

      {/* Épisodes */}
      <ul className="space-y-2">
        {episodesSaison.map((ep) => {
          const p = ep.progression;
          return (
            <li
              key={ep.id}
              className="group flex cursor-pointer items-center gap-4 rounded-2xl p-2 transition hover:bg-card"
              onClick={() => lireVideo(episodes, episodes.indexOf(ep))}
            >
              <span className="hidden w-8 text-center text-xl font-bold text-muted-foreground sm:block">
                {ep.episode ?? '–'}
              </span>
              <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48">
                <Vignette url={ep.urlMiniature} type="serie" alt={ep.titre} />
                <div className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/40">
                  <Play className="h-8 w-8 fill-white text-white opacity-0 transition group-hover:opacity-100" />
                </div>
                {p && !p.termine && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pourcentage(p.position, p.duree)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">
                  <span className="truncate">{ep.titre}</span>
                  {p?.termine && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                </p>
                <p className="text-sm text-muted-foreground">
                  {ep.episode != null && `Épisode ${ep.episode}`}
                  {ep.duree ? ` · ${formaterDureeLongue(ep.duree)}` : ''}
                </p>
                {ep.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {ep.description}
                  </p>
                )}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <MenuMedia media={ep} onLire={() => lireVideo(episodes, episodes.indexOf(ep))} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PageSerie;
