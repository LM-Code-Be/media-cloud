// =============================================================================
//  "Filet de sécurité" : si un composant plante, on affiche un message
//  propre au lieu d'une page blanche.
// =============================================================================
import React from 'react';

interface Etat {
  erreur: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, Etat> {
  state: Etat = { erreur: null };

  static getDerivedStateFromError(erreur: Error): Etat {
    return { erreur };
  }

  componentDidCatch(erreur: Error, infos: React.ErrorInfo) {
    console.error('[MediaCloud] Erreur inattendue :', erreur, infos.componentStack);
  }

  render() {
    if (!this.state.erreur) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div className="max-w-md">
          <p className="text-5xl">😵</p>
          <h1 className="mt-4 text-2xl font-bold">Oups, quelque chose s’est mal passé</h1>
          <p className="mt-2 text-sm text-muted-foreground">{this.state.erreur.message}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Revenir à l’accueil
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
