-- =============================================================================
--  MediaCloud — Données de départ
--  Développé par LM-Code
--
--  Ce fichier n'est exécuté qu'UNE SEULE FOIS : lors de la toute première
--  création de la base. Il ajoute quelques catégories utiles par défaut.
--  Vous pourrez ensuite les renommer ou les supprimer depuis l'application.
-- =============================================================================

INSERT IGNORE INTO categories (type, nom) VALUES
  -- Films
  ('film', 'Action'),
  ('film', 'Animation'),
  ('film', 'Comédie'),
  ('film', 'Documentaire'),
  ('film', 'Drame'),
  ('film', 'Science-fiction'),
  ('film', 'Thriller'),

  -- Séries
  ('serie', 'Animation'),
  ('serie', 'Comédie'),
  ('serie', 'Drame'),
  ('serie', 'Policier'),
  ('serie', 'Science-fiction'),

  -- Vidéos personnelles
  ('video', 'Souvenirs'),
  ('video', 'Tutoriels'),
  ('video', 'Clips'),

  -- Musique
  ('musique', 'Pop'),
  ('musique', 'Rock'),
  ('musique', 'Rap'),
  ('musique', 'Électro'),
  ('musique', 'Jazz'),
  ('musique', 'Classique'),

  -- Photos
  ('photo', 'Famille'),
  ('photo', 'Vacances'),
  ('photo', 'Événements'),

  -- Documents
  ('document', 'Administratif'),
  ('document', 'Factures'),
  ('document', 'Travail'),
  ('document', 'Personnel');
