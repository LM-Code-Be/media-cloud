// =============================================================================
//  Pages "Playlists" (la liste) et "Playlist" (le détail d'une playlist).
// =============================================================================
import { ArrowLeft, ListVideo, Pencil, Play, Plus, Shuffle, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EnTetePage, Grille } from '@/components/layout/EnTetePage';
import { Vignette } from '@/components/medias/Vignette';
import { MenuMedia } from '@/components/medias/MenuMedia';
import { Button } from '@/components/ui/button';
import { EtatErreur, EtatVide, Squelettes } from '@/components/ui/etats';
import { Fenetre } from '@/components/ui/fenetre';
import { toast } from '@/components/ui/use-toast';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useOuvrirMedia } from '@/hooks/useOuvrirMedia';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { TYPES, sousTitre } from '@/lib/medias';
import { formaterDuree, formaterDureeLongue, melanger } from '@/lib/utils';
import { playlistsService } from '@/services/playlists.service';
import type { Playlist } from '@/types';

/** Fenêtre de création / modification d'une playlist. */
const FenetrePlaylist: React.FC<{
  playlist?: Playlist | null;
  ouvert: boolean;
  onFermer: () => void;
  onEnregistre: (p: Playlist) => void;
}> = ({ playlist, ouvert, onFermer, onEnregistre }) => {
  const [nom, setNom] = useState(playlist?.nom ?? '');
  const [description, setDescription] = useState(playlist?.description ?? '');

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resultat = playlist
        ? await playlistsService.modifier(playlist.id, nom.trim(), description.trim() || null)
        : await playlistsService.creer(nom.trim(), description.trim() || undefined);
      onEnregistre(resultat);
      onFermer();
    } catch (erreur) {
      toast({ variant: 'destructive', title: 'Erreur', description: (erreur as Error).message });
    }
  };

  return (
    <Fenetre
      ouvert={ouvert}
      onFermer={onFermer}
      titre={playlist ? 'Modifier la playlist' : 'Nouvelle playlist'}
      pied={
        <>
          <Button variant="ghost" onClick={onFermer}>
            Annuler
          </Button>
          <Button type="submit" form="formulaire-playlist" disabled={!nom.trim()}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="formulaire-playlist" onSubmit={(e) => void enregistrer(e)} className="space-y-4">
        <label className="block">
          <span className="etiquette">Nom *</span>
          <input
            autoFocus
            className="champ"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={100}
          />
        </label>
        <label className="block">
          <span className="etiquette">Description</span>
          <textarea
            rows={3}
            className="champ"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </label>
      </form>
    </Fenetre>
  );
};

// ─── Liste des playlists ──────────────────────────────────────────────────────

