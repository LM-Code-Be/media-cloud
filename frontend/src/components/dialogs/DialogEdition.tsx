// =============================================================================
//  Fenêtre de modification d'un média : titre, description, catégorie,
//  champs spécifiques (artiste, saison…) et miniature.
// =============================================================================
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Vignette } from '@/components/medias/Vignette';
import { Button } from '@/components/ui/button';
import { Fenetre } from '@/components/ui/fenetre';
import { toast } from '@/components/ui/use-toast';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { TYPES, estVideo } from '@/lib/medias';
import { formaterTaille } from '@/lib/utils';
import { mediasService } from '@/services/medias.service';

/** Valeurs du formulaire (tout en texte, comme dans les champs HTML). */
const VIDE = {
  titre: '',
  description: '',
  categorieId: '',
  annee: '',
  artiste: '',
  album: '',
  serie: '',
  saison: '',
  episode: '',
};

export const DialogEdition: React.FC = () => {
  const { mediaEnEdition: media, ouvrirEdition, categoriesDuType, rafraichir } = useBibliotheque();
  const [valeurs, setValeurs] = useState(VIDE);
  const [miniature, setMiniature] = useState<File | null>(null);
  const [supprimerMiniature, setSupprimerMiniature] = useState(false);
  const [apercu, setApercu] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const champImage = useRef<HTMLInputElement>(null);

  // Remplit le formulaire avec les valeurs actuelles du média
  useEffect(() => {
    if (!media) return;
    const texte = (v: string | number | null) => (v == null ? '' : String(v));
    setValeurs({
      titre: media.titre,
      description: texte(media.description),
      categorieId: texte(media.categorieId),
      annee: texte(media.annee),
      artiste: texte(media.artiste),
      album: texte(media.album),
      serie: texte(media.serie),
      saison: texte(media.saison),
      episode: texte(media.episode),
    });
    setMiniature(null);
    setSupprimerMiniature(false);
    setApercu(null);
  }, [media]);

  // Libère l'URL temporaire de l'aperçu
  useEffect(() => () => void (apercu && URL.revokeObjectURL(apercu)), [apercu]);

  if (!media) return null;

  const changer =
    (cle: keyof typeof VIDE) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValeurs({ ...valeurs, [cle]: e.target.value });

  const nombre = (v: string) => (v === '' ? null : Number(v));

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnCours(true);
    try {
      await mediasService.modifier(
        media.id,
        {
          titre: valeurs.titre.trim(),
          description: valeurs.description.trim() || null,
          categorieId: nombre(valeurs.categorieId),
          annee: nombre(valeurs.annee),
          artiste: valeurs.artiste.trim() || null,
          album: valeurs.album.trim() || null,
          serie: media.type === 'serie' ? valeurs.serie.trim() || null : undefined,
          saison: media.type === 'serie' ? nombre(valeurs.saison) : undefined,
          episode: media.type === 'serie' ? nombre(valeurs.episode) : undefined,
        },
        miniature,
        supprimerMiniature,
      );
      toast({ title: 'Modifications enregistrées', description: valeurs.titre });
      rafraichir();
      ouvrirEdition(null);
    } catch (erreur) {
      toast({ variant: 'destructive', title: 'Erreur', description: (erreur as Error).message });
    } finally {
      setEnCours(false);
    }
  };

  const urlMiniature = apercu ?? (supprimerMiniature ? null : media.urlMiniature);
  const Icone = TYPES[media.type].icone;

  return (
    <Fenetre
      ouvert
      onFermer={() => ouvrirEdition(null)}
      bloquer={enCours}
      titre="Modifier les informations"
      description={
        <span className="flex items-center gap-1.5">
          <Icone className="h-3.5 w-3.5" /> {media.nomOriginal} · {formaterTaille(media.taille)}
        </span>
      }
      className="max-w-2xl"
      pied={
        <>
          <Button variant="ghost" onClick={() => ouvrirEdition(null)} disabled={enCours}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="formulaire-edition"
            disabled={enCours || !valeurs.titre.trim()}
          >
            {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </>
      }
    >
      <form
        id="formulaire-edition"
        onSubmit={(e) => void enregistrer(e)}
        className="grid gap-5 sm:grid-cols-[180px_1fr]"
      >
        {/* Miniature */}
        <div className="space-y-2">
          <span className="etiquette">Miniature</span>
          <div
            className={`overflow-hidden rounded-xl border ${media.type === 'musique' ? 'aspect-square' : 'aspect-video'}`}
          >
            <Vignette key={urlMiniature ?? 'aucune'} url={urlMiniature} type={media.type} alt="" />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => champImage.current?.click()}
            >
              <ImagePlus className="h-4 w-4" /> Changer
            </Button>
            {urlMiniature && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Retirer la miniature"
                onClick={() => {
                  setMiniature(null);
                  setApercu(null);
                  setSupprimerMiniature(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input
            ref={champImage}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const fichier = e.target.files?.[0];
              if (!fichier) return;
              setMiniature(fichier);
              setApercu(URL.createObjectURL(fichier));
              setSupprimerMiniature(false);
            }}
          />
        </div>

        {/* Champs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="etiquette">Titre *</span>
            <input
              className="champ"
              value={valeurs.titre}
              onChange={changer('titre')}
              required
              maxLength={255}
            />
          </label>

          {media.type === 'serie' && (
            <>
              <label className="sm:col-span-2">
                <span className="etiquette">Nom de la série</span>
                <input className="champ" value={valeurs.serie} onChange={changer('serie')} />
              </label>
              <label>
                <span className="etiquette">Saison</span>
                <input
                  type="number"
                  min={0}
                  className="champ"
                  value={valeurs.saison}
                  onChange={changer('saison')}
                />
              </label>
              <label>
                <span className="etiquette">Épisode</span>
                <input
                  type="number"
                  min={0}
                  className="champ"
                  value={valeurs.episode}
                  onChange={changer('episode')}
                />
              </label>
            </>
          )}

          {media.type === 'musique' && (
            <>
              <label>
                <span className="etiquette">Artiste</span>
                <input className="champ" value={valeurs.artiste} onChange={changer('artiste')} />
              </label>
              <label>
                <span className="etiquette">Album</span>
                <input className="champ" value={valeurs.album} onChange={changer('album')} />
              </label>
            </>
          )}

          {(estVideo(media.type) || media.type === 'musique') && (
            <label>
              <span className="etiquette">Année</span>
              <input
                type="number"
                min={1800}
                max={2100}
                className="champ"
                value={valeurs.annee}
                onChange={changer('annee')}
              />
            </label>
          )}

          <label>
            <span className="etiquette">Catégorie</span>
            <select className="champ" value={valeurs.categorieId} onChange={changer('categorieId')}>
              <option value="">Aucune catégorie</option>
              {categoriesDuType(media.type).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="etiquette">Description</span>
            <textarea
              rows={4}
              className="champ resize-y"
              value={valeurs.description}
              onChange={changer('description')}
              placeholder="Résumé, notes personnelles…"
            />
          </label>
        </div>
      </form>
    </Fenetre>
  );
};
