// =============================================================================
//  Création automatique de la base de données
//  1. Crée la base "media_cloud" si elle n'existe pas
//  2. Crée les tables (database/schema.sql)
//  3. Lors de la toute première installation, ajoute les catégories par
//     défaut (database/donnees.sql)
// =============================================================================
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { config } from '../config.js';

export async function initialiserBaseDeDonnees(): Promise<void> {
  // Connexion SANS base sélectionnée : la base n'existe peut-être pas encore
  const connexion = await mysql.createConnection({
    host: config.bdd.hote,
    port: config.bdd.port,
    user: config.bdd.utilisateur,
    password: config.bdd.motDePasse,
    charset: 'utf8mb4',
    multipleStatements: true, // permet d'exécuter un fichier .sql complet
  });

  try {
    const nomBase = config.bdd.nom;

    // 1. Création de la base (utf8mb4 = support complet des accents/emojis)
    await connexion.query(
      `CREATE DATABASE IF NOT EXISTS \`${nomBase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connexion.query(`USE \`${nomBase}\``);

    // Première installation ? (la table "medias" n'existe pas encore)
    const [tables] = await connexion.query<mysql.RowDataPacket[]>("SHOW TABLES LIKE 'medias'");
    const premiereInstallation = tables.length === 0;

    // 2. Création des tables
    const schema = await fs.readFile(path.join(config.dossierSql, 'schema.sql'), 'utf-8');
    await connexion.query(schema);

    // 3. Données de départ, uniquement la première fois
    if (premiereInstallation) {
      const donnees = await fs.readFile(path.join(config.dossierSql, 'donnees.sql'), 'utf-8');
      await connexion.query(donnees);
      console.log(`[bdd] Base "${nomBase}" créée avec les catégories par défaut.`);
    }
  } finally {
    await connexion.end();
  }
}
