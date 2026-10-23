// =============================================================================
//  Fenêtre de confirmation ("Êtes-vous sûr ?") utilisée avant une
//  suppression. Elle est pilotée par confirmer() du BibliothequeContext.
// =============================================================================
import React from 'react';
import { Button } from '@/components/ui/button';
import { Fenetre } from '@/components/ui/fenetre';
import { useBibliotheque } from '@/contexts/BibliothequeContext';

export const DialogConfirmation: React.FC = () => {
  const { confirmation, repondreConfirmation } = useBibliotheque();
  if (!confirmation) return null;

  return (
    <Fenetre
      ouvert
      onFermer={() => repondreConfirmation(false)}
      titre={confirmation.titre}
      className="max-w-md"
      pied={
        <>
          <Button variant="ghost" onClick={() => repondreConfirmation(false)}>
            Annuler
          </Button>
          <Button
            autoFocus
            variant={confirmation.danger ? 'destructive' : 'default'}
            onClick={() => repondreConfirmation(true)}
          >
            {confirmation.bouton ?? 'Confirmer'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{confirmation.message}</p>
    </Fenetre>
  );
};
