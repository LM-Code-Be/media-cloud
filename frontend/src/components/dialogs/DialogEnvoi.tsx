// =============================================================================
//  Fenêtre d'envoi de fichiers (upload)
//  1. On choisit le type (film, musique…) — deviné automatiquement
//  2. On glisse ou sélectionne un ou plusieurs fichiers
//  3. Les miniatures et durées sont calculées dans le navigateur
//  4. Les fichiers partent un par un, avec une barre de progression
// =============================================================================
import { AlertCircle, CheckCircle2, Loader2, UploadCloud, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fenetre } from '@/components/ui/fenetre';
import { toast } from '@/components/ui/use-toast';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { LISTE_TYPES, TYPES, deviner, estVideo } from '@/lib/medias';
import { analyserVideo, reduireImage } from '@/lib/miniatures';
import {
  cn,
  detecterEpisode,
  formaterDuree,
  formaterTaille,
  titreDepuisNomFichier,
} from '@/lib/utils';
import { categoriesService } from '@/services/categories.service';
import { mediasService } from '@/services/medias.service';
import type { TypeMedia } from '@/types';

type Statut = 'attente' | 'envoi' | 'termine' | 'erreur';

/** Un fichier de la liste d'envoi. */
interface Element {
  cle: string;
  fichier: File;
  titre: string;
  titreModifie: boolean;
  saison: number | null;
  episode: number | null;
  miniature: Blob | null;
  apercu: string | null; // URL temporaire de la miniature
  duree: number | null;
  analyse: boolean; // miniature en cours de calcul
  statut: Statut;
  progression: number;
  erreur?: string;
}

