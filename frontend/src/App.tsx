// =============================================================================
//  MediaCloud — Composant racine
//  Développé par LM-Code
//
//  Définit les "fournisseurs" de données (contextes) et les pages (routes).
// =============================================================================
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Layout } from '@/components/layout/Layout';
import { Toaster } from '@/components/ui/toaster';
import { BibliothequeProvider } from '@/contexts/BibliothequeContext';
import { LecteurProvider } from '@/contexts/LecteurContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Accueil from '@/pages/Accueil';

// Les pages sont chargées à la demande ("lazy") : le premier affichage est plus rapide
const PageBibliotheque = lazy(() => import('@/pages/PageBibliotheque'));
const PageSeries = lazy(() => import('@/pages/PageSeries'));
const PageSerie = lazy(() => import('@/pages/PageSerie'));
const PageMusique = lazy(() => import('@/pages/PageMusique'));
const PagePhotos = lazy(() => import('@/pages/PagePhotos'));
const PageDocuments = lazy(() => import('@/pages/PageDocuments'));
const PageMedia = lazy(() => import('@/pages/PageMedia'));
const PageLecture = lazy(() => import('@/pages/PageLecture'));
const PageCategories = lazy(() => import('@/pages/PageCategories'));
const Page404 = lazy(() => import('@/pages/Page404'));
const PageFavoris = lazy(() =>
  import('@/pages/PageCollection').then((m) => ({ default: m.PageFavoris })),
);
const PageRecherche = lazy(() =>
  import('@/pages/PageCollection').then((m) => ({ default: m.PageRecherche })),
);
const PagePlaylists = lazy(() =>
  import('@/pages/PagePlaylists').then((m) => ({ default: m.PagePlaylists })),
);
const PagePlaylist = lazy(() =>
  import('@/pages/PagePlaylists').then((m) => ({ default: m.PagePlaylist })),
);

/** Petit indicateur affiché pendant le chargement d'une page. */
const Chargement: React.FC = () => (
  <div className="grid min-h-[50vh] place-items-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App: React.FC = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <BrowserRouter>
        <BibliothequeProvider>
          <LecteurProvider>
            <Suspense fallback={<Chargement />}>
              <Routes>
                {/* Lecteur vidéo : plein écran, sans barre latérale */}
                <Route path="/lecture/:id" element={<PageLecture />} />

                {/* Toutes les autres pages partagent la même mise en page */}
                <Route element={<Layout />}>
                  <Route index element={<Accueil />} />
                  <Route path="films" element={<PageBibliotheque key="film" type="film" />} />
                  <Route path="videos" element={<PageBibliotheque key="video" type="video" />} />
                  <Route path="series" element={<PageSeries />} />
                  <Route path="series/:nom" element={<PageSerie />} />
                  <Route path="musique" element={<PageMusique />} />
                  <Route path="photos" element={<PagePhotos />} />
                  <Route path="documents" element={<PageDocuments />} />
                  <Route path="media/:id" element={<PageMedia />} />
                  <Route path="favoris" element={<PageFavoris />} />
                  <Route path="playlists" element={<PagePlaylists />} />
                  <Route path="playlists/:id" element={<PagePlaylist />} />
                  <Route path="categories" element={<PageCategories />} />
                  <Route path="recherche" element={<PageRecherche />} />
                  <Route path="*" element={<Page404 />} />
                </Route>
              </Routes>
            </Suspense>
            <Toaster />
          </LecteurProvider>
        </BibliothequeProvider>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
