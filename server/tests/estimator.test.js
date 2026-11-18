import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { calculateProjectEstimate, computeWallSegmentsFromRooms } from '../src/services/estimator.js';
import { createApp } from '../src/index.js';

test('deduplicates shared interior walls when rooms snap edge-to-edge', () => {
  // Two 4m x 4m rooms side by side: outer perimeter = 8+4+8+4 = 24m, shared interior wall = 4m -> 28m total
  const geom = computeWallSegmentsFromRooms([
    { id: 'r1', x: 0, z: 0, width: 4, depth: 4 },
    { id: 'r2', x: 4, z: 0, width: 4, depth: 4 }
  ]);
  assert.equal(geom.totalWallLengthM, 28);
  assert.equal(geom.interiorWallLengthM, 4);
  assert.equal(geom.exteriorWallLengthM, 24);
  assert.equal(geom.floorAreaM2, 32);
});

test('computes Sandcrete Block vs EPS Polystyrene platform + starter pegs + water + labour', () => {
  const baseInput = {
    city: 'abuja',
    floors: 1,
    wallHeightM: 3.0,
    doorsCount: 5,
    windowsCount: 8,
    wastagePct: 10,
    monthlySavings: 200000,
    startingCash: 500000,
    rooms: [
      { id: 'lounge', name: 'Parlour', x: 0, z: 0, width: 5, depth: 4 },
      { id: 'bed1', name: 'Bedroom 1', x: 5, z: 0, width: 4, depth: 4 },
      { id: 'kitchen', name: 'Kitchen', x: 0, z: 4, width: 3, depth: 3 }
    ]
  };

  const blockEst = calculateProjectEstimate({ ...baseInput, wallSystem: 'block_9' });
  const epsEst = calculateProjectEstimate({ ...baseInput, wallSystem: 'eps_panel' });

  assert.ok(blockEst.quantities.wallUnitsCount > 500, 'Expected substantial sandcrete block count');
  assert.equal(blockEst.quantities.starterPegsCount, 0);
  assert.ok(blockEst.quantities.waterLitres > 1000, 'Expected water litres for mixing + curing');
  assert.ok(blockEst.phases.length === 5, 'Expected 5-stage Build-As-You-Earn roadmap');

  assert.ok(epsEst.quantities.wallUnitsCount > 10, 'Expected EPS 3D panels count');
  assert.ok(epsEst.quantities.starterPegsCount > 50, 'Expected vertical starter iron pegs on EPS platform');
  assert.ok(epsEst.quantities.meshStripsM > 0, 'Expected corner/splice wire mesh strips');
  assert.ok(
    epsEst.comparison.eps_panel.estimatedDays < epsEst.comparison.block_9.estimatedDays,
    'EPS build time should be shorter than block masonry'
  );
});

test('24h ephemeral workspace saves, reloads, and handles missing/expired records cleanly', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildsmart-test-'));
  const { app, store, cleanupTimer } = await createApp({ databaseUrl: '', dataDir: tmpDir });

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const health = await healthRes.json();
    assert.equal(health.ok, true);
    assert.equal(health.retentionHours, 24);

    const saveRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Abuja 2-Bed Starter',
        city: 'abuja',
        payload: { rooms: [{ id: '1', x: 0, z: 0, width: 4, depth: 4 }] }
      })
    });
    assert.equal(saveRes.status, 201);
    const saved = await saveRes.json();
    assert.ok(saved.id);
    assert.ok(new Date(saved.expiresAt).getTime() > Date.now());

    const getRes = await fetch(`${baseUrl}/api/projects/${saved.id}`);
    assert.equal(getRes.status, 200);
    const loaded = await getRes.json();
    assert.equal(loaded.title, 'Abuja 2-Bed Starter');

    const missingRes = await fetch(`${baseUrl}/api/projects/does-not-exist`);
    assert.equal(missingRes.status, 404);
  } finally {
    clearInterval(cleanupTimer);
    server.close();
    await store.close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
