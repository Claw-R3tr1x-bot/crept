import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'crept.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

export const db = new Database(dbPath);

export function initDb() {
  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  if (!fs.existsSync(schemaPath)) return;
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}
