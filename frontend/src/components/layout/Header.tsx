// =============================================================================
//  En-tête : recherche globale, bouton d'envoi, choix du thème.
// =============================================================================
import { Check, Menu, Moon, Palette, Search, Sun, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { type Accent, useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const ACCENTS: { id: Accent; libelle: string; classe: string }[] = [
  { id: 'violet', libelle: 'Violet', classe: 'bg-violet-500' },
  { id: 'rouge', libelle: 'Rouge', classe: 'bg-red-500' },
  { id: 'bleu', libelle: 'Bleu', classe: 'bg-blue-500' },
  { id: 'vert', libelle: 'Vert', classe: 'bg-emerald-500' },
  { id: 'orange', libelle: 'Orange', classe: 'bg-orange-500' },
  { id: 'rose', libelle: 'Rose', classe: 'bg-pink-500' },
];

export const Header: React.FC<{ onMenu: () => void }> = ({ onMenu }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [parametres] = useSearchParams();
  const { ouvrirEnvoi } = useBibliotheque();
  const { mode, changerMode, accent, changerAccent } = useTheme();

  const champ = useRef<HTMLInputElement>(null);
  const [recherche, setRecherche] = useState(parametres.get('q') ?? '');

  // Recherche "en direct" : on attend 300 ms après la dernière frappe
  useEffect(() => {
    const minuteur = setTimeout(() => {
      const terme = recherche.trim();
      if (terme)
        navigate(`/recherche?q=${encodeURIComponent(terme)}`, {
          replace: pathname === '/recherche',
        });
    }, 300);
    return () => clearTimeout(minuteur);
  }, [recherche]); // volontairement : uniquement quand cette valeur change

  // On vide le champ quand on quitte la page de recherche
  useEffect(() => {
    if (pathname !== '/recherche') setRecherche('');
  }, [pathname]);

  // Raccourci clavier "/" ou Ctrl+K pour rechercher
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      const dansUnChamp = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (e.target as HTMLElement).tagName,
      );
      if ((e.key === '/' && !dansUnChamp) || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        champ.current?.focus();
      }
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenu}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Recherche */}
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={champ}
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un film, une musique, un document…"
            className="h-10 w-full rounded-full border bg-muted/50 pl-10 pr-16 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/25 [&::-webkit-search-cancel-button]:hidden"
          />
          {recherche ? (
            <button
              onClick={() => setRecherche('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
              aria-label="Effacer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-background px-1.5 text-[10px] text-muted-foreground sm:block">
              Ctrl K
            </kbd>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => ouvrirEnvoi()} className="rounded-full">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Envoyer</span>
          </Button>

          {/* Thème */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full" aria-label="Apparence">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Apparence</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => changerMode('sombre')}>
                <Moon className="mr-2 h-4 w-4" /> Sombre
                {mode === 'sombre' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changerMode('clair')}>
                <Sun className="mr-2 h-4 w-4" /> Clair
                {mode === 'clair' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Couleur d’accent</DropdownMenuLabel>
              <div className="grid grid-cols-6 gap-2 px-2 pb-2 pt-1">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    title={a.libelle}
                    onClick={() => changerAccent(a.id)}
                    className={cn(
                      'grid h-7 w-7 place-items-center rounded-full transition hover:scale-110',
                      a.classe,
                      accent === a.id && 'ring-2 ring-foreground ring-offset-2 ring-offset-popover',
                    )}
                  >
                    {accent === a.id && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
