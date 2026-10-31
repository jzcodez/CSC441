// MySQL connection pool. A pool reuses connections instead of opening one per request.
import mysql from 'mysql2/promise';
import { config } from '../config/env.js';

const { sslCa, ...connection } = config.mysql;

export const pool = mysql.createPool({
  ...connection,
  ssl: sslCa ? { ca: sslCa } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // return DECIMAL prices as numbers, not strings
  timezone: 'Z', // store and read DATETIME values as UTC
});

export async function pingMysql() {
  await pool.query('SELECT 1');
}
