import Database from 'better-sqlite3';
import path from 'path';
import { env } from './env';

const dbPath = path.isAbsolute(env.DATABASE_PATH)
  ? env.DATABASE_PATH
  : path.resolve(__dirname, '../../', env.DATABASE_PATH);

export const db = new Database(dbPath);

// High performance database tuning
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');

export default db;