export const DialogEnvoi: React.FC = () => {
  const { envoi, fermerEnvoi, categoriesDuType, rafraichir } = useBibliotheque();
  const ouvert = envoi !== null;

  const [type, setType] = useState<TypeMedia>('video');
  const [typeChoisi, setTypeChoisi] = useState(false);
  const [elements, setElements] = useState<Element[]>([]);
  const [categorie, setCategorie] = useState(''); // '' = aucune, 'nouvelle', ou id
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [communs, setCommuns] = useState({
    annee: '',
    artiste: '',
    album: '',
    serie: '',
    saison: '',
  });
  const [enCours, setEnCours] = useState(false);
  const [survol, setSurvol] = useState(false);

  const champFichier = useRef<HTMLInputElement>(null);
  const annulation = useRef<AbortController | null>(null);

  // À l'ouverture : on applique le pré-remplissage (type, série, fichiers déposés…)
  useEffect(() => {
    if (!envoi) return;
    if (envoi.type) {
      setType(envoi.type);
      setTypeChoisi(true);
    }
    if (envoi.categorieId) setCategorie(String(envoi.categorieId));
    if (envoi.serie || envoi.saison) {
      setCommuns((c) => ({
        ...c,
        serie: envoi.serie ?? '',
        saison: envoi.saison ? String(envoi.saison) : '',
      }));
    }
    if (envoi.fichiers?.length) ajouterFichiers(envoi.fichiers, !envoi.type);
  }, [envoi]); // volontairement : uniquement quand cette valeur change

  /** Modifie un élément de la liste. */
  const modifier = (cle: string, changements: Partial<Element>) =>
    setElements((liste) => liste.map((el) => (el.cle === cle ? { ...el, ...changements } : el)));

  /** Ajoute des fichiers à la liste et lance le calcul des miniatures. */
  function ajouterFichiers(fichiers: File[], devinerType = !typeChoisi) {
    if (fichiers.length === 0) return;
    if (devinerType) {
      setType(deviner(fichiers[0]));
      setTypeChoisi(true);
    }

    const nouveaux: Element[] = fichiers.map((fichier) => {
      const ep = detecterEpisode(fichier.name);
      return {
        cle: `${fichier.name}-${fichier.size}-${Math.random()}`,
        fichier,
        titre: titreDepuisNomFichier(fichier.name),
        titreModifie: false,
        saison: ep?.saison ?? null,
        episode: ep?.episode ?? null,
        miniature: null,
        apercu: null,
        duree: null,
        analyse: fichier.type.startsWith('video/') || fichier.type.startsWith('image/'),
        statut: 'attente',
        progression: 0,
      };
    });
    setElements((liste) => [...liste, ...nouveaux]);

    // Analyse en arrière-plan (miniature + durée)
    for (const el of nouveaux) {
      const { fichier } = el;
      if (fichier.type.startsWith('video/')) {
        void analyserVideo(fichier).then(({ miniature, duree }) =>
          modifier(el.cle, {
            miniature,
            duree,
            analyse: false,
            apercu: miniature ? URL.createObjectURL(miniature) : null,
          }),
        );
      } else if (fichier.type.startsWith('image/')) {
        void reduireImage(fichier).then((miniature) =>
          modifier(el.cle, {
            miniature,
            analyse: false,
            apercu: miniature ? URL.createObjectURL(miniature) : null,
          }),
        );
      }
    }
  }

  const retirer = (el: Element) => {
    if (el.apercu) URL.revokeObjectURL(el.apercu);
    setElements((liste) => liste.filter((e) => e.cle !== el.cle));
  };

  /** Remet la fenêtre à zéro et la ferme. */
  const fermer = () => {
    annulation.current?.abort();
    elements.forEach((el) => el.apercu && URL.revokeObjectURL(el.apercu));
    setElements([]);
    setTypeChoisi(false);
    setCategorie('');
    setNouvelleCategorie('');
    setCommuns({ annee: '', artiste: '', album: '', serie: '', saison: '' });
    setEnCours(false);
    fermerEnvoi();
  };

  /** Envoie tous les fichiers, l'un après l'autre. */
  const envoyer = async () => {
    if (type === 'serie' && !communs.serie.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nom de la série manquant',
        description: 'Indiquez le nom de la série.',
      });
      return;
    }
    setEnCours(true);
    annulation.current = new AbortController();

    try {
      // Création de la nouvelle catégorie si besoin
      let categorieId: number | null = null;
      if (categorie === 'nouvelle' && nouvelleCategorie.trim()) {
        const creee = await categoriesService.creer(type, nouvelleCategorie.trim());
        categorieId = creee.id;
        setCategorie(String(creee.id));
        setNouvelleCategorie('');
      } else if (categorie && categorie !== 'nouvelle') {
        categorieId = Number(categorie);
      }

      let reussis = 0;
      for (const el of elements) {
        if (el.statut === 'termine') continue;
        if (annulation.current.signal.aborted) break;

        modifier(el.cle, { statut: 'envoi', progression: 0, erreur: undefined });
        try {
          await mediasService.envoyer(
            {
              type,
              fichier: el.fichier,
              // Musique : sans modification, on laisse le serveur lire le titre dans les tags
              titre:
                type === 'musique' && !el.titreModifie ? undefined : el.titre.trim() || undefined,
              categorieId,
              annee: communs.annee ? Number(communs.annee) : null,
              artiste: communs.artiste || null,
              album: communs.album || null,
              serie: type === 'serie' ? communs.serie.trim() : null,
              saison: el.saison ?? (communs.saison ? Number(communs.saison) : null),
              episode: el.episode,
              duree: el.duree,
              // Une miniature d'image n'a de sens que pour les photos, celle d'une vidéo pour les vidéos
              miniature: estVideo(type) || type === 'photo' ? el.miniature : null,
            },
            (progression) => modifier(el.cle, { progression }),
            annulation.current.signal,
          );
          modifier(el.cle, { statut: 'termine', progression: 100 });
          reussis++;
        } catch (erreur) {
          modifier(el.cle, { statut: 'erreur', erreur: (erreur as Error).message });
        }
      }

      if (reussis > 0) rafraichir();
      const echecs = elements.filter((e) => e.statut !== 'termine').length - reussis;
      if (echecs <= 0) {
        toast({
          title: 'Envoi terminé',
          description: `${reussis} fichier${reussis > 1 ? 's ajoutés' : ' ajouté'} à votre bibliothèque.`,
        });
        fermer();
      }
    } catch (erreur) {
      toast({ variant: 'destructive', title: 'Erreur', description: (erreur as Error).message });
    } finally {
      setEnCours(false);
    }
  };

  const tailleTotale = elements.reduce((total, el) => total + el.fichier.size, 0);
  const categories = categoriesDuType(type);
  const enAnalyse = elements.some((el) => el.analyse);

  return (
    <Fenetre
      ouvert={ouvert}
      onFermer={fermer}
      bloquer={enCours}
      titre="Envoyer des fichiers"
      description="Vos fichiers sont copiés dans le dossier de stockage de MediaCloud."
      className="max-w-3xl"
      pied={
        <>
          <p className="mr-auto self-center text-sm text-muted-foreground">
            {elements.length > 0 &&
              `${elements.length} fichier${elements.length > 1 ? 's' : ''} · ${formaterTaille(tailleTotale)}`}
          </p>
          {enCours ? (
            <Button variant="outline" onClick={() => annulation.current?.abort()}>
              Annuler l’envoi
            </Button>
          ) : (
            <Button variant="ghost" onClick={fermer}>
              Fermer
            </Button>
          )}
          <Button
            onClick={() => void envoyer()}
            disabled={enCours || elements.length === 0 || enAnalyse}
          >
            {enCours || enAnalyse ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {enCours ? 'Envoi en cours…' : enAnalyse ? 'Analyse…' : 'Envoyer'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 1. Type de média */}
        <div>
          <span className="etiquette">Type de contenu</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LISTE_TYPES.map((t) => {
              const { icone: Icone, couleur, libelle } = TYPES[t];
              return (
                <button
                  key={t}
                  disabled={enCours}
                  onClick={() => {
                    setType(t);
                    setTypeChoisi(true);
                    setCategorie('');
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition',
                    type === t
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  <Icone className={cn('h-5 w-5', couleur)} />
                  {libelle}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Zone de dépôt */}
        <div
          onClick={() => !enCours && champFichier.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            if (!enCours) ajouterFichiers(Array.from(e.dataTransfer.files));
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition',
            elements.length > 0 ? 'py-5' : 'py-10',
            survol ? 'border-primary bg-primary/10' : 'hover:border-primary/60 hover:bg-accent/50',
          )}
        >
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="font-semibold">Glissez vos fichiers ici</p>
          <p className="text-sm text-muted-foreground">
            ou cliquez pour parcourir votre ordinateur
          </p>
          <input
            ref={champFichier}
            type="file"
            multiple
            accept={typeChoisi ? TYPES[type].accepte : undefined}
            className="hidden"
            onChange={(e) => {
              ajouterFichiers(Array.from(e.target.files ?? []));
              e.target.value = ''; // permet de rechoisir le même fichier
            }}
          />
        </div>

        {/* 3. Liste des fichiers */}
        {elements.length > 0 && (
          <ul className="space-y-2">
            {elements.map((el) => (
              <li
                key={el.cle}
                className="flex items-center gap-3 rounded-xl border bg-background/50 p-2.5"
              >
                <div className="relative grid h-12 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                  {el.apercu ? (
                    <img src={el.apercu} alt="" className="h-full w-full object-cover" />
                  ) : el.analyse ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    React.createElement(TYPES[type].icone, {
                      className: cn('h-5 w-5', TYPES[type].couleur),
                    })
                  )}
                  {el.duree ? (
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[9px] text-white">
                      {formaterDuree(el.duree)}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      value={el.titre}
                      disabled={enCours || el.statut === 'termine'}
                      onChange={(e) =>
                        modifier(el.cle, { titre: e.target.value, titreModifie: true })
                      }
                      className="champ h-8 py-1"
                      aria-label="Titre"
                      placeholder={type === 'musique' ? 'Titre (lu dans le fichier)' : 'Titre'}
                    />
                    {type === 'serie' && (
                      <>
                        <input
                          type="number"
                          min={0}
                          value={el.saison ?? ''}
                          placeholder="S"
                          title="Saison"
                          onChange={(e) =>
                            modifier(el.cle, {
                              saison: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="champ h-8 w-14 px-2 py-1"
                        />
                        <input
                          type="number"
                          min={0}
                          value={el.episode ?? ''}
                          placeholder="E"
                          title="Épisode"
                          onChange={(e) =>
                            modifier(el.cle, {
                              episode: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="champ h-8 w-14 px-2 py-1"
                        />
                      </>
                    )}
                  </div>

                  {el.statut === 'envoi' ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${el.progression}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                        {el.progression} %
                      </span>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        'flex items-center gap-1.5 truncate text-xs text-muted-foreground',
                        el.statut === 'erreur' && 'text-destructive',
                        el.statut === 'termine' && 'text-emerald-500',
                      )}
                    >
                      {el.statut === 'termine' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {el.statut === 'erreur' && <AlertCircle className="h-3.5 w-3.5" />}
                      {el.statut === 'erreur'
                        ? el.erreur
                        : `${el.fichier.name} · ${formaterTaille(el.fichier.size)}`}
                    </p>
                  )}
                </div>

                {!enCours && el.statut !== 'termine' && (
                  <button
                    onClick={() => retirer(el)}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    aria-label="Retirer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* 4. Informations communes à tous les fichiers */}
        <div className="grid gap-4 sm:grid-cols-2">
          {type === 'serie' && (
            <>
              <label className="sm:col-span-1">
                <span className="etiquette">Nom de la série *</span>
                <input
                  className="champ"
                  value={communs.serie}
                  onChange={(e) => setCommuns({ ...communs, serie: e.target.value })}
                  placeholder="Ex : Breaking Bad"
                />
              </label>
              <label>
                <span className="etiquette">Saison (par défaut)</span>
                <input
                  type="number"
                  min={0}
                  className="champ"
                  value={communs.saison}
                  onChange={(e) => setCommuns({ ...communs, saison: e.target.value })}
                  placeholder="Détectée dans le nom (S01E02)"
                />
              </label>
            </>
          )}

          {type === 'musique' && (
            <>
              <label>
                <span className="etiquette">Artiste</span>
                <input
                  className="champ"
                  value={communs.artiste}
                  onChange={(e) => setCommuns({ ...communs, artiste: e.target.value })}
                  placeholder="Lu automatiquement dans le fichier"
                />
              </label>
              <label>
                <span className="etiquette">Album</span>
                <input
                  className="champ"
                  value={communs.album}
                  onChange={(e) => setCommuns({ ...communs, album: e.target.value })}
                  placeholder="Lu automatiquement dans le fichier"
                />
              </label>
            </>
          )}

          {(type === 'film' || type === 'serie' || type === 'video') && (
            <label>
              <span className="etiquette">Année</span>
              <input
                type="number"
                min={1800}
                max={2100}
                className="champ"
                value={communs.annee}
                onChange={(e) => setCommuns({ ...communs, annee: e.target.value })}
                placeholder="Ex : 2024"
              />
            </label>
          )}

          <label>
            <span className="etiquette">Catégorie</span>
            <select
              className="champ"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
            >
              <option value="">Aucune catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
              <option value="nouvelle">＋ Nouvelle catégorie…</option>
            </select>
          </label>

          {categorie === 'nouvelle' && (
            <label>
              <span className="etiquette">Nom de la nouvelle catégorie</span>
              <input
                autoFocus
                className="champ"
                value={nouvelleCategorie}
                onChange={(e) => setNouvelleCategorie(e.target.value)}
                placeholder="Ex : Vacances 2025"
              />
            </label>
          )}
        </div>
      </div>
    </Fenetre>
  );
};
