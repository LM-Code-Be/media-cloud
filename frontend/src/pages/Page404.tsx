import { Compass } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EtatVide } from '@/components/ui/etats';
import { useTitrePage } from '@/hooks/useTitrePage';

/** Page affichée pour une adresse inconnue. */
const Page404: React.FC = () => {
  useTitrePage('Page introuvable');
  return (
    <EtatVide
      icone={Compass}
      titre="Page introuvable"
      message="Cette page n’existe pas ou a été déplacée."
      action={
        <Button asChild>
          <Link to="/">Retour à l’accueil</Link>
        </Button>
      }
      className="mt-10"
    />
  );
};

export default Page404;
