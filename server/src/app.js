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
app.disable('x-powered-by');
app.set('trust proxy', 1);

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

function toOrigin(value) {
  if (!value) return '';
  const candidate = String(value).trim().replace(/\/+$/, '');
  if (!candidate) return '';
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;

  try {
    return new globalThis.URL(withProtocol).origin;
  } catch {
    return '';
  }
}

function splitOrigins(value) {
  return String(value || '')
    .split(',')
    .map(toOrigin)
    .filter(Boolean);
}

const allowedOrigins = new Set([
  toOrigin(env.clientUrl),
  toOrigin(process.env.VERCEL_URL),
  toOrigin(process.env.VERCEL_BRANCH_URL),
  toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  ...splitOrigins(env.corsOrigins),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
].filter(Boolean));

function securityHeaders(_request, response, next) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

function createRateLimiter({ windowMs, max, code, message }) {
  const hits = new Map();

  return (request, _response, next) => {
    const now = Date.now();
    const ip = String(request.ip || request.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const key = `${ip}:${request.path}`;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > max) {
      const error = new Error(message);
      error.status = 429;
      error.code = code;
      next(error);
      return;
    }

    next();
  };
}

const apiCors = cors({
    origin(origin, callback) {
      const normalizedOrigin = toOrigin(origin);
      if (!origin || allowedOrigins.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: false
});

const appointmentRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 30,
  code: 'APPOINTMENT_RATE_LIMITED',
  message: 'Muitas tentativas de agendamento. Tente novamente em alguns minutos.'
});

const authRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  code: 'AUTH_RATE_LIMITED',
  message: 'Muitas tentativas de autenticaÃ§Ã£o. Tente novamente em alguns minutos.'
});

app.use(securityHeaders);
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
app.use('/api/appointments', appointmentRateLimit, appointmentsRouter);
app.use('/api/blocked-dates', blockedDatesRouter);
app.use('/api/public/appointments', appointmentRateLimit);
app.use('/api/public', publicRouter);
app.use('/api/admin/auth', authRateLimit);
app.use('/api/admin', adminRouter);

if (!process.env.VERCEL && clientDistDir) {
  app.use(express.static(clientDistDir));
  app.get(/^\/(?!api).*/, (_request, response) => {
    response.sendFile(join(clientDistDir, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);
