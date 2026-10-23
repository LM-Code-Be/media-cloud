// =============================================================================
//  Page de détail d'un média (film, vidéo…) : informations, actions
//  et suggestions de la même catégorie.
// =============================================================================
import {
  ArrowLeft,
  Download,
  Eye,
  Heart,
  ListPlus,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CarteMedia } from '@/components/medias/CarteMedia';
import { Rangee } from '@/components/medias/Rangee';
import { Vignette } from '@/components/medias/Vignette';
import { Button } from '@/components/ui/button';
import { EtatErreur } from '@/components/ui/etats';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useOuvrirMedia } from '@/hooks/useOuvrirMedia';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { TYPES, estVideo, sousTitre } from '@/lib/medias';
import {
  cn,
  formaterDate,
  formaterDuree,
  formaterDureeLongue,
  formaterTaille,
  pourcentage,
} from '@/lib/utils';
import { mediasService } from '@/services/medias.service';

const PageMedia: React.FC = () => {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { basculerFavori, supprimerMedia, ouvrirEdition, ouvrirAjoutPlaylist, rafraichir } =
    useBibliotheque();
  const { ouvrir, lire } = useOuvrirMedia();

  const { donnees: media, chargement, erreur } = useRequete(() => mediasService.obtenir(id), [id]);
  useTitrePage(media?.titre ?? '');

  // Suggestions : même type (et même catégorie si possible)
  const { donnees: suggestions } = useRequete(
    () =>
      media
        ? mediasService.lister({
            type: media.type,
            categorie: media.categorieId,
            tri: 'recent',
            limite: 16,
          })
        : Promise.resolve([]),
    [media?.id, media?.categorieId],
  );

  if (erreur) return <EtatErreur message={erreur} />;
  if (chargement && !media) return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  if (!media) return null;

  const config = TYPES[media.type];
  const p = media.progression;
  const enCours = p && !p.termine && p.position > 5;
  const autres = (suggestions ?? []).filter((m) => m.id !== media.id);

  const recommencer = async () => {
    await mediasService.effacerProgression(media.id);
    rafraichir();
    lire({ ...media, progression: null });
  };

  const infos: [string, React.ReactNode][] = [
    ['Fichier', media.nomOriginal],
    ['Format', media.mime],
    ['Taille', formaterTaille(media.taille)],
    ['Durée', media.duree ? formaterDuree(media.duree) : '—'],
    ['Catégorie', media.categorieNom ?? '—'],
    ['Lectures', media.vues],
    ['Ajouté le', formaterDate(media.ajouteLe)],
    ['Dernière lecture', media.derniereLecture ? formaterDate(media.derniereLecture) : 'Jamais'],
  ];

  return (
    <div className="space-y-10">
      <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0">
          <Vignette
            url={media.urlMiniature}
            type={media.type}
            alt=""
            className="scale-110 blur-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/60" />
        </div>

        <div className="relative px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_1fr]">
            {/* Miniature cliquable */}
            <button
              onClick={() => lire(media)}
              className={cn(
                'group relative overflow-hidden rounded-2xl bg-muted shadow-2xl ring-1 ring-white/10',
                media.type === 'musique' || media.type === 'photo'
                  ? 'aspect-square max-w-md'
                  : 'aspect-video',
              )}
            >
              <Vignette
                url={media.urlMiniature}
                type={media.type}
                alt={media.titre}
                className="transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/40">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-black shadow-2xl transition group-hover:scale-110">
                  <Play className="ml-1 h-9 w-9 fill-current" />
                </span>
              </div>
              {enCours && (
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${pourcentage(p.position, p.duree)}%` }}
                  />
                </div>
              )}
            </button>

            {/* Informations */}
            <div className="flex flex-col justify-center">
              <span
                className={cn(
                  'mb-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                  config.fond,
                  config.couleur,
                )}
              >
                <config.icone className="h-3.5 w-3.5" /> {config.singulier}
              </span>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{media.titre}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                {sousTitre(media) && <span>{sousTitre(media)}</span>}
                {media.duree ? <span>{formaterDureeLongue(media.duree)}</span> : null}
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {media.vues}
                </span>
              </p>

              {enCours && (
                <p className="mt-3 text-sm">
                  <span className="font-medium text-primary">En cours</span> · il reste{' '}
                  {formaterDureeLongue(p.duree - p.position) || 'moins d’une minute'}
                </p>
              )}

              {media.description && (
                <p className="mt-4 whitespace-pre-line text-muted-foreground">
                  {media.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <Button size="lg" className="rounded-full" onClick={() => lire(media)}>
                  <Play className="h-5 w-5 fill-current" /> {enCours ? 'Reprendre' : 'Lecture'}
                </Button>
                {enCours && estVideo(media.type) && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => void recommencer()}
                  >
                    <RotateCcw className="h-5 w-5" /> Recommencer
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {[
                  {
                    icone: Heart,
                    libelle: media.favori ? 'Favori' : 'Ajouter aux favoris',
                    action: () => void basculerFavori(media),
                    classe: media.favori && 'fill-rose-500 text-rose-500',
                  },
                  {
                    icone: ListPlus,
                    libelle: 'Playlist',
                    action: () => ouvrirAjoutPlaylist(media),
                  },
                  { icone: Pencil, libelle: 'Modifier', action: () => ouvrirEdition(media) },
                  {
                    icone: Trash2,
                    libelle: 'Supprimer',
                    action: () =>
                      void supprimerMedia(media).then((ok) => ok && navigate(config.chemin)),
                  },
                ].map(({ icone: Icone, libelle, action, classe }) => (
                  <Button key={libelle} variant="ghost" size="sm" onClick={action}>
                    <Icone className={cn('h-4 w-4', classe)} /> {libelle}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" asChild>
                  <a href={media.urlTelechargement} download>
                    <Download className="h-4 w-4" /> Télécharger
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fiche technique */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Informations</h2>
        <dl className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {infos.map(([libelle, valeur]) => (
            <div key={libelle} className="bg-card px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{libelle}</dt>
              <dd className="mt-0.5 truncate text-sm font-medium" title={String(valeur)}>
                {valeur}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {autres.length > 0 && (
        <Rangee
          titre={
            media.categorieNom
              ? `Aussi dans « ${media.categorieNom} »`
              : `Autres ${config.libelle.toLowerCase()}`
          }
          largeurCarte="w-64 sm:w-72"
        >
          {autres.map((m) => (
            <CarteMedia
              key={m.id}
              media={m}
              onOuvrir={() => ouvrir(m, autres)}
              onLire={() => lire(m, autres)}
            />
          ))}
        </Rangee>
      )}
    </div>
  );
};

export default PageMedia;
