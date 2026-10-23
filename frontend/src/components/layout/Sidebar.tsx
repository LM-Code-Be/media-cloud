// =============================================================================
//  Barre latérale de navigation.
//  Sur mobile, elle devient un tiroir qui s'ouvre avec le bouton ☰.
// =============================================================================
import { FolderTree, Heart, HardDrive, Home, ListVideo, type LucideIcon } from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useLecteur } from '@/contexts/LecteurContext';
import { LISTE_TYPES, TYPES } from '@/lib/medias';
import { cn, formaterTaille } from '@/lib/utils';

interface LienProps {
  vers: string;
  icone: LucideIcon;
  libelle: string;
  compteur?: number;
  couleur?: string;
  onClick: () => void;
}

const Lien: React.FC<LienProps> = ({ vers, icone: Icone, libelle, compteur, couleur, onClick }) => (
  <NavLink
    to={vers}
    end={vers === '/'}
    onClick={onClick}
    className={({ isActive }) =>
      cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
        isActive
          ? 'bg-primary/10 text-foreground ring-1 ring-primary/30'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )
    }
  >
    {({ isActive }) => (
      <>
        <Icone className={cn('h-[18px] w-[18px]', isActive ? 'text-primary' : couleur)} />
        <span className="flex-1">{libelle}</span>
        {compteur !== undefined && compteur > 0 && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {compteur}
          </span>
        )}
      </>
    )}
  </NavLink>
);

const Section: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
  <div className="space-y-1">
    <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {titre}
    </p>
    {children}
  </div>
);

export const Sidebar: React.FC<{ ouvert: boolean; onFermer: () => void }> = ({
  ouvert,
  onFermer,
}) => {
  const { stats } = useBibliotheque();
  const { morceau } = useLecteur();

  // Jauge de stockage : place utilisée sur le disque
  const disque = stats?.disque;
  const utilise = disque ? disque.total - disque.libre : 0;
  const pourcentageDisque = disque ? Math.round((utilise / disque.total) * 100) : 0;

  return (
    <>
      {/* Fond sombre derrière le tiroir mobile */}
      <div
        onClick={onFermer}
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition lg:hidden',
          ouvert ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card/95 backdrop-blur-xl transition-transform lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0',
          ouvert ? 'translate-x-0' : '-translate-x-full',
          morceau && 'lg:pb-20', // laisse la place au lecteur de musique
        )}
      >
        <NavLink to="/" onClick={onFermer} className="flex items-center gap-3 px-5 py-5">
          <Logo />
          <div>
            <p className="text-lg font-extrabold leading-none tracking-tight">
              Media<span className="texte-degrade">Cloud</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Votre cloud multimédia</p>
          </div>
        </NavLink>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <Lien vers="/" icone={Home} libelle="Accueil" onClick={onFermer} />

          <Section titre="Bibliothèque">
            {LISTE_TYPES.map((type) => (
              <Lien
                key={type}
                vers={TYPES[type].chemin}
                icone={TYPES[type].icone}
                libelle={TYPES[type].libelle}
                couleur={TYPES[type].couleur}
                compteur={stats?.parType[type].nombre}
                onClick={onFermer}
              />
            ))}
          </Section>

          <Section titre="Ma collection">
            <Lien
              vers="/favoris"
              icone={Heart}
              libelle="Favoris"
              compteur={stats?.favoris}
              couleur="text-rose-400"
              onClick={onFermer}
            />
            <Lien
              vers="/playlists"
              icone={ListVideo}
              libelle="Playlists"
              couleur="text-cyan-400"
              onClick={onFermer}
            />
            <Lien
              vers="/categories"
              icone={FolderTree}
              libelle="Catégories"
              couleur="text-lime-400"
              onClick={onFermer}
            />
          </Section>
        </nav>

        {/* Stockage + signature */}
        <div className="border-t p-4">
          {stats && disque && (
            <div className="mb-4 rounded-xl bg-muted/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                <HardDrive className="h-4 w-4 text-primary" />
                Stockage
                <span className="ml-auto text-muted-foreground">{pourcentageDisque} %</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
                  style={{ width: `${pourcentageDisque}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {formaterTaille(stats.tailleTotale)} de médias · {formaterTaille(disque.libre)}{' '}
                libres
              </p>
            </div>
          )}
          <p className="text-center text-[11px] text-muted-foreground">
            Développé par <span className="font-semibold text-foreground">LM-Code</span>
          </p>
        </div>
      </aside>
    </>
  );
};
