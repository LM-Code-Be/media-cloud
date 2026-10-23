// =============================================================================
//  Connexion à MySQL
//  On utilise un "pool" : un groupe de connexions réutilisables. C'est plus
//  rapide que d'ouvrir une nouvelle connexion à chaque requête.
// =============================================================================
import mysql from 'mysql2/promise';
import { config } from '../config.js';

export const pool = mysql.createPool({
  host: config.bdd.hote,
  port: config.bdd.port,
  user: config.bdd.utilisateur,
  password: config.bdd.motDePasse,
  database: config.bdd.nom,
  charset: 'utf8mb4', // gère les accents et les emojis
  connectionLimit: 10,
  decimalNumbers: true, // SUM(), AVG()… renvoient des nombres et pas des textes
});

/**
 * Exécute une requête SELECT et renvoie la liste des lignes.
 * Les "?" dans la requête sont remplacés par les valeurs de `parametres`
 * (protection automatique contre les injections SQL).
 */
export async function selectionner<T>(sql: string, parametres: unknown[] = []): Promise<T[]> {
  const [lignes] = await pool.query(sql, parametres);
  return lignes as T[];
}

/** Comme `selectionner`, mais renvoie uniquement la première ligne (ou null). */
export async function selectionnerUn<T>(
  sql: string,
  parametres: unknown[] = [],
): Promise<T | null> {
  const lignes = await selectionner<T>(sql, parametres);
  return lignes[0] ?? null;
}

/**
 * Exécute une requête INSERT / UPDATE / DELETE.
 * Renvoie l'id inséré et le nombre de lignes touchées.
 */
export async function executer(
  sql: string,
  parametres: unknown[] = [],
): Promise<{ idInsere: number; lignesModifiees: number }> {
  const [resultat] = await pool.query<mysql.ResultSetHeader>(sql, parametres);
  return { idInsere: resultat.insertId, lignesModifiees: resultat.affectedRows };
}
