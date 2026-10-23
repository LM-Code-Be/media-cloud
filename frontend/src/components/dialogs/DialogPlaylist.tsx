// =============================================================================
//  Fenêtre "Ajouter à une playlist" : choisir une playlist existante
//  ou en créer une nouvelle.
// =============================================================================
import { ListPlus, ListVideo, Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fenetre } from '@/components/ui/fenetre';
import { toast } from '@/components/ui/use-toast';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { playlistsService } from '@/services/playlists.service';
import type { Playlist } from '@/types';

export const DialogPlaylist: React.FC = () => {
  const { mediaPourPlaylist: media, ouvrirAjoutPlaylist, rafraichir } = useBibliotheque();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [nom, setNom] = useState('');

  useEffect(() => {
    if (media)
      playlistsService
        .lister()
        .then(setPlaylists)
        .catch(() => undefined);
  }, [media]);

  if (!media) return null;

  const fermer = () => {
    setNom('');
    ouvrirAjoutPlaylist(null);
  };

  const ajouter = async (playlist: Playlist) => {
    try {
      await playlistsService.ajouterMedia(playlist.id, media.id);
      toast({ title: `Ajouté à « ${playlist.nom} »`, description: media.titre });
      rafraichir();
      fermer();
    } catch (erreur) {
      toast({ variant: 'destructive', title: 'Erreur', description: (erreur as Error).message });
    }
  };

  const creerEtAjouter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    try {
      const playlist = await playlistsService.creer(nom.trim());
      await ajouter(playlist);
    } catch (erreur) {
      toast({ variant: 'destructive', title: 'Erreur', description: (erreur as Error).message });
    }
  };

  return (
    <Fenetre ouvert onFermer={fermer} titre="Ajouter à une playlist" description={media.titre}>
      <form onSubmit={(e) => void creerEtAjouter(e)} className="mb-4 flex gap-2">
        <input
          className="champ"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nouvelle playlist…"
          maxLength={100}
        />
        <Button type="submit" disabled={!nom.trim()}>
          <Plus className="h-4 w-4" /> Créer
        </Button>
      </form>

      {playlists.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucune playlist pour l’instant.
        </p>
      ) : (
        <ul className="space-y-1">
          {playlists.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => void ajouter(p)}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-accent"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ListVideo className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.nom}</p>
                  <p className="text-xs text-muted-foreground">{p.nombreMedias} élément(s)</p>
                </div>
                <ListPlus className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Fenetre>
  );
};
