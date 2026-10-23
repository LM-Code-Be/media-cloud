// =============================================================================
//  Page "Musique" : vue Titres (liste), Albums ou Artistes.
//  Un clic sur un titre lance la lecture dans la barre du bas.
// =============================================================================
import { Disc3, Heart, ListMusic, Mic2, Music, Pause, Play, Plus, Shuffle } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { EnTetePage, Grille } from '@/components/layout/EnTetePage';
import { BarreFiltres, type Tri } from '@/components/medias/BarreFiltres';
import { MenuMedia } from '@/components/medias/MenuMedia';
import { Vignette } from '@/components/medias/Vignette';
import { Button } from '@/components/ui/button';
import { EtatErreur, EtatVide, Squelettes } from '@/components/ui/etats';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useLecteur } from '@/contexts/LecteurContext';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { TYPES } from '@/lib/medias';
import { cn, formaterDuree, formaterDureeLongue, melanger } from '@/lib/utils';
import { mediasService } from '@/services/medias.service';
import type { Media } from '@/types';

type Vue = 'titres' | 'albums' | 'artistes';

/** Liste de titres façon Spotify. */
export const ListeTitres: React.FC<{ titres: Media[] }> = ({ titres }) => {
  const { lireMusique, morceau, enLecture, basculerLecture } = useLecteur();

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid-cols-[2.5rem_2fr_1.5fr_4rem_2.5rem]">
        <span className="text-center">#</span>
        <span>Titre</span>
        <span className="hidden md:block">Album</span>
        <span className="hidden text-right md:block">Durée</span>
        <span />
      </div>
      <ul>
        {titres.map((t, i) => {
          const actif = morceau?.id === t.id;
          return (
            <li
              key={t.id}
              onDoubleClick={() => lireMusique(titres, i)}
              className={cn(
                'group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-2 transition hover:bg-accent/60 md:grid-cols-[2.5rem_2fr_1.5fr_4rem_2.5rem]',
                actif && 'bg-primary/5',
              )}
            >
              <button
                onClick={() => (actif ? basculerLecture() : lireMusique(titres, i))}
                className="grid h-8 w-8 place-items-center justify-self-center rounded-full text-sm tabular-nums text-muted-foreground"
                aria-label="Lire"
              >
                <span className={cn('group-hover:hidden', actif && 'hidden')}>{i + 1}</span>
                <span className={cn('hidden group-hover:block', actif && 'block text-primary')}>
                  {actif && enLecture ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                </span>
              </button>
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md">
                  <Vignette url={t.urlMiniature} type="musique" alt="" />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'flex items-center gap-1.5 truncate text-sm font-medium',
                      actif && 'text-primary',
                    )}
                  >
                    <span className="truncate">{t.titre}</span>
                    {t.favori && <Heart className="h-3 w-3 shrink-0 fill-rose-500 text-rose-500" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.artiste ?? 'Artiste inconnu'}
                  </p>
                </div>
              </div>
              <p className="hidden truncate text-sm text-muted-foreground md:block">
                {t.album ?? '—'}
              </p>
              <p className="hidden text-right text-sm tabular-nums text-muted-foreground md:block">
                {formaterDuree(t.duree)}
              </p>
              <MenuMedia
                media={t}
                onLire={() => lireMusique(titres, i)}
                className="justify-self-end"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/** Regroupe les titres par album ou par artiste. */
function regrouper(titres: Media[], cle: 'album' | 'artiste') {
  const groupes = new Map<string, Media[]>();
  for (const t of titres) {
    const nom = t[cle] ?? (cle === 'album' ? 'Album inconnu' : 'Artiste inconnu');
    groupes.set(nom, [...(groupes.get(nom) ?? []), t]);
  }
  return [...groupes.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr'));
}

const PageMusique: React.FC = () => {
  useTitrePage('Musique');
  const config = TYPES.musique;
  const { categoriesDuType, ouvrirEnvoi } = useBibliotheque();
  const { lireMusique } = useLecteur();

  const [vue, setVue] = useState<Vue>('titres');
  const [groupe, setGroupe] = useState<string | null>(null); // album/artiste ouvert
  const [categorie, setCategorie] = useState<number | null>(null);
  const [tri, setTri] = useState<Tri>('artiste');

  const {
    donnees: titres,
    chargement,
    erreur,
  } = useRequete(() => mediasService.lister({ type: 'musique', categorie, tri }), [categorie, tri]);

  const groupes = useMemo(
    () =>
      titres && vue !== 'titres' ? regrouper(titres, vue === 'albums' ? 'album' : 'artiste') : [],
    [titres, vue],
  );

  // Titres affichés : tous, ou ceux de l'album/artiste choisi
  const titresAffiches = groupe
    ? (groupes.find(([nom]) => nom === groupe)?.[1] ?? [])
    : (titres ?? []);
  const dureeTotale = titresAffiches.reduce((total, t) => total + (t.duree ?? 0), 0);

  const onglet = (id: Vue, libelle: string, Icone: typeof Music) => (
    <button
      onClick={() => {
        setVue(id);
        setGroupe(null);
      }}
      className={cn(
        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
        vue === id
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icone className="h-4 w-4" /> {libelle}
    </button>
  );

  return (
    <div>
      <EnTetePage
        icone={config.icone}
        titre={groupe ?? 'Musique'}
        couleur={config.couleur}
        fond={config.fond}
        sousTitre={
          titres
            ? `${titresAffiches.length} titre(s) · ${formaterDureeLongue(dureeTotale) || '0 min'}`
            : 'Chargement…'
        }
        actions={
          <>
            {titresAffiches.length > 0 && (vue === 'titres' || groupe) && (
              <>
                <Button onClick={() => lireMusique(titresAffiches)}>
                  <Play className="h-4 w-4 fill-current" /> Tout lire
                </Button>
                <Button variant="secondary" onClick={() => lireMusique(melanger(titresAffiches))}>
                  <Shuffle className="h-4 w-4" /> Aléatoire
                </Button>
              </>
            )}
            <Button
              variant={titresAffiches.length > 0 ? 'outline' : 'default'}
              onClick={() => ouvrirEnvoi({ type: 'musique' })}
            >
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1">
        {onglet('titres', 'Titres', ListMusic)}
        {onglet('albums', 'Albums', Disc3)}
        {onglet('artistes', 'Artistes', Mic2)}
      </div>

      {vue === 'titres' && (
        <div className="mb-6">
          <BarreFiltres
            categories={categoriesDuType('musique')}
            categorie={categorie}
            onCategorie={setCategorie}
            tri={tri}
            onTri={setTri}
            tris={['artiste', 'titre', 'recent', 'vues', 'annee']}
          />
        </div>
      )}

      {erreur && <EtatErreur message={erreur} />}
      {chargement && !titres && <Squelettes format="carre" />}

      {titres && titres.length === 0 && (
        <EtatVide
          icone={Music}
          titre="Aucune musique pour l’instant"
          message="Ajoutez vos MP3, FLAC… Le titre, l’artiste, l’album et la pochette sont lus automatiquement."
          action={
            <Button onClick={() => ouvrirEnvoi({ type: 'musique' })}>
              <Plus className="h-4 w-4" /> Ajouter de la musique
            </Button>
          }
        />
      )}

      {/* Vue Albums / Artistes : grille de pochettes */}
      {titres && titres.length > 0 && vue !== 'titres' && !groupe && (
        <Grille format="carre">
          {groupes.map(([nom, liste]) => {
            const pochette = liste.find((t) => t.urlMiniature)?.urlMiniature ?? null;
            return (
              <div key={nom} className="group">
                <button onClick={() => setGroupe(nom)} className="w-full text-left">
                  <div
                    className={cn(
                      'relative aspect-square overflow-hidden bg-muted shadow-lg ring-1 ring-border/50 transition group-hover:-translate-y-1 group-hover:shadow-xl',
                      vue === 'artistes' ? 'rounded-full' : 'rounded-xl',
                    )}
                  >
                    <Vignette url={pochette} type="musique" alt={nom} />
                  </div>
                  <p
                    className={cn(
                      'mt-2.5 truncate text-sm font-semibold',
                      vue === 'artistes' && 'text-center',
                    )}
                  >
                    {nom}
                  </p>
                  <p
                    className={cn(
                      'truncate text-xs text-muted-foreground',
                      vue === 'artistes' && 'text-center',
                    )}
                  >
                    {vue === 'albums'
                      ? (liste[0].artiste ?? 'Artiste inconnu')
                      : `${liste.length} titre(s)`}
                  </p>
                </button>
              </div>
            );
          })}
        </Grille>
      )}

      {/* Vue Titres, ou contenu d'un album / artiste */}
      {titresAffiches.length > 0 && (vue === 'titres' || groupe) && (
        <>
          {groupe && (
            <Button variant="ghost" size="sm" className="mb-3" onClick={() => setGroupe(null)}>
              ← Retour aux {vue}
            </Button>
          )}
          <ListeTitres titres={titresAffiches} />
        </>
      )}
    </div>
  );
};

export default PageMusique;
