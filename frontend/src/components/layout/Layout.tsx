// =============================================================================
//  Mise en page générale : barre latérale + en-tête + contenu de la page.
//  Contient aussi les éléments "globaux" : lecteur audio, fenêtres,
//  visionneuse, notifications et le glisser-déposer de fichiers.
// =============================================================================
import { UploadCloud } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DialogConfirmation } from '@/components/dialogs/DialogConfirmation';
import { DialogEdition } from '@/components/dialogs/DialogEdition';
import { DialogEnvoi } from '@/components/dialogs/DialogEnvoi';
import { DialogPlaylist } from '@/components/dialogs/DialogPlaylist';
import { BarreLecture } from '@/components/lecteurs/BarreLecture';
import { Visionneuse } from '@/components/lecteurs/Visionneuse';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useLecteur } from '@/contexts/LecteurContext';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [depotEnCours, setDepotEnCours] = useState(false);
  const { ouvrirEnvoi, envoi } = useBibliotheque();
  const { morceau } = useLecteur();
  const { pathname } = useLocation();

  // Remonte en haut de la page à chaque changement de page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Glisser-déposer des fichiers n'importe où sur la page
  useEffect(() => {
    let compteur = 0; // dragenter/dragleave se déclenchent sur chaque élément survolé
    const contientFichiers = (e: DragEvent) => e.dataTransfer?.types.includes('Files');

    const entree = (e: DragEvent) => {
      if (!contientFichiers(e) || envoi) return;
      compteur++;
      setDepotEnCours(true);
    };
    const sortie = () => {
      compteur = Math.max(0, compteur - 1);
      if (compteur === 0) setDepotEnCours(false);
    };
    const survol = (e: DragEvent) => contientFichiers(e) && e.preventDefault();
    const depot = (e: DragEvent) => {
      if (!contientFichiers(e) || envoi) return;
      e.preventDefault();
      compteur = 0;
      setDepotEnCours(false);
      const fichiers = Array.from(e.dataTransfer?.files ?? []);
      if (fichiers.length) ouvrirEnvoi({ fichiers });
    };

    window.addEventListener('dragenter', entree);
    window.addEventListener('dragleave', sortie);
    window.addEventListener('dragover', survol);
    window.addEventListener('drop', depot);
    return () => {
      window.removeEventListener('dragenter', entree);
      window.removeEventListener('dragleave', sortie);
      window.removeEventListener('dragover', survol);
      window.removeEventListener('drop', depot);
    };
  }, [envoi, ouvrirEnvoi]);

  return (
    <div className="flex min-h-screen">
      <Sidebar ouvert={menuOuvert} onFermer={() => setMenuOuvert(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMenuOuvert(true)} />
        {/* Marge en bas quand le lecteur de musique est affiché */}
        <main className={cn('flex-1 px-4 py-6 sm:px-6 lg:px-8', morceau && 'pb-28')}>
          <Outlet />
        </main>
      </div>

      <BarreLecture />
      <Visionneuse />
      <DialogEnvoi />
      <DialogEdition />
      <DialogPlaylist />
      <DialogConfirmation />

      {/* Calque affiché pendant un glisser-déposer */}
      {depotEnCours && (
        <div className="pointer-events-none fixed inset-0 z-[70] grid place-items-center bg-primary/20 backdrop-blur-sm animate-in fade-in-0">
          <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-primary bg-card/90 px-12 py-10 shadow-2xl">
            <UploadCloud className="mb-3 h-12 w-12 text-primary" />
            <p className="text-xl font-bold">Déposez vos fichiers</p>
            <p className="text-sm text-muted-foreground">pour les ajouter à votre bibliothèque</p>
          </div>
        </div>
      )}
    </div>
  );
};
