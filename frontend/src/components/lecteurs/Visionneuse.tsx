// =============================================================================
//  Visionneuse plein écran pour les photos et les documents.
//  - Flèches ← → (ou boutons) pour passer d'un fichier à l'autre
//  - Diaporama automatique pour les photos
//  - Aperçu intégré des PDF, images, textes, vidéos et sons
// =============================================================================
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileQuestion,
  Heart,
  Pause,
  Pencil,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { TYPES } from '@/lib/medias';
import { cn, extension, formaterDate, formaterTaille } from '@/lib/utils';
import type { Media } from '@/types';

/** Choisit comment afficher le fichier selon son type MIME. */
const Apercu: React.FC<{ media: Media }> = ({ media }) => {
  const { mime, urlFichier, titre } = media;

  if (mime.startsWith('image/')) {
    return (
      <img
        key={media.id}
        src={urlFichier}
        alt={titre}
        className="max-h-full max-w-full select-none object-contain animate-in fade-in-0 zoom-in-95"
      />
    );
  }
  if (mime.startsWith('video/')) {
    return <video src={urlFichier} controls autoPlay className="max-h-full max-w-full" />;
  }
  if (mime.startsWith('audio/')) {
    return <audio src={urlFichier} controls autoPlay className="w-full max-w-lg" />;
  }
  // PDF et fichiers texte : le navigateur sait les afficher dans un cadre
  if (mime === 'application/pdf' || mime.startsWith('text/') || mime === 'application/json') {
    return (
      <iframe
        src={urlFichier}
        title={titre}
        className="h-full w-full max-w-5xl rounded-lg bg-white"
      />
    );
  }

  // Autres formats (Word, Excel, ZIP…) : pas d'aperçu possible
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white/5 p-10 text-center text-white">
      <FileQuestion className="mb-4 h-16 w-16 text-white/50" />
      <p className="text-lg font-semibold">Aperçu non disponible</p>
      <p className="mt-1 text-sm text-white/60">
        Le format {extension(media.nomOriginal) || 'de ce fichier'} ne peut pas être affiché dans le
        navigateur.
      </p>
      <Button asChild className="mt-6">
        <a href={media.urlTelechargement} download>
          <Download className="h-4 w-4" /> Télécharger ({formaterTaille(media.taille)})
        </a>
      </Button>
    </div>
  );
};

export const Visionneuse: React.FC = () => {
  const { apercu, fermerApercu, ouvrirApercu, basculerFavori, supprimerMedia, ouvrirEdition } =
    useBibliotheque();
  const [diaporama, setDiaporama] = useState(false);

  const liste = apercu?.liste ?? [];
  const index = apercu?.index ?? 0;
  const media = liste[index];

  const aller = (sens: 1 | -1) => {
    if (liste.length < 2) return;
    ouvrirApercu(liste, (index + sens + liste.length) % liste.length);
  };

  // Raccourcis clavier
  useEffect(() => {
    if (!apercu) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermerApercu();
      if (e.key === 'ArrowRight') aller(1);
      if (e.key === 'ArrowLeft') aller(-1);
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  });

  // Diaporama : photo suivante toutes les 4 secondes
  useEffect(() => {
    if (!diaporama || !apercu) return;
    const minuteur = setInterval(() => aller(1), 4000);
    return () => clearInterval(minuteur);
  });

  // Arrêt du diaporama à la fermeture
  useEffect(() => {
    if (!apercu) setDiaporama(false);
  }, [apercu]);

  if (!media) return null;

  /** Met à jour le média dans la liste après une modification (favori…) */
  const remplacer = (misAJour: Media | null) => {
    if (misAJour)
      ouvrirApercu(
        liste.map((m) => (m.id === misAJour.id ? misAJour : m)),
        index,
      );
  };

  const supprimer = async () => {
    if (!(await supprimerMedia(media))) return;
    const reste = liste.filter((m) => m.id !== media.id);
    if (reste.length === 0) fermerApercu();
    else ouvrirApercu(reste, Math.min(index, reste.length - 1));
  };

  const Icone = TYPES[media.type].icone;

  return (
    <div className="fixed inset-0 z-[45] flex flex-col bg-black/95 backdrop-blur animate-in fade-in-0">
      {/* Barre du haut */}
      <div className="flex items-center gap-3 px-4 py-3 text-white">
        <Icone className="h-5 w-5 shrink-0 text-white/60" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{media.titre}</p>
          <p className="truncate text-xs text-white/60">
            {liste.length > 1 && `${index + 1} / ${liste.length} · `}
            {formaterTaille(media.taille)} · ajouté le {formaterDate(media.ajouteLe)}
          </p>
        </div>
        {media.type === 'photo' && liste.length > 1 && (
          <button
            onClick={() => setDiaporama((d) => !d)}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            {diaporama ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="hidden sm:inline">Diaporama</span>
          </button>
        )}
        {[
          {
            icone: Heart,
            titre: 'Favori',
            action: () => void basculerFavori(media).then(remplacer),
            actif: media.favori,
          },
          { icone: Pencil, titre: 'Modifier', action: () => ouvrirEdition(media) },
          { icone: Trash2, titre: 'Supprimer', action: () => void supprimer() },
        ].map(({ icone: I, titre, action, actif }) => (
          <button
            key={titre}
            onClick={action}
            title={titre}
            className="grid h-10 w-10 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <I className={cn('h-5 w-5', actif && 'fill-rose-500 text-rose-500')} />
          </button>
        ))}
        <a
          href={media.urlTelechargement}
          download
          title="Télécharger"
          className="grid h-10 w-10 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <Download className="h-5 w-5" />
        </a>
        <button
          onClick={fermerApercu}
          title="Fermer (Échap)"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Contenu */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16">
        <Apercu media={media} />

        {liste.length > 1 && (
          <>
            <button
              onClick={() => aller(-1)}
              className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:left-4"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => aller(1)}
              className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-4"
              aria-label="Suivant"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
