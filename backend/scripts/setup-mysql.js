// Creates the MySQL database if needed, then runs database/sql/schema.sql and seed.sql.
// WARNING: schema.sql drops and recreates the tables, so this resets all MySQL data.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config/env.js';

const sqlDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database/sql');
const { database, sslCa, ...connection } = config.mysql;

const conn = await mysql.createConnection({
  ...connection,
  ssl: sslCa ? { ca: sslCa } : undefined,
  multipleStatements: true,
});

try {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  await conn.query(`USE \`${database}\``);
  for (const file of ['schema.sql', 'seed.sql']) {
    await conn.query(await fs.readFile(path.join(sqlDir, file), 'utf8'));
    console.log(`Ran ${file}`);
  }
  console.log(`MySQL database "${database}" is ready.`);
} finally {
  await conn.end();
}
