// =============================================================================
//  Génération des miniatures DANS LE NAVIGATEUR, avant l'envoi.
//  - Vidéo : on capture une image à 10 % du film avec un <canvas>
//  - Photo : on crée une version réduite (bien plus légère à afficher)
//  Avantage : aucun logiciel à installer sur le serveur (pas de ffmpeg).
// =============================================================================

const LARGEUR_MINIATURE = 640;

/** Attend un événement d'un élément <video> (avec délai maximum). */
function attendre(element: HTMLMediaElement, evenement: string, delaiMs = 15000): Promise<void> {
  return new Promise((resoudre, rejeter) => {
    const minuteur = setTimeout(() => rejeter(new Error('Délai dépassé')), delaiMs);
    element.addEventListener(
      evenement,
      () => {
        clearTimeout(minuteur);
        resoudre();
      },
      { once: true },
    );
    element.addEventListener('error', () => rejeter(new Error('Format non lisible')), {
      once: true,
    });
  });
}

/** Dessine une image/vidéo dans un canvas réduit et renvoie un JPEG. */
function versJpeg(
  source: CanvasImageSource,
  largeur: number,
  hauteur: number,
): Promise<Blob | null> {
  const echelle = Math.min(1, LARGEUR_MINIATURE / largeur);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(largeur * echelle);
  canvas.height = Math.round(hauteur * echelle);
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resoudre) => canvas.toBlob(resoudre, 'image/jpeg', 0.82));
}

/** Analyse une vidéo : durée + image d'aperçu. */
export async function analyserVideo(
  fichier: File,
): Promise<{ miniature: Blob | null; duree: number | null }> {
  const url = URL.createObjectURL(fichier);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await attendre(video, 'loadedmetadata');
    const duree = Number.isFinite(video.duration) ? video.duration : null;

    // On se place à 10 % de la vidéo (max 5 min) pour éviter un écran noir
    video.currentTime = duree ? Math.min(duree * 0.1, 300) : 1;
    await attendre(video, 'seeked');

    const miniature = await versJpeg(video, video.videoWidth, video.videoHeight);
    return { miniature, duree: duree ? Math.round(duree) : null };
  } catch {
    // Format que le navigateur ne sait pas lire (certains .mkv, .avi…)
    return { miniature: null, duree: null };
  } finally {
    video.removeAttribute('src');
    URL.revokeObjectURL(url);
  }
}

/** Crée une version réduite d'une photo. */
export async function reduireImage(fichier: File): Promise<Blob | null> {
  try {
    const image = await createImageBitmap(fichier);
    const blob = await versJpeg(image, image.width, image.height);
    image.close();
    return blob;
  } catch {
    return null;
  }
}
