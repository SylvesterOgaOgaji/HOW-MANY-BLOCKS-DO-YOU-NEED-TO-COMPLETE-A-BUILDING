import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { NIGERIA_CITIES, LEARNING_VIDEOS } from '../../server/src/data/nigeriaData.js';
import { calculateProjectEstimate } from '../../server/src/services/estimator.js';

const TWENTY_FOUR_HOURS_SECONDS = 24 * 60 * 60;
const app = new Hono();

app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}));

function generateShortId(len = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    runtime: 'cloudflare-workers',
    storageMode: 'cloudflare-kv-24h-ttl',
    retentionHours: 24,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cities', (c) => {
  return c.json({
    cities: Object.values(NIGERIA_CITIES),
    videos: LEARNING_VIDEOS,
    priceTimestamp: '2026-Q4 Nigerian Benchmark (Edge Cached)'
  });
});

app.post('/api/estimate', async (c) => {
  try {
    const body = await c.req.json();
    const estimate = calculateProjectEstimate(body || {});
    return c.json(estimate);
  } catch (err) {
    return c.json({ error: err?.message || 'Invalid project input' }, 400);
  }
});

// Save a 24-hour temporary workspace in Cloudflare KV (auto-purged by KV TTL after 86400s)
app.post('/api/projects', async (c) => {
  try {
    if (!c.env.PROJECTS_KV) {
      return c.json({ error: 'PROJECTS_KV binding not configured yet in wrangler.toml' }, 500);
    }
    const body = await c.req.json();
    const id = body?.id && /^[a-zA-Z0-9_-]{4,32}$/.test(body.id) ? body.id : generateShortId(10);
    const title = String(body?.title || 'My Nigerian Home Build').slice(0, 120);
    const city = body?.city && NIGERIA_CITIES[body.city] ? body.city : 'abuja';
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_SECONDS * 1000).toISOString();

    const record = {
      id,
      title,
      city,
      payload: body?.payload || body,
      createdAt,
      expiresAt
    };

    await c.env.PROJECTS_KV.put(`project:${id}`, JSON.stringify(record), {
      expirationTtl: TWENTY_FOUR_HOURS_SECONDS
    });

    return c.json(
      {
        id,
        title,
        city,
        createdAt,
        expiresAt,
        retentionHours: 24,
        note: 'Stored on Cloudflare KV with automatic 24-hour auto-deletion. Download .buildpack.json to keep forever.'
      },
      201
    );
  } catch (err) {
    return c.json({ error: err?.message || 'Failed to save temporary project' }, 500);
  }
});

app.get('/api/projects/:id', async (c) => {
  try {
    if (!c.env.PROJECTS_KV) {
      return c.json({ error: 'PROJECTS_KV binding not configured yet in wrangler.toml' }, 500);
    }
    const raw = await c.env.PROJECTS_KV.get(`project:${c.req.param('id')}`);
    if (!raw) {
      return c.json(
        {
          error:
            'Workspace not found or expired (Cloudflare KV automatically purged it after 24 hours). Upload your .buildpack.json file to continue.'
        },
        404
      );
    }
    return c.json(JSON.parse(raw));
  } catch (err) {
    return c.json({ error: err?.message || 'Failed to fetch project' }, 500);
  }
});

// Serve Blender .glb meshes & Unity Addressables directly from Cloudflare R2
app.get('/api/models/:filename', async (c) => {
  if (!c.env.ASSETS_R2) {
    return c.json({ error: 'ASSETS_R2 bucket binding not configured' }, 404);
  }
  const filename = c.req.param('filename');
  const obj = await c.env.ASSETS_R2.get(filename);
  if (!obj) {
    return c.json({ error: '3D model not found in R2' }, 404);
  }
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=86400');
  if (filename.endsWith('.glb')) headers.set('content-type', 'model/gltf-binary');
  return new Response(obj.body, { headers });
});

export default app;
