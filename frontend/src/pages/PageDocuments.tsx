// =============================================================================
//  Page "Documents" : liste type explorateur de fichiers, avec aperçu.
// =============================================================================
import {
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  Heart,
  type LucideIcon,
  Plus,
} from 'lucide-react';
import React, { useState } from 'react';
import { EnTetePage } from '@/components/layout/EnTetePage';
import { BarreFiltres, type Tri } from '@/components/medias/BarreFiltres';
import { MenuMedia } from '@/components/medias/MenuMedia';
import { Button } from '@/components/ui/button';
import { EtatErreur, EtatVide } from '@/components/ui/etats';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { useRequete } from '@/hooks/useRequete';
import { useTitrePage } from '@/hooks/useTitrePage';
import { TYPES } from '@/lib/medias';
import { cn, extension, formaterDate, formaterTaille } from '@/lib/utils';
import { mediasService } from '@/services/medias.service';
import type { Media } from '@/types';

/** Icône et couleur selon le format du fichier. */
export function iconeFichier(media: Media): { icone: LucideIcon; couleur: string } {
  const ext = extension(media.nomOriginal).toLowerCase();
  if (ext === 'pdf') return { icone: FileType, couleur: 'text-red-500 bg-red-500/10' };
  if (['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext))
    return { icone: FileText, couleur: 'text-blue-500 bg-blue-500/10' };
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext))
    return { icone: FileSpreadsheet, couleur: 'text-emerald-500 bg-emerald-500/10' };
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
    return { icone: FileArchive, couleur: 'text-amber-500 bg-amber-500/10' };
  if (['html', 'css', 'js', 'ts', 'json', 'xml', 'php', 'py', 'sql'].includes(ext))
    return { icone: FileCode, couleur: 'text-cyan-500 bg-cyan-500/10' };
  if (media.mime.startsWith('image/'))
    return { icone: FileImage, couleur: 'text-pink-500 bg-pink-500/10' };
  if (media.mime.startsWith('video/'))
    return { icone: FileVideo, couleur: 'text-violet-500 bg-violet-500/10' };
  if (media.mime.startsWith('audio/'))
    return { icone: FileAudio, couleur: 'text-teal-500 bg-teal-500/10' };
  return { icone: FileText, couleur: 'text-muted-foreground bg-muted' };
}

const PageDocuments: React.FC = () => {
  useTitrePage('Documents');
  const config = TYPES.document;
  const { categoriesDuType, ouvrirEnvoi, ouvrirApercu } = useBibliotheque();
  const [categorie, setCategorie] = useState<number | null>(null);
  const [tri, setTri] = useState<Tri>('recent');

  const {
    donnees: documents,
    chargement,
    erreur,
  } = useRequete(
    () => mediasService.lister({ type: 'document', categorie, tri }),
    [categorie, tri],
  );
  const total = documents?.reduce((s, d) => s + d.taille, 0) ?? 0;

  return (
    <div>
      <EnTetePage
        icone={config.icone}
        titre="Documents"
        couleur={config.couleur}
        fond={config.fond}
        sousTitre={
          documents ? `${documents.length} document(s) · ${formaterTaille(total)}` : 'Chargement…'
        }
        actions={
          <Button
            onClick={() => ouvrirEnvoi({ type: 'document', categorieId: categorie ?? undefined })}
          >
            <Plus className="h-4 w-4" /> Ajouter des documents
          </Button>
        }
      />

      <div className="mb-6">
        <BarreFiltres
          categories={categoriesDuType('document')}
          categorie={categorie}
          onCategorie={setCategorie}
          tri={tri}
          onTri={setTri}
          tris={['recent', 'ancien', 'titre', 'taille']}
        />
      </div>

      {erreur && <EtatErreur message={erreur} />}
      {chargement && !documents && <div className="h-64 animate-pulse rounded-2xl bg-muted" />}

      {documents && documents.length === 0 && (
        <EtatVide
          icone={FileText}
          titre="Aucun document pour l’instant"
          message="PDF, Word, Excel, archives… tous les formats sont acceptés. Les PDF s’ouvrent directement dans l’application."
          action={
            <Button onClick={() => ouvrirEnvoi({ type: 'document' })}>
              <Plus className="h-4 w-4" /> Ajouter des documents
            </Button>
          }
        />
      )}

      {documents && documents.length > 0 && (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="hidden grid-cols-[1fr_9rem_7rem_8rem_2.5rem] gap-4 border-b px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <span>Nom</span>
            <span>Catégorie</span>
            <span className="text-right">Taille</span>
            <span>Ajouté le</span>
            <span />
          </div>
          <ul className="divide-y">
            {documents.map((doc, i) => {
              const { icone: Icone, couleur } = iconeFichier(doc);
              return (
                <li
                  key={doc.id}
                  onClick={() => ouvrirApercu(documents, i)}
                  className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 transition hover:bg-accent/60 md:grid-cols-[1fr_9rem_7rem_8rem_2.5rem]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                        couleur,
                      )}
                    >
                      <Icone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        <span className="truncate">{doc.titre}</span>
                        {doc.favori && (
                          <Heart className="h-3 w-3 shrink-0 fill-rose-500 text-rose-500" />
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {extension(doc.nomOriginal) || 'Fichier'}
                        <span className="md:hidden"> · {formaterTaille(doc.taille)}</span>
                      </p>
                    </div>
                  </div>
                  <span className="hidden truncate text-sm text-muted-foreground md:block">
                    {doc.categorieNom ?? '—'}
                  </span>
                  <span className="hidden text-right text-sm tabular-nums text-muted-foreground md:block">
                    {formaterTaille(doc.taille)}
                  </span>
                  <span className="hidden text-sm text-muted-foreground md:block">
                    {formaterDate(doc.ajouteLe)}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <MenuMedia media={doc} onLire={() => ouvrirApercu(documents, i)} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PageDocuments;
