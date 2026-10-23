# MediaCloud

**Votre plateforme multimédia personnelle**, comme un mini Netflix / YouTube / Spotify, mais hébergée chez vous.
Films, séries, vidéos, musique, photos et documents sont rangés sur votre propre disque (PC ou NAS) et accessibles
depuis tous les appareils de la maison, via le navigateur.

> Développé par **LM-Code**.

## Fonctionnalités

- **6 bibliothèques** : films, séries (regroupées par saison/épisode), vidéos, musique, photos, documents
- **Envoi de fichiers** par glisser-déposer (n'importe où sur la page), plusieurs fichiers à la fois, barre de progression
- **Miniatures automatiques** : image capturée dans les vidéos, version réduite des photos, pochette lue dans les MP3/FLAC
- **Lecteur vidéo** plein écran : reprise là où on s'était arrêté, épisode suivant automatique, raccourcis clavier
- **Lecteur de musique** permanent (style Spotify) : file d'attente, aléatoire, répétition, touches multimédia du clavier
- **Visionneuse** photos (diaporama) et documents (aperçu PDF, texte, images…)
- **Recherche** instantanée dans toute la bibliothèque (insensible aux accents)
- **Favoris**, **playlists**, **catégories** personnalisables, tri et filtres
- **Statistiques** et jauge d'espace disque
- **Thème** sombre / clair et 6 couleurs d'accent, interface responsive (mobile, tablette, TV)

## Technologies

| Partie          | Outils                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| Frontend        | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, React Router, Lucide |
| Backend         | Node.js, Express 5, TypeScript, Multer, Zod, music-metadata, Helmet      |
| Base de données | MySQL / MariaDB (WAMP, XAMPP, NAS…)                                     |
| Stockage        | Dossier `stockage/` sur le disque (configurable)                        |

## Installation

Prérequis : **Node.js 20+** et un serveur **MySQL** démarré (WAMP, XAMPP, MariaDB…).

```bash
git clone https://github.com/LM-Code-Be/media-cloud.git
cd media-cloud
npm install

# Configuration (copier puis adapter si besoin)
cp backend/.env.example backend/.env

# Lancement en développement (frontend + backend)
npm run dev
```

Ouvrez **http://localhost:3000**. La base `media_cloud` et ses tables sont créées automatiquement au premier démarrage.

### Configuration (`backend/.env`)

| Variable           | Rôle                                         | Défaut        |
| ------------------ | -------------------------------------------- | ------------- |
| `PORT`             | Port du serveur                              | `4000`        |
| `DB_HOTE`          | Adresse de MySQL                             | `127.0.0.1`   |
| `DB_PORT`          | Port de MySQL                                | `3306`        |
| `DB_UTILISATEUR`   | Utilisateur MySQL                            | `root`        |
| `DB_MOT_DE_PASSE`  | Mot de passe MySQL                           | _(vide)_      |
| `DB_NOM`           | Nom de la base                               | `media_cloud` |
| `DOSSIER_STOCKAGE` | Dossier des fichiers (relatif ou absolu)     | `stockage`    |
| `TAILLE_MAX_MO`    | Taille max d'un fichier envoyé (Mo)          | `20480`       |

### Production (PC ou NAS)

```bash
npm run build   # compile le frontend et le backend
npm start       # un seul serveur sur http://<ip-de-la-machine>:4000
```

## Scripts

| Commande            | Description                                       |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Frontend (port 3000) + backend (port 4000)        |
| `npm run build`     | Compilation pour la production                    |
| `npm start`         | Démarre le serveur de production                  |
| `npm run db:init`   | Crée la base et les tables sans lancer le serveur |
| `npm run typecheck` | Vérifie les types TypeScript                      |

## Structure

```
media-cloud/
├── backend/          API Express (routes, base de données, stockage)
├── frontend/         Application React
├── database/         schema.sql (tables) + donnees.sql (catégories par défaut)
└── stockage/         Fichiers envoyés (ignoré par Git)
```

## Formats lus dans le navigateur

Vidéo : **MP4 (H.264)** et **WebM** partout. Les MKV/AVI/HEVC peuvent ne pas être lisibles selon le navigateur :
ils restent stockés et téléchargeables (convertissez-les avec HandBrake pour les lire en ligne).
Audio : MP3, AAC/M4A, FLAC, OGG, WAV. Documents : aperçu des PDF, images et fichiers texte.

## Sécurité

MediaCloud est prévu pour un **réseau local** : il n'y a pas de comptes utilisateurs. N'exposez pas le port sur
Internet sans ajouter une authentification (ou passez par un VPN).

## Licence

MIT — © LM-Code
