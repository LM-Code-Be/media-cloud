// =============================================================================
//  Thème de l'application : mode clair/sombre + couleur d'accent.
//  Le choix est mémorisé dans le navigateur (localStorage).
// =============================================================================
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Mode = 'sombre' | 'clair';
export type Accent = 'violet' | 'rouge' | 'bleu' | 'vert' | 'orange' | 'rose';

interface ValeurTheme {
  mode: Mode;
  accent: Accent;
  changerMode: (mode: Mode) => void;
  changerAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ValeurTheme | null>(null);

/** Lit une valeur sauvegardée, sans planter si le stockage est bloqué. */
function lire<T extends string>(cle: string, defaut: T): T {
  try {
    return (localStorage.getItem(cle) as T) || defaut;
  } catch {
    return defaut;
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, changerMode] = useState<Mode>(() => lire('mc_mode', 'sombre'));
  const [accent, changerAccent] = useState<Accent>(() => lire('mc_accent', 'violet'));

  // Applique le thème sur la balise <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', mode === 'sombre');
    html.dataset.accent = accent;
    try {
      localStorage.setItem('mc_mode', mode);
      localStorage.setItem('mc_accent', accent);
    } catch {
      // stockage indisponible (navigation privée…) : pas grave
    }
  }, [mode, accent]);

  return (
    <ThemeContext.Provider value={{ mode, accent, changerMode, changerAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ValeurTheme {
  const contexte = useContext(ThemeContext);
  if (!contexte) throw new Error('useTheme doit être utilisé dans <ThemeProvider>');
  return contexte;
}
