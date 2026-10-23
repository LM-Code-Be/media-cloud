// =============================================================================
//  Fonctions de base pour parler au backend.
//  Toutes les URLs commencent par /api : en développement, Vite les
//  transmet au backend (voir "proxy" dans vite.config.ts).
// =============================================================================

/** Erreur renvoyée par l'API, avec son code HTTP. */
export class ErreurApi extends Error {
  constructor(
    public readonly statut: number,
    message: string,
  ) {
    super(message);
  }
}

/** Lit le message d'erreur JSON du backend : { erreur: "..." } */
async function lireErreur(reponse: Response): Promise<ErreurApi> {
  const corps = (await reponse.json().catch(() => ({}))) as { erreur?: string };
  return new ErreurApi(reponse.status, corps.erreur ?? `Erreur ${reponse.status}`);
}

async function requete<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(chemin, options);
  } catch {
    throw new ErreurApi(0, 'Serveur injoignable. Le backend est-il démarré ?');
  }
  if (!reponse.ok) throw await lireErreur(reponse);
  if (reponse.status === 204) return undefined as T;
  return (await reponse.json()) as T;
}

/** Envoie un objet en JSON. */
const json = (methode: string, corps?: unknown): RequestInit => ({
  method: methode,
  headers: { 'Content-Type': 'application/json' },
  body: corps === undefined ? undefined : JSON.stringify(corps),
});

export const api = {
  get: <T>(chemin: string) => requete<T>(chemin),
  post: <T>(chemin: string, corps?: unknown) => requete<T>(chemin, json('POST', corps)),
  put: <T>(chemin: string, corps: unknown) => requete<T>(chemin, json('PUT', corps)),
  delete: (chemin: string) => requete<void>(chemin, { method: 'DELETE' }),
  /** Envoi d'un formulaire avec fichier(s), sans suivi de progression. */
  formulaire: <T>(chemin: string, methode: 'POST' | 'PUT', donnees: FormData) =>
    requete<T>(chemin, { method: methode, body: donnees }),
};

/**
 * Envoie un formulaire avec suivi de la progression (0 → 100 %).
 * fetch() ne sait pas suivre l'envoi : on utilise donc XMLHttpRequest.
 */
export function envoyerAvecProgression<T>(
  chemin: string,
  donnees: FormData,
  surProgression: (pourcentage: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise((resoudre, rejeter) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', chemin);
    xhr.responseType = 'json';

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) surProgression(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resoudre(xhr.response as T);
      else
        rejeter(
          new ErreurApi(
            xhr.status,
            (xhr.response as { erreur?: string })?.erreur ?? 'Échec de l’envoi',
          ),
        );
    };
    xhr.onerror = () => rejeter(new ErreurApi(0, 'Connexion perdue pendant l’envoi.'));
    xhr.onabort = () => rejeter(new ErreurApi(0, 'Envoi annulé.'));

    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(donnees);
  });
}
