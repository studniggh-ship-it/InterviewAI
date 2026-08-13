import { GoogleGenAI } from '@google/genai';
import { env } from './env';

const isValidKey = 
  Boolean(env.GEMINI_API_KEY) && 
  env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' && 
  !env.GEMINI_API_KEY.startsWith('YOUR_') &&
  env.GEMINI_API_KEY.trim().length > 10;

export const aiClient = isValidKey ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

export const GEMINI_MODEL = 'gemini-2.5-flash';
