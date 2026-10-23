// =============================================================================
//  Page d'accueil : grande bannière, "reprendre la lecture", ajouts récents,
//  musique, photos, favoris et statistiques de la bibliothèque.
// =============================================================================
import { Clock, Heart, HardDrive, Info, Play, Sparkles, UploadCloud } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CarteMedia } from '@/components/medias/CarteMedia';
import { Rangee } from '@/components/medias/Rangee';
import { Vignette } from '@/components/medias/Vignette';
import { Button } from '@/components/ui/button';
import { Squelettes } from '@/components/ui/etats';
import { Logo } from '@/components/ui/logo';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useOuvrirMedia } from '@/hooks/useOuvrirMedia';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { LISTE_TYPES, TYPES, TYPES_VIDEO, lienMedia, sousTitre } from '@/lib/medias';
import { formaterDureeLongue, formaterTaille, pourcentage } from '@/lib/utils';
import { mediasService } from '@/services/medias.service';
import type { Media } from '@/types';

/** Grande bannière mettant en avant un film ou une vidéo. */
const Banniere: React.FC<{ media: Media }> = ({ media }) => {
  const navigate = useNavigate();
  const { lire } = useOuvrirMedia();
  const Icone = TYPES[media.type].icone;
  const progression = media.progression;

  return (
    <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6 lg:-mx-8">
      {/* Image de fond floutée + dégradés */}
      <div className="absolute inset-0">
        <Vignette url={media.urlMiniature} type={media.type} alt="" className="scale-110 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      <div className="relative grid items-center gap-8 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-16 lg:pt-16">
        <div className="max-w-xl animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> À l’affiche
          </span>
          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            {media.titre}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Icone className="h-4 w-4" /> {TYPES[media.type].singulier}
            </span>
            {sousTitre(media) && <span>· {sousTitre(media)}</span>}
            {media.duree ? <span>· {formaterDureeLongue(media.duree)}</span> : null}
          </div>
          {media.description && (
            <p className="mt-4 line-clamp-3 text-muted-foreground">{media.description}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => lire(media)} className="rounded-full">
              <Play className="h-5 w-5 fill-current" />
              {progression && !progression.termine ? 'Reprendre' : 'Lecture'}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full"
              onClick={() => navigate(lienMedia(media))}
            >
              <Info className="h-5 w-5" /> Plus d’infos
            </Button>
          </div>
        </div>

        {/* Aperçu à droite (grands écrans) */}
        <button
          onClick={() => lire(media)}
          className="group relative hidden aspect-video overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:block"
        >
          <Vignette
            url={media.urlMiniature}
            type={media.type}
            alt={media.titre}
            className="transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/40">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-black shadow-2xl transition group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 fill-current" />
            </span>
          </div>
          {progression && !progression.termine && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20">
              <div
                className="h-full bg-primary"
                style={{ width: `${pourcentage(progression.position, progression.duree)}%` }}
              />
            </div>
          )}
        </button>
      </div>
    </section>
  );
};

