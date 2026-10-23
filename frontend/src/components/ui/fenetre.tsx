// =============================================================================
//  Fenêtre modale réutilisable (basée sur Radix Dialog : accessible au
//  clavier, se ferme avec Échap ou en cliquant à côté).
// =============================================================================
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface FenetreProps {
  ouvert: boolean;
  onFermer: () => void;
  titre: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  pied?: React.ReactNode; // boutons en bas
  className?: string;
  bloquer?: boolean; // empêche la fermeture (ex : pendant un envoi)
}

export const Fenetre: React.FC<FenetreProps> = ({
  ouvert,
  onFermer,
  titre,
  description,
  children,
  pied,
  className,
  bloquer = false,
}) => (
  <Dialog.Root open={ouvert} onOpenChange={(o) => !o && !bloquer && onFermer()}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
        <Dialog.Content
          className={cn(
            'relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl border bg-card shadow-2xl outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">{titre}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{String(titre)}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              disabled={bloquer}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-40"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {pied && <div className="flex justify-end gap-2 border-t px-6 py-4">{pied}</div>}
        </Dialog.Content>
      </div>
    </Dialog.Portal>
  </Dialog.Root>
);