export const PagePlaylists: React.FC = () => {
  useTitrePage('Playlists');
  const navigate = useNavigate();
  const [creation, setCreation] = useState(false);
  const {
    donnees: playlists,
    chargement,
    erreur,
  } = useRequete(() => playlistsService.lister(), []);

  return (
    <div>
      <EnTetePage
        icone={ListVideo}
        titre="Playlists"
        couleur="text-cyan-500"
        fond="bg-cyan-500/10"
        sousTitre={playlists ? `${playlists.length} playlist(s)` : 'Chargement…'}
        actions={
          <Button onClick={() => setCreation(true)}>
            <Plus className="h-4 w-4" /> Nouvelle playlist
          </Button>
        }
      />

      {erreur && <EtatErreur message={erreur} />}
      {chargement && !playlists && <Squelettes format="carre" />}
      {playlists?.length === 0 && (
        <EtatVide
          icone={ListVideo}
          titre="Aucune playlist"
          message="Regroupez vos musiques et vidéos préférées. Ajoutez un média via son menu ⋮ → « Ajouter à une playlist »."
          action={
            <Button onClick={() => setCreation(true)}>
              <Plus className="h-4 w-4" /> Créer une playlist
            </Button>
          }
        />
      )}

      {playlists && playlists.length > 0 && (
        <Grille format="carre">
          {playlists.map((p) => (
            <Link key={p.id} to={`/playlists/${p.id}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-primary/30 to-fuchsia-500/30 shadow-lg ring-1 ring-border/50 transition group-hover:-translate-y-1 group-hover:shadow-xl">
                {p.urlMiniature ? (
                  <Vignette url={p.urlMiniature} type="musique" alt={p.nom} />
                ) : (
                  <div className="grid h-full place-items-center">
                    <ListVideo className="h-12 w-12 text-white/80" />
                  </div>
                )}
              </div>
              <p className="mt-2.5 truncate text-sm font-semibold">{p.nom}</p>
              <p className="truncate text-xs text-muted-foreground">
                {p.nombreMedias} élément(s){p.duree ? ` · ${formaterDureeLongue(p.duree)}` : ''}
              </p>
            </Link>
          ))}
        </Grille>
      )}

      {creation && (
        <FenetrePlaylist
          ouvert
          onFermer={() => setCreation(false)}
          onEnregistre={(p) => navigate(`/playlists/${p.id}`)}
        />
      )}
    </div>
  );
};

// ─── Détail d'une playlist ────────────────────────────────────────────────────

export const PagePlaylist: React.FC = () => {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { confirmer, rafraichir } = useBibliotheque();
  const { lire } = useOuvrirMedia();
  const [edition, setEdition] = useState(false);

  const {
    donnees: playlist,
    chargement,
    erreur,
    setDonnees,
  } = useRequete(() => playlistsService.obtenir(id), [id]);
  useTitrePage(playlist?.nom ?? 'Playlist');

  if (erreur) return <EtatErreur message={erreur} />;
  if (chargement && !playlist) return <Squelettes />;
  if (!playlist) return null;

  const medias = playlist.medias;

  const supprimer = async () => {
    const ok = await confirmer({
      titre: 'Supprimer la playlist ?',
      message: `La playlist « ${playlist.nom} » sera supprimée. Les fichiers eux-mêmes sont conservés.`,
      bouton: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    await playlistsService.supprimer(id);
    toast({ title: 'Playlist supprimée' });
    navigate('/playlists');
  };

  const retirer = async (mediaId: number) => {
    await playlistsService.retirerMedia(id, mediaId);
    setDonnees({ ...playlist, medias: medias.filter((m) => m.id !== mediaId) });
    rafraichir();
  };

  return (
    <div>
      <Link
        to="/playlists"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Playlists
      </Link>
      <EnTetePage
        icone={ListVideo}
        titre={playlist.nom}
        couleur="text-cyan-500"
        fond="bg-cyan-500/10"
        sousTitre={
          playlist.description ??
          `${medias.length} élément(s) · ${formaterDureeLongue(playlist.duree) || '0 min'}`
        }
        actions={
          <>
            {medias.length > 0 && (
              <>
                <Button onClick={() => lire(medias[0], medias)}>
                  <Play className="h-4 w-4 fill-current" /> Lire
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const liste = melanger(medias);
                    lire(liste[0], liste);
                  }}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" onClick={() => setEdition(true)} title="Modifier">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void supprimer()}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {medias.length === 0 ? (
        <EtatVide
          icone={ListVideo}
          titre="Playlist vide"
          message="Ajoutez des médias depuis leur menu ⋮ → « Ajouter à une playlist »."
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {medias.map((m, i) => {
            const Icone = TYPES[m.type].icone;
            return (
              <li
                key={m.id}
                onClick={() => lire(m, medias)}
                className="group flex cursor-pointer items-center gap-4 px-4 py-2.5 transition hover:bg-accent/60"
              >
                <span className="w-6 text-center text-sm tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <div
                  className={`h-12 shrink-0 overflow-hidden rounded-lg ${m.type === 'musique' ? 'w-12' : 'w-20'}`}
                >
                  <Vignette url={m.urlMiniature} type={m.type} alt="" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.titre}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Icone className="h-3 w-3" /> {sousTitre(m) || TYPES[m.type].singulier}
                  </p>
                </div>
                <span className="hidden text-sm tabular-nums text-muted-foreground sm:block">
                  {m.duree ? formaterDuree(m.duree) : ''}
                </span>
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <button
                    onClick={() => void retirer(m.id)}
                    title="Retirer de la playlist"
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <MenuMedia media={m} onLire={() => lire(m, medias)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {edition && (
        <FenetrePlaylist
          ouvert
          playlist={playlist}
          onFermer={() => setEdition(false)}
          onEnregistre={(p) => setDonnees({ ...playlist, ...p, medias })}
        />
      )}
    </div>
  );
};
