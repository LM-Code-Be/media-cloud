import { useEffect } from 'react';

/** Change le titre de l'onglet du navigateur : "Films · MediaCloud" */
export function useTitrePage(titre: string): void {
  useEffect(() => {
    document.title = titre ? `${titre} · MediaCloud` : 'MediaCloud';
  }, [titre]);
}
