import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { NIGERIA_CITIES, LEARNING_VIDEOS } from './data/nigeriaData.js';
import { createStore } from './db/store.js';
import { calculateProjectEstimate } from './services/estimator.js';
import { analyzeSiteLocation } from './services/geoAdvisor.js';

export async function createApp(options = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  const dataDir =
    options.dataDir ||
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../.data');

  const store = createStore({
    databaseUrl: options.databaseUrl ?? process.env.DATABASE_URL,
    dataDir
  });
  await store.init();

  // Purge expired 24-hour projects every 15 minutes
  const cleanupTimer = setInterval(() => {
    store.purgeExpired().catch((err) => {
      console.error('[cleanup] Failed to purge expired projects:', err.message);
    });
  }, 15 * 60 * 1000);
  cleanupTimer.unref?.();

  app.get('/api/health', async (_req, res) => {
    const activeProjects = await store.countActiveProjects();
    res.json({
      ok: true,
      storageMode: store.getMode(),
      retentionHours: 24,
      activeProjects,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/cities', (_req, res) => {
    res.json({
      cities: Object.values(NIGERIA_CITIES),
      videos: LEARNING_VIDEOS,
      priceTimestamp: '2026-Q4 Nigerian Benchmark (Editable Locally)'
    });
  });

  app.post('/api/estimate', (req, res) => {
    try {
      const estimate = calculateProjectEstimate(req.body || {});
      res.json(estimate);
    } catch (err) {
      res.status(400).json({ error: err.message || 'Invalid project input' });
    }
  });

  app.post('/api/geo-analyze', (req, res) => {
    try {
      const analysis = analyzeSiteLocation(req.body || {});
      res.json(analysis);
    } catch (err) {
      res.status(400).json({ error: err.message || 'Invalid survey beacon or location input' });
    }
  });

  // Save a 24-hour temporary project snapshot (Node/Postgres TTL)
  app.post('/api/projects', async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id && /^[a-zA-Z0-9_-]{4,32}$/.test(body.id) ? body.id : nanoid(10);
      const title = String(body.title || 'My Nigerian Home Build').slice(0, 120);
      const city = body.city && NIGERIA_CITIES[body.city] ? body.city : 'abuja';
      const payload = body.payload || body;

      const saved = await store.saveProject({ id, title, city, payload });
      res.status(201).json({
        id: saved.id,
        title: saved.title,
        city: saved.city,
        createdAt: saved.createdAt,
        expiresAt: saved.expiresAt,
        retentionHours: 24,
        note: 'This cloud workspace auto-deletes after 24 hours. Download your .buildpack.json file to keep forever.'
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Failed to save temporary workspace' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await store.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({
          error: 'Workspace not found or expired (projects are automatically purged after 24 hours). Upload your downloaded .buildpack.json file to continue.'
        });
      }
      res.json(project);
    } catch (err) {
      res.status(500).json({ error: err.message || 'Failed to load workspace' });
    }
  });

  // Serve built frontend in production if present
  const clientDist = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../../client/dist'
  );
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return { app, store, cleanupTimer };
}

// Start server only when executed directly
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const port = Number(process.env.PORT) || 6543;
  createApp()
    .then(({ app, store }) => {
      app.listen(port, () => {
        console.log(
          `BuildSmart NG API running on http://localhost:${port} (storage=${store.getMode()}, TTL=24h)`
        );
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
