import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try multiple candidate .env locations
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

export const env = {
  PORT: process.env.PORT || '5000',
  JWT_SECRET: process.env.JWT_SECRET || 'interviewai_default_jwt_secret_change_in_prod',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DATABASE_PATH: process.env.DATABASE_PATH || './interviewai.db',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

