import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { NIGERIA_CITIES } from '../data/nigeriaData.js';

const { Pool } = pg;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function createStore({ databaseUrl, dataDir }) {
  let pool = null;
  let mode = 'ephemeral-file';
  const memoryMap = new Map();
  const fallbackFile = path.join(dataDir, 'temp_projects_24h.json');

  async function loadFallbackFromDisk() {
    try {
      const raw = await fs.readFile(fallbackFile, 'utf8');
      const parsed = JSON.parse(raw);
      const now = Date.now();
      for (const item of parsed) {
        if (new Date(item.expiresAt).getTime() > now) {
          memoryMap.set(item.id, item);
        }
      }
    } catch {
      // No existing cache file yet
    }
  }

  async function persistFallbackToDisk() {
    try {
      await fs.mkdir(dataDir, { recursive: true });
      const items = Array.from(memoryMap.values()).filter(
        (item) => new Date(item.expiresAt).getTime() > Date.now()
      );
      await fs.writeFile(fallbackFile, JSON.stringify(items, null, 2), 'utf8');
    } catch {
      // Best-effort local persistence
    }
  }

  async function init() {
    if (databaseUrl) {
      try {
        pool = new Pool({ connectionString: databaseUrl });
        const schemaPath = path.resolve(
          path.dirname(new URL(import.meta.url).pathname),
          'schema.sql'
        );
        const schemaSql = await fs.readFile(schemaPath, 'utf8');
        await pool.query(schemaSql);
        await seedMarketPrices(pool);
        mode = 'postgres';
        return;
      } catch (err) {
        console.warn('[db] Postgres connection unavailable, using 24h local ephemeral fallback:', err.message);
        pool = null;
      }
    }
    mode = 'ephemeral-file';
    await loadFallbackFromDisk();
    await purgeExpired();
  }

  async function seedMarketPrices(pgPool) {
    for (const city of Object.values(NIGERIA_CITIES)) {
      for (const [itemKey, unitPrice] of Object.entries(city.prices)) {
        await pgPool.query(
          `INSERT INTO market_prices (city, item_key, label, unit, category, unit_price)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (city, item_key) DO NOTHING`,
          [city.id, itemKey, itemKey.replace(/_/g, ' '), 'unit', 'baseline', unitPrice]
        );
      }
    }
  }

  async function purgeExpired() {
    if (mode === 'postgres' && pool) {
      const res = await pool.query('DELETE FROM temp_projects WHERE expires_at <= NOW()');
      return res.rowCount || 0;
    }
    const now = Date.now();
    let purged = 0;
    for (const [id, item] of memoryMap.entries()) {
      if (new Date(item.expiresAt).getTime() <= now) {
        memoryMap.delete(id);
        purged += 1;
      }
    }
    if (purged > 0) await persistFallbackToDisk();
    return purged;
  }

  async function saveProject({ id, title, city, payload }) {
    await purgeExpired();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);

    if (mode === 'postgres' && pool) {
      const result = await pool.query(
        `INSERT INTO temp_projects (id, title, city, payload, created_at, updated_at, expires_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW() + INTERVAL '24 hours')
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           city = EXCLUDED.city,
           payload = EXCLUDED.payload,
           updated_at = NOW()
         RETURNING id, title, city, payload, created_at, updated_at, expires_at`,
        [id, title, city, JSON.stringify(payload)]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        city: row.city,
        payload: row.payload,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        expiresAt: row.expires_at
      };
    }

    const existing = memoryMap.get(id);
    const record = {
      id,
      title,
      city,
      payload,
      createdAt: existing ? existing.createdAt : now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: existing ? existing.expiresAt : expiresAt.toISOString()
    };
    memoryMap.set(id, record);
    await persistFallbackToDisk();
    return record;
  }

  async function getProject(id) {
    await purgeExpired();
    if (mode === 'postgres' && pool) {
      const res = await pool.query(
        `SELECT id, title, city, payload, created_at, updated_at, expires_at
         FROM temp_projects
         WHERE id = $1 AND expires_at > NOW()`,
        [id]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        title: row.title,
        city: row.city,
        payload: row.payload,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        expiresAt: row.expires_at
      };
    }

    const item = memoryMap.get(id);
    if (!item) return null;
    if (new Date(item.expiresAt).getTime() <= Date.now()) {
      memoryMap.delete(id);
      await persistFallbackToDisk();
      return null;
    }
    return item;
  }

  async function countActiveProjects() {
    await purgeExpired();
    if (mode === 'postgres' && pool) {
      const res = await pool.query(
        'SELECT COUNT(*)::int AS count FROM temp_projects WHERE expires_at > NOW()'
      );
      return res.rows[0]?.count ?? 0;
    }
    return memoryMap.size;
  }

  async function close() {
    if (pool) await pool.end();
  }

  return {
    init,
    purgeExpired,
    saveProject,
    getProject,
    countActiveProjects,
    close,
    getMode: () => mode
  };
}
