// =============================================================================
//  Point d'entrée du frontend : affiche <App /> dans la balise <div id="root">
// =============================================================================
import '@fontsource-variable/inter'; // police Inter, embarquée (fonctionne hors ligne)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
