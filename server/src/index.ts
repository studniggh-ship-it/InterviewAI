import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { initializeDatabaseSchema } from './database/schema';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimit';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration for Capacitor, Vite development, and production clients
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) return callback(null, true);
    // Allow localhost, 127.0.0.1, and capacitor origins
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.startsWith('capacitor://') ||
      origin.startsWith('http://localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev, valid origin echoed back for credentials
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiRateLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'INTERVIEWAI API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRouter);

// Centralized error handler
app.use(errorHandler);

// Initialize DB schema before listening
initializeDatabaseSchema();

const PORT = Number(env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`🚀 INTERVIEWAI Server running on port ${PORT} [${env.NODE_ENV}]`);
});
