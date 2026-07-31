import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { appointmentsRouter } from './routes/appointments.routes.js';
import { availabilityRouter } from './routes/availability.routes.js';
import { blockedDatesRouter } from './routes/blockedDates.routes.js';
import { servicesRouter } from './routes/services.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { publicRouter } from './routes/public.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

export const app = express();

const currentDir = dirname(fileURLToPath(import.meta.url));
const clientDistCandidates = [
  resolve(process.cwd(), 'dist/client'),
  resolve(currentDir, '../../client'),
  resolve(currentDir, '../../dist/client')
];
function isClientBuildDir(candidate) {
  return existsSync(join(candidate, 'index.html')) && existsSync(join(candidate, 'assets'));
}

const clientDistDir = clientDistCandidates.find(isClientBuildDir);

const allowedOrigins = new Set([
  env.clientUrl,
  process.env.URL,
  process.env.DEPLOY_URL,
  process.env.DEPLOY_PRIME_URL,
  process.env.RENDER_EXTERNAL_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
].filter(Boolean));

const apiCors = cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origem não permitida pelo CORS.'));
    },
    credentials: false
});

app.use('/api', apiCors);
app.use('/api', express.json({ limit: '12mb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    },
    message: 'API online.'
  });
});

app.use('/api/services', servicesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/blocked-dates', blockedDatesRouter);
app.use('/api/public', publicRouter);
app.use('/api/admin', adminRouter);

if (clientDistDir) {
  app.use(express.static(clientDistDir));
  app.get(/^\/(?!api).*/, (_request, response) => {
    response.sendFile(join(clientDistDir, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);
