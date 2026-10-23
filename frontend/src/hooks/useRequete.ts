// =============================================================================
//  Hook "useRequete" : charge des données depuis l'API et gère
//  automatiquement les états "chargement" et "erreur".
//  Les données sont rechargées quand les dépendances changent, ou quand la
//  bibliothèque est modifiée (envoi, suppression…).
//
//  Exemple :
//    const { donnees: films } = useRequete(() => mediasService.lister({ type: 'film' }), []);
// =============================================================================
import { useEffect, useState } from 'react';
import { useBibliotheque } from '@/contexts/BibliothequeContext';

export function useRequete<T>(charger: () => Promise<T>, dependances: unknown[]) {
  const { version } = useBibliotheque();
  const [donnees, setDonnees] = useState<T | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false; // évite d'afficher une réponse arrivée trop tard
    setChargement(true);
    charger()
      .then((resultat) => {
        if (annule) return;
        setDonnees(resultat);
        setErreur(null);
      })
      .catch((e: Error) => !annule && setErreur(e.message))
      .finally(() => !annule && setChargement(false));
    return () => {
      annule = true;
    };
  }, [...dependances, version]); // liste de dépendances dynamique (volontaire)

  return { donnees, chargement, erreur, setDonnees };
}