/** Écran de bienvenue quand la bibliothèque est vide. */
const Bienvenue: React.FC = () => {
  const { ouvrirEnvoi } = useBibliotheque();
  return (
    <div className="mx-auto max-w-4xl py-10 text-center">
      <Logo className="mx-auto mb-6 h-20 w-20 rounded-3xl [&_svg]:h-12 [&_svg]:w-12" />
      <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
        Bienvenue sur Media<span className="texte-degrade">Cloud</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
        Votre plateforme multimédia personnelle. Films, séries, musique, photos et documents : tout
        est rangé chez vous, accessible depuis n’importe quel appareil de la maison.
      </p>
      <Button size="lg" className="mt-8 rounded-full" onClick={() => ouvrirEnvoi()}>
        <UploadCloud className="h-5 w-5" /> Ajouter mes premiers fichiers
      </Button>
      <p className="mt-3 text-sm text-muted-foreground">
        Astuce : vous pouvez aussi glisser des fichiers sur la page.
      </p>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {LISTE_TYPES.map((type) => {
          const { icone: Icone, libelle, couleur, fond, avecArticle } = TYPES[type];
          return (
            <button
              key={type}
              onClick={() => ouvrirEnvoi({ type })}
              className="group rounded-2xl border bg-card p-5 text-left transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
            >
              <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${fond}`}>
                <Icone className={`h-5 w-5 ${couleur}`} />
              </div>
              <p className="font-semibold">{libelle}</p>
              <p className="text-sm text-muted-foreground">Ajouter {avecArticle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Statistiques de la bibliothèque + jauge de stockage. */
const Statistiques: React.FC = () => {
  const { stats } = useBibliotheque();
  if (!stats) return null;
  const { disque } = stats;

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold sm:text-xl">Votre bibliothèque</h2>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LISTE_TYPES.map((type) => {
            const { icone: Icone, libelle, couleur, fond, chemin } = TYPES[type];
            const { nombre, taille } = stats.parType[type];
            return (
              <Link
                key={type}
                to={chemin}
                className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-lg"
              >
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${fond}`}>
                  <Icone className={`h-5 w-5 ${couleur}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums leading-none">{nombre}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {libelle} · {formaterTaille(taille)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 font-semibold">
            <HardDrive className="h-5 w-5 text-primary" /> Stockage
          </div>
          <p className="mt-3 text-3xl font-bold">{formaterTaille(stats.tailleTotale)}</p>
          <p className="text-sm text-muted-foreground">
            utilisés par vos médias · {formaterTaille(disque.libre)} libres sur{' '}
            {formaterTaille(disque.total)}
          </p>
          {/* Barre segmentée : la part de chaque type dans la bibliothèque */}
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted">
            {LISTE_TYPES.map((type) => (
              <div
                key={type}
                className={TYPES[type].plein}
                style={{ width: `${pourcentage(stats.parType[type].taille, stats.tailleTotale)}%` }}
                title={`${TYPES[type].libelle} : ${formaterTaille(stats.parType[type].taille)}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {LISTE_TYPES.filter((t) => stats.parType[t].taille > 0).map((type) => (
              <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${TYPES[type].plein}`} />
                {TYPES[type].libelle}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-center">
            <div>
              <p className="text-lg font-bold">{stats.vues}</p>
              <p className="text-xs text-muted-foreground">lectures</p>
            </div>
            <div>
              <p className="text-lg font-bold">
                {formaterDureeLongue(stats.dureeTotale) || '0 min'}
              </p>
              <p className="text-xs text-muted-foreground">de contenu</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Accueil: React.FC = () => {
  useTitrePage('Accueil');
  const { stats } = useBibliotheque();
  const { ouvrir, lire } = useOuvrirMedia();

  const enCours = useRequete(
    () => mediasService.lister({ enCours: true, tri: 'lecture', limite: 20 }),
    [],
  );
  const videos = useRequete(
    () => mediasService.lister({ type: TYPES_VIDEO, tri: 'recent', limite: 20 }),
    [],
  );
  const musiques = useRequete(
    () => mediasService.lister({ type: 'musique', tri: 'recent', limite: 20 }),
    [],
  );
  const photos = useRequete(
    () => mediasService.lister({ type: 'photo', tri: 'recent', limite: 20 }),
    [],
  );
  const favoris = useRequete(
    () => mediasService.lister({ favori: true, tri: 'recent', limite: 20 }),
    [],
  );

  if (stats && stats.nombreTotal === 0) return <Bienvenue />;

  // Mise en avant : la dernière vidéo avec une miniature
  const vedette =
    enCours.donnees?.[0] ?? videos.donnees?.find((m) => m.urlMiniature) ?? videos.donnees?.[0];

  /** Affiche une rangée de cartes pour une liste de médias. */
  const rangee = (
    titre: string,
    icone: React.ReactNode,
    liste: Media[] | null,
    lien?: string,
    format: 'video' | 'carre' = 'video',
  ) =>
    liste && liste.length > 0 ? (
      <Rangee
        titre={titre}
        icone={icone}
        lienVoirTout={lien}
        largeurCarte={format === 'video' ? 'w-64 sm:w-72' : 'w-40 sm:w-44'}
      >
        {liste.map((m) => (
          <CarteMedia
            key={m.id}
            media={m}
            format={format}
            onOuvrir={() => ouvrir(m, liste)}
            onLire={() => lire(m, liste)}
          />
        ))}
      </Rangee>
    ) : null;

  return (
    <div className="space-y-10">
      {vedette ? (
        <Banniere media={vedette} />
      ) : (
        videos.chargement && <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      )}

      {videos.chargement && !videos.donnees ? (
        <Squelettes nombre={4} />
      ) : (
        <>
          {rangee(
            'Reprendre la lecture',
            <Clock className="h-5 w-5 text-primary" />,
            enCours.donnees,
          )}
          {rangee('Ajouts récents', <Sparkles className="h-5 w-5 text-primary" />, videos.donnees)}
          {rangee(
            'Musique',
            React.createElement(TYPES.musique.icone, { className: 'h-5 w-5 text-emerald-500' }),
            musiques.donnees,
            '/musique',
            'carre',
          )}
          {rangee(
            'Photos',
            React.createElement(TYPES.photo.icone, { className: 'h-5 w-5 text-amber-500' }),
            photos.donnees,
            '/photos',
            'carre',
          )}
          {rangee(
            'Vos favoris',
            <Heart className="h-5 w-5 text-rose-500" />,
            favoris.donnees,
            '/favoris',
          )}
        </>
      )}

      <Statistiques />
    </div>
  );
};

export default Accueil;
