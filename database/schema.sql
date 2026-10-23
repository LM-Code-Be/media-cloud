-- =============================================================================
--  MediaCloud — Structure de la base de données (MySQL / MariaDB)
--  Développé par LM-Code
--
--  Ce fichier est exécuté automatiquement au démarrage du serveur.
--  Toutes les instructions utilisent "IF NOT EXISTS" : on peut donc
--  le relancer sans risque, il ne casse jamais les données existantes.
-- =============================================================================


-- -----------------------------------------------------------------------------
--  Table "categories"
--  Une catégorie appartient à un type de média (ex : "Action" pour les films).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type      ENUM('film', 'serie', 'video', 'musique', 'photo', 'document') NOT NULL,
  nom       VARCHAR(100) NOT NULL,
  cree_le   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  -- Interdit deux catégories avec le même nom pour un même type
  UNIQUE KEY uq_categories_type_nom (type, nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
--  Table "medias"
--  Chaque ligne = un fichier stocké dans le dossier "stockage/".
--  Certaines colonnes ne servent qu'à certains types :
--    - artiste / album      → musique
--    - serie / saison / episode → séries
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medias (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type              ENUM('film', 'serie', 'video', 'musique', 'photo', 'document') NOT NULL,
  titre             VARCHAR(255) NOT NULL,
  description       TEXT NULL,
  categorie_id      INT UNSIGNED NULL,
  annee             SMALLINT UNSIGNED NULL,

  -- Musique
  artiste           VARCHAR(255) NULL,
  album             VARCHAR(255) NULL,

  -- Séries
  serie             VARCHAR(255) NULL,
  saison            SMALLINT UNSIGNED NULL,
  episode           SMALLINT UNSIGNED NULL,

  -- Informations sur le fichier
  fichier           VARCHAR(255) NOT NULL,          -- chemin relatif dans stockage/ (ex : film/123-abc.mp4)
  nom_original      VARCHAR(255) NOT NULL,          -- nom du fichier envoyé par l'utilisateur
  mime              VARCHAR(120) NOT NULL,          -- type MIME (video/mp4, audio/mpeg…)
  taille            BIGINT UNSIGNED NOT NULL DEFAULT 0, -- taille en octets
  duree             INT UNSIGNED NULL,              -- durée en secondes (vidéo / audio)
  miniature         VARCHAR(255) NULL,              -- image d'aperçu (miniatures/xxx.jpg)

  -- Utilisation
  favori            TINYINT(1) NOT NULL DEFAULT 0,
  vues              INT UNSIGNED NOT NULL DEFAULT 0,
  derniere_lecture  DATETIME NULL,

  ajoute_le         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifie_le        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_medias_type (type),
  KEY idx_medias_ajoute_le (ajoute_le),
  KEY idx_medias_serie (serie),
  KEY idx_medias_favori (favori),

  -- Si on supprime une catégorie, les médias restent mais sans catégorie
  CONSTRAINT fk_medias_categorie
    FOREIGN KEY (categorie_id) REFERENCES categories (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
--  Table "progressions"
--  Mémorise où l'utilisateur s'est arrêté dans une vidéo ou une musique.
--  Une seule ligne par média (media_id est la clé primaire).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progressions (
  media_id       INT UNSIGNED NOT NULL,
  position       DOUBLE NOT NULL DEFAULT 0,      -- en secondes
  duree          DOUBLE NOT NULL DEFAULT 0,      -- en secondes
  termine        TINYINT(1) NOT NULL DEFAULT 0,  -- 1 si regardé à plus de 95 %
  mis_a_jour_le  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (media_id),
  KEY idx_progressions_mis_a_jour_le (mis_a_jour_le),

  -- Si le média est supprimé, sa progression disparaît aussi
  CONSTRAINT fk_progressions_media
    FOREIGN KEY (media_id) REFERENCES medias (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
--  Table "playlists"
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS playlists (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom          VARCHAR(100) NOT NULL,
  description  VARCHAR(500) NULL,
  cree_le      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifie_le   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
--  Table "playlist_medias"  (table de liaison playlists <-> medias)
--  Un média peut être dans plusieurs playlists, une playlist contient
--  plusieurs médias : c'est une relation "plusieurs à plusieurs".
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS playlist_medias (
  playlist_id  INT UNSIGNED NOT NULL,
  media_id     INT UNSIGNED NOT NULL,
  position     INT UNSIGNED NOT NULL DEFAULT 0,  -- ordre dans la playlist
  ajoute_le    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (playlist_id, media_id),
  KEY idx_playlist_medias_media (media_id),

  CONSTRAINT fk_playlist_medias_playlist
    FOREIGN KEY (playlist_id) REFERENCES playlists (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_playlist_medias_media
    FOREIGN KEY (media_id) REFERENCES medias (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
