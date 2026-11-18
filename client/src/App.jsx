import React, { useEffect, useMemo, useRef, useState } from 'react';
import Builder3D from './components/Builder3D.jsx';
import BoqTab from './components/BoqTab.jsx';
import RoadmapTab from './components/RoadmapTab.jsx';
import CityGuideTab from './components/CityGuideTab.jsx';
import SiteLabTab from './components/SiteLabTab.jsx';
import { HOUSE_TEMPLATES, PLOT_PRESETS, ROOM_PALETTE } from './data/presets.js';

const formatNaira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;

const STAGE_LABELS = {
  1: '1. Land Plot & Setting Out',
  2: '2. Foundation / EPS Platform & Pegs',
  3: '3. Wall Raising (Blocks / EPS Mesh)',
  4: '4. Openings, Lintel & Decking',
  5: '5. Timber Trusses & Roof Sheets',
  6: '6. Water Tank Tower & Septic'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [cities, setCities] = useState([]);
  const [videos, setVideos] = useState([]);
  const [health, setHealth] = useState(null);

  // Portable Project State (downloaded/uploaded as .buildpack.json or stored 24h in Cloud/Postgres)
  const [title, setTitle] = useState('My Abuja 3-Bedroom Plan');
  const [cityId, setCityId] = useState('abuja');
  const [plotId, setPlotId] = useState('full_450');
  const [customPlotWidth, setCustomPlotWidth] = useState(15);
  const [customPlotDepth, setCustomPlotDepth] = useState(25);
  const [buildMode, setBuildMode] = useState('room_snap');
  const [activeTool, setActiveTool] = useState('eps_panel');
  const [pieceOrientation, setPieceOrientation] = useState('h');
  const [placedPieces, setPlacedPieces] = useState([]);
  const [rooms, setRooms] = useState(HOUSE_TEMPLATES[2].rooms);
  const [selectedRoomId, setSelectedRoomId] = useState(HOUSE_TEMPLATES[2].rooms[0].id);
  const [wallSystem, setWallSystem] = useState('eps_panel');
  const [wallHeightM, setWallHeightM] = useState(3.0);
  const [floors, setFloors] = useState(1);
  const [roofStyle, setRoofStyle] = useState('gable');
  const [doorsCount, setDoorsCount] = useState(8);
  const [windowsCount, setWindowsCount] = useState(12);
  const [wastagePct, setWastagePct] = useState(10);
  const [monthlySavings, setMonthlySavings] = useState(180000);
  const [startingCash, setStartingCash] = useState(1500000);
  const [priceOverrides, setPriceOverrides] = useState({});

  // Interactive 3D Controls
  const [buildStage, setBuildStage] = useState(6);
  const [xrayMode, setXrayMode] = useState(false);

  // Estimate + 24h Ephemeral Cloud Workspace Status
  const [estimate, setEstimate] = useState(null);
  const [cloudMeta, setCloudMeta] = useState(null);
  const [statusBanner, setStatusBanner] = useState('');
  const fileInputRef = useRef(null);

  const plot = useMemo(() => {
    if (plotId === 'custom') {
      const w = Math.max(6, Math.min(60, Number(customPlotWidth) || 15));
      const d = Math.max(8, Math.min(80, Number(customPlotDepth) || 25));
      return { id: 'custom', label: `Custom (${w}m × ${d}m)`, width: w, depth: d };
    }
    return PLOT_PRESETS.find((p) => p.id === plotId) || PLOT_PRESETS[2];
  }, [plotId, customPlotWidth, customPlotDepth]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const currentCityData = useMemo(
    () => cities.find((c) => c.id === cityId) || cities[0] || null,
    [cities, cityId]
  );

  // Initial load: cities, backend health, and ?project=<id> if shared
  useEffect(() => {
    fetch('/api/cities')
      .then((r) => r.json())
      .then((data) => {
        setCities(data.cities || []);
        setVideos(data.videos || []);
      })
      .catch(() => {});

    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('project');
    if (sharedId) {
      fetch(`/api/projects/${encodeURIComponent(sharedId)}`)
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || 'Workspace expired');
          applyProjectPayload(data.payload || data, data);
          setStatusBanner(`Loaded 24h workspace "${data.title}". Expires at ${new Date(data.expiresAt).toLocaleString()}.`);
        })
        .catch((err) => setStatusBanner(err.message));
    }
  }, []);

  // Recompute live BOQ whenever design, pieces, or prices change
  useEffect(() => {
    const timer = setTimeout(() => {
      const platformAreaM2 = Math.max(4, plot.width - 2.4) * Math.max(4, plot.depth - 3.0);
      fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: cityId,
          buildMode,
          rooms,
          placedPieces,
          platformAreaM2,
          wallSystem,
          wallHeightM,
          floors,
          roofStyle,
          doorsCount,
          windowsCount,
          wastagePct,
          monthlySavings,
          startingCash,
          priceOverrides
        })
      })
        .then((r) => r.json())
        .then((data) => setEstimate(data))
        .catch(() => {});
    }, 80);

    return () => clearTimeout(timer);
  }, [
    cityId,
    buildMode,
    rooms,
    placedPieces,
    plot.width,
    plot.depth,
    wallSystem,
    wallHeightM,
    floors,
    roofStyle,
    doorsCount,
    windowsCount,
    wastagePct,
    monthlySavings,
    startingCash,
    priceOverrides
  ]);

  function buildPayload() {
    return {
      version: 2,
      title,
      cityId,
      plotId,
      customPlotWidth,
      customPlotDepth,
      buildMode,
      placedPieces,
      rooms,
      wallSystem,
      wallHeightM,
      floors,
      roofStyle,
      doorsCount,
      windowsCount,
      wastagePct,
      monthlySavings,
      startingCash,
      priceOverrides,
      exportedAt: new Date().toISOString()
    };
  }

  function applyProjectPayload(p, meta = null) {
    if (p.title) setTitle(p.title);
    if (p.cityId) setCityId(p.cityId);
    if (p.plotId) setPlotId(p.plotId);
    if (p.customPlotWidth) setCustomPlotWidth(p.customPlotWidth);
    if (p.customPlotDepth) setCustomPlotDepth(p.customPlotDepth);
    if (p.buildMode) setBuildMode(p.buildMode);
    if (Array.isArray(p.placedPieces)) setPlacedPieces(p.placedPieces);
    if (Array.isArray(p.rooms)) {
      setRooms(p.rooms);
      setSelectedRoomId(p.rooms[0]?.id || null);
    }
    if (p.wallSystem) setWallSystem(p.wallSystem);
    if (p.wallHeightM) setWallHeightM(p.wallHeightM);
    if (p.floors) setFloors(p.floors);
    if (p.roofStyle) setRoofStyle(p.roofStyle);
    if (p.doorsCount) setDoorsCount(p.doorsCount);
    if (p.windowsCount) setWindowsCount(p.windowsCount);
    if (p.wastagePct) setWastagePct(p.wastagePct);
    if (p.monthlySavings) setMonthlySavings(p.monthlySavings);
    if (p.startingCash !== undefined) setStartingCash(p.startingCash);
    if (p.priceOverrides) setPriceOverrides(p.priceOverrides);
    if (meta?.expiresAt) setCloudMeta(meta);
  }

  function loadTemplate(tplId) {
    const tpl = HOUSE_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setBuildMode('room_snap');
    setRooms(tpl.rooms.map((r) => ({ ...r })));
    setSelectedRoomId(tpl.rooms[0]?.id || null);
    setFloors(tpl.floors);
    setDoorsCount(tpl.doorsCount);
    setWindowsCount(tpl.windowsCount);
    setTitle(`${currentCityData?.name || 'Nigeria'} — ${tpl.name}`);
  }

  function handlePlacePiece({ x, z, dir, type }) {
    const id = `pc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    // Auto-stack single blocks vertically if placed at same (x, z)
    let layer = 0;
    if (type.includes('single')) {
      layer = placedPieces.filter(
        (p) => p.type === type && Math.abs(p.x - x) < 0.05 && Math.abs(p.z - z) < 0.05
      ).length;
    }
    setPlacedPieces((prev) => [...prev, { id, type, x, z, dir, layer }]);
  }

  function autoGeneratePerimeterFromLand() {
    const usableW = Math.max(3.6, plot.width - 3.0);
    const usableD = Math.max(3.6, plot.depth - 4.0);
    const startX = 1.5;
    const startZ = 2.0;
    const modType = wallSystem === 'eps_panel' ? 'eps_panel' : wallSystem === 'block_6' ? 'block_6_bay' : 'block_9_bay';
    const step = modType === 'eps_panel' ? 1.2 : 0.9;
    const cols = Math.max(2, Math.floor(usableW / step));
    const rows = Math.max(2, Math.floor(usableD / step));

    const next = [];
    let idx = 0;
    // Top & Bottom edges
    for (let c = 0; c < cols; c += 1) {
      const x = Number((startX + c * step).toFixed(2));
      next.push({ id: `auto_${idx++}`, type: modType, x, z: startZ, dir: 'h', layer: 0 });
      next.push({ id: `auto_${idx++}`, type: modType, x, z: Number((startZ + rows * step).toFixed(2)), dir: 'h', layer: 0 });
    }
    // Left & Right edges
    for (let r = 0; r < rows; r += 1) {
      const z = Number((startZ + r * step).toFixed(2));
      next.push({ id: `auto_${idx++}`, type: modType, x: startX, z, dir: 'v', layer: 0 });
      next.push({ id: `auto_${idx++}`, type: modType, x: Number((startX + cols * step).toFixed(2)), z, dir: 'v', layer: 0 });
    }
    setBuildMode('piece_by_piece');
    setPlacedPieces(next);
    setStatusBanner(`Generated ${next.length} wall pieces dynamically for your ${plot.width}m × ${plot.depth}m land! Click anywhere to add interior partitions or remove pieces.`);
  }

  function addLegoRoom(preset) {
    const last = rooms[rooms.length - 1];
    const nextX = last ? Math.min(plot.width - preset.width - 1, Math.max(1.5, last.x + 1.5)) : 2;
    const nextZ = last ? Math.min(plot.depth - preset.depth - 1, Math.max(2, last.z + 1.5)) : 5;
    const id = `room_${Date.now().toString(36)}`;
    const newRoom = {
      id,
      type: preset.type,
      name: preset.name,
      x: Math.round(nextX * 2) / 2,
      z: Math.round(nextZ * 2) / 2,
      width: preset.width,
      depth: preset.depth,
      color: preset.color
    };
    setRooms((prev) => [...prev, newRoom]);
    setSelectedRoomId(id);
  }

  function updateSelectedRoom(patch) {
    if (!selectedRoomId) return;
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRoomId) return r;
        const updated = { ...r, ...patch };
        updated.width = Math.max(1.5, Math.min(12, updated.width));
        updated.depth = Math.max(1.5, Math.min(12, updated.depth));
        updated.x = Math.max(0.5, Math.min(plot.width - updated.width - 0.5, updated.x));
        updated.z = Math.max(0.5, Math.min(plot.depth - updated.depth - 0.5, updated.z));
        return updated;
      })
    );
  }

  function removeSelectedRoom() {
    if (!selectedRoomId || rooms.length <= 1) return;
    setRooms((prev) => {
      const next = prev.filter((r) => r.id !== selectedRoomId);
      setSelectedRoomId(next[0]?.id || null);
      return next;
    });
  }

  async function save24hWorkspace() {
    try {
      const payload = buildPayload();
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cloudMeta?.id,
          title,
          city: cityId,
          payload
        })
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Could not save');
      setCloudMeta(saved);
      const url = `${window.location.origin}?project=${saved.id}`;
      window.history.replaceState({}, '', `?project=${saved.id}`);
      await navigator.clipboard?.writeText(url).catch(() => {});
      setStatusBanner(
        `Saved temporary 24-hour link (${saved.id}) — auto-deletes ${new Date(saved.expiresAt).toLocaleString()}. Download .buildpack.json to keep forever.`
      );
    } catch (err) {
      setStatusBanner(err.message);
    }
  }

  function downloadBuildpack() {
    const data = buildPayload();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.buildpack.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner('Downloaded .buildpack.json — you can re-upload this file anytime to resume your 3D build.');
  }

  function handleUploadBuildpack(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        applyProjectPayload(parsed);
        setCloudMeta(null);
        setStatusBanner(`Loaded "${parsed.title || file.name}"! You can keep building in 3D or save a fresh 24h link.`);
      } catch {
        setStatusBanner('Invalid project file. Please choose a .buildpack.json file exported from this app.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const isEps = wallSystem === 'eps_panel';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">3D</div>
          <div>
            <h1>How Many Blocks? — BuildSmart Nigeria</h1>
            <p className="brand-sub">
              Lego-style 3D Home Planner · Sandcrete Blocks vs. Polystyrene (EPS) · 24h Cloud + Portable File
            </p>
          </div>
        </div>

        <div className="topbar-actions">
          <input
            className="title-input"
            aria-label="Project Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="city-select"
            aria-label="Nigerian City"
            value={cityId}
            onChange={(e) => {
              setCityId(e.target.value);
              setPriceOverrides({});
            }}
          >
            {(cities.length ? cities : [{ id: 'abuja', name: 'Abuja (FCT)' }]).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button type="button" className="btn-primary" onClick={save24hWorkspace}>
            Save 24h Link
          </button>
          <button type="button" className="btn-secondary" onClick={downloadBuildpack}>
            Download File
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.buildpack.json"
            hidden
            onChange={handleUploadBuildpack}
          />
        </div>
      </header>

      {(statusBanner || cloudMeta) && (
        <div className="notice-bar">
          <span>
            {statusBanner ||
              `24h Ephemeral Workspace Active (${cloudMeta.id}) · Storage: ${health?.storageMode || 'postgres-ttl'}`}
          </span>
          <button type="button" className="notice-close" onClick={() => setStatusBanner('')}>
            ×
          </button>
        </div>
      )}

      <nav className="main-tabs" aria-label="Application Sections">
        {[
          { id: 'studio', label: '1. 3D Lego Studio' },
          { id: 'boq', label: '2. Full BOQ & Blocks vs. EPS' },
          { id: 'roadmap', label: '3. Save & Build Coach' },
          { id: 'city', label: '4. City, Approvals & Sourcing' },
          { id: 'lab', label: '5. Site Check & DIY Lab' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {activeTab === 'studio' && (
          <div className="studio-layout">
            {/* Left Lego Controls */}
            <aside className="studio-sidebar">
              <section className="control-card">
                <h3>1. Build Mode & Your Land Size</h3>
                <div className="seg-group" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <button
                    type="button"
                    className={`seg-btn ${buildMode === 'room_snap' ? 'active' : ''}`}
                    onClick={() => setBuildMode('room_snap')}
                  >
                    Room Snap Mode
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${buildMode === 'piece_by_piece' ? 'active' : ''}`}
                    onClick={() => setBuildMode('piece_by_piece')}
                  >
                    Pick & Fix Pieces
                  </button>
                </div>

                <label className="stack-label">
                  <span>Land Plot Size</span>
                  <select value={plotId} onChange={(e) => setPlotId(e.target.value)}>
                    {PLOT_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>

                {plotId === 'custom' && (
                  <div className="two-inputs" style={{ marginBottom: 10 }}>
                    <label>
                      <span>Land Width (m)</span>
                      <input
                        type="number"
                        min="6"
                        max="60"
                        value={customPlotWidth}
                        onChange={(e) => setCustomPlotWidth(Number(e.target.value))}
                      />
                    </label>
                    <label>
                      <span>Land Depth (m)</span>
                      <input
                        type="number"
                        min="8"
                        max="80"
                        value={customPlotDepth}
                        onChange={(e) => setCustomPlotDepth(Number(e.target.value))}
                      />
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', marginBottom: 10 }}
                  onClick={autoGeneratePerimeterFromLand}
                >
                  Auto-Generate Walls For {plot.width}m × {plot.depth}m Land
                </button>

                <div className="template-list">
                  {HOUSE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className="tpl-btn"
                      onClick={() => loadTemplate(tpl.id)}
                    >
                      <strong>{tpl.name}</strong>
                      <span>{tpl.subtitle}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="control-card">
                <h3>2. Wall System & Structure</h3>
                <div className="seg-group">
                  {[
                    { id: 'block_9', label: '9" Blocks' },
                    { id: 'block_6', label: '6" Blocks' },
                    { id: 'eps_panel', label: 'Polystyrene (EPS)' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`seg-btn ${wallSystem === opt.id ? 'active' : ''}`}
                      onClick={() => setWallSystem(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="hint-text">
                  {isEps
                    ? 'EPS casts a raised concrete platform + starter iron pegs, then mounts galvanized wire-mesh polystyrene panels.'
                    : 'Sandcrete blocks use strip/raft trenches, plinth courses, oversite concrete, columns & lintels.'}
                </p>

                <div className="two-inputs">
                  <label>
                    <span>Floors</span>
                    <select value={floors} onChange={(e) => setFloors(Number(e.target.value))}>
                      <option value={1}>1 Floor (Bungalow)</option>
                      <option value={2}>2 Floors (G+1)</option>
                    </select>
                  </label>
                  <label>
                    <span>Roof Type</span>
                    <select value={roofStyle} onChange={(e) => setRoofStyle(e.target.value)}>
                      <option value="gable">Gable Truss</option>
                      <option value="monopitch">Monopitch (Single Slope)</option>
                      <option value="hip">Hip Roof</option>
                    </select>
                  </label>
                  <label>
                    <span>Doors / Floor</span>
                    <input
                      type="number"
                      min="1"
                      max="25"
                      value={doorsCount}
                      onChange={(e) => setDoorsCount(Math.max(1, Number(e.target.value)))}
                    />
                  </label>
                  <label>
                    <span>Windows / Floor</span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={windowsCount}
                      onChange={(e) => setWindowsCount(Math.max(1, Number(e.target.value)))}
                    />
                  </label>
                </div>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={xrayMode}
                    onChange={(e) => setXrayMode(e.target.checked)}
                  />
                  <span>X-Ray Mode (See EPS Mesh, Pegs & Timber Roof Trusses)</span>
                </label>
              </section>

              {buildMode === 'piece_by_piece' ? (
                <section className="control-card">
                  <h3>3. Pick & Fix Pieces Live ({placedPieces.length} placed)</h3>
                  <p className="hint-text">
                    Select a piece below and click on the concrete platform in 3D to snap and count live.
                  </p>
                  <div className="palette-grid">
                    {[
                      { id: 'eps_panel', label: 'EPS Panel (1.2m)' },
                      { id: 'block_9_bay', label: '9" Block Bay (0.9m)' },
                      { id: 'block_6_bay', label: '6" Block Bay (0.9m)' },
                      { id: 'block_9_single', label: 'Single 9" Block' },
                      { id: 'starter_peg', label: 'Starter Peg (Y12)' },
                      { id: 'door', label: 'Door Frame' },
                      { id: 'window', label: 'Window Bay' },
                      { id: 'eraser', label: 'Eraser (Delete)' }
                    ].map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        className={`seg-btn ${activeTool === tool.id ? 'active' : ''}`}
                        onClick={() => setActiveTool(tool.id)}
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>
                  <div className="seg-group" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 10 }}>
                    <button
                      type="button"
                      className={`seg-btn ${pieceOrientation === 'h' ? 'active' : ''}`}
                      onClick={() => setPieceOrientation('h')}
                    >
                      Rotate: 0° (Horizontal)
                    </button>
                    <button
                      type="button"
                      className={`seg-btn ${pieceOrientation === 'v' ? 'active' : ''}`}
                      onClick={() => setPieceOrientation('v')}
                    >
                      Rotate: 90° (Vertical)
                    </button>
                  </div>
                  <div className="two-inputs" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setPlacedPieces((prev) => prev.slice(0, -1))}
                      disabled={!placedPieces.length}
                    >
                      Undo Last Piece
                    </button>
                    <button
                      type="button"
                      className="btn-danger-xs"
                      style={{ padding: '8px 10px' }}
                      onClick={() => setPlacedPieces([])}
                      disabled={!placedPieces.length}
                    >
                      Clear All ({placedPieces.length})
                    </button>
                  </div>
                </section>
              ) : (
                <section className="control-card">
                  <h3>3. Snap More Lego Rooms</h3>
                  <div className="palette-grid">
                    {ROOM_PALETTE.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        className="palette-btn"
                        onClick={() => addLegoRoom(item)}
                      >
                        + {item.name}
                      </button>
                    ))}
                  </div>

                  {selectedRoom && (
                    <div className="selected-room-box">
                      <div className="selected-head">
                        <strong>Selected: {selectedRoom.name}</strong>
                        {rooms.length > 1 && (
                          <button type="button" className="btn-danger-xs" onClick={removeSelectedRoom}>
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="nudge-pad">
                        <button type="button" onClick={() => updateSelectedRoom({ z: selectedRoom.z - 0.5 })}>
                          ↑ Back
                        </button>
                        <div className="nudge-mid">
                          <button type="button" onClick={() => updateSelectedRoom({ x: selectedRoom.x - 0.5 })}>
                            ← Left
                          </button>
                          <button type="button" onClick={() => updateSelectedRoom({ x: selectedRoom.x + 0.5 })}>
                            Right →
                          </button>
                        </div>
                        <button type="button" onClick={() => updateSelectedRoom({ z: selectedRoom.z + 0.5 })}>
                          ↓ Front
                        </button>
                      </div>
                      <div className="two-inputs">
                        <label>
                          <span>Width (m)</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1.5"
                            max="12"
                            value={selectedRoom.width}
                            onChange={(e) => updateSelectedRoom({ width: Number(e.target.value) })}
                          />
                        </label>
                        <label>
                          <span>Depth (m)</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1.5"
                            max="12"
                            value={selectedRoom.depth}
                            onChange={(e) => updateSelectedRoom({ depth: Number(e.target.value) })}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </aside>

            {/* Right 3D Stage + Live KPI Strip */}
            <section className="studio-stage">
              <Builder3D
                plot={plot}
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={setSelectedRoomId}
                wallSystem={wallSystem}
                wallHeightM={wallHeightM}
                floors={floors}
                roofStyle={roofStyle}
                buildStage={buildStage}
                xrayMode={xrayMode}
                buildMode={buildMode}
                activeTool={activeTool}
                pieceOrientation={pieceOrientation}
                placedPieces={placedPieces}
                onPlacePiece={handlePlacePiece}
                onRemovePiece={(id) =>
                  setPlacedPieces((prev) => prev.filter((p) => p.id !== id))
                }
              />

              {buildMode === 'room_snap' && (
                <div className="stage-scrubber">
                  <div className="scrubber-head">
                    <strong>Watch It Build Step-by-Step:</strong>
                    <span className="stage-current">{STAGE_LABELS[buildStage]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={buildStage}
                    onChange={(e) => setBuildStage(Number(e.target.value))}
                  />
                  <div className="scrubber-ticks">
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`tick-btn ${buildStage === s ? 'active' : ''}`}
                        onClick={() => setBuildStage(s)}
                      >
                        Stage {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {estimate && (
                <div className="kpi-strip">
                  <div className="kpi-item">
                    <span>
                      {buildMode === 'piece_by_piece'
                        ? 'Live Placed Pieces'
                        : isEps
                          ? 'EPS 3D Panels + Pegs'
                          : 'Blocks (Incl. Plinth & Waste)'}
                    </span>
                    <strong>
                      {buildMode === 'piece_by_piece' && estimate.quantities.pieceCounts
                        ? `${estimate.quantities.pieceCounts.epsPanelsPlaced} EPS · ${estimate.quantities.pieceCounts.blockBaysPlaced} bays · ${estimate.quantities.pieceCounts.singleBlocksPlaced} blocks · ${estimate.quantities.starterPegsCount} pegs`
                        : `${estimate.quantities.wallUnitsCount.toLocaleString()} ${
                            isEps ? `panels (${estimate.quantities.starterPegsCount} pegs)` : 'blocks'
                          }`}
                    </strong>
                  </div>
                  <div className="kpi-item">
                    <span>Cement Bags (50kg)</span>
                    <strong>{estimate.quantities.cementBags.toLocaleString()} bags</strong>
                  </div>
                  <div className="kpi-item">
                    <span>Site Water (Mix + Cure)</span>
                    <strong>
                      {estimate.quantities.waterLitres.toLocaleString()} L ({estimate.quantities.waterTanks1000L} tanks)
                    </strong>
                  </div>
                  <div className="kpi-item">
                    <span>Labour Crew Effort</span>
                    <strong>{estimate.quantities.labour.totalWorkerDays} worker-days</strong>
                  </div>
                  <div className="kpi-item highlight">
                    <span>Carcass / Full Move-In</span>
                    <strong>
                      {formatNaira(estimate.costs.carcassTotal)} / {formatNaira(estimate.costs.completeTurnkeyTotal)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setActiveTab('boq')}
                  >
                    Open Full BOQ →
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'boq' && (
          <BoqTab
            estimate={estimate}
            wallSystem={wallSystem}
            onSelectWallSystem={setWallSystem}
            priceOverrides={priceOverrides}
            onUpdatePrice={(key, val) =>
              setPriceOverrides((prev) => ({ ...prev, [key]: val }))
            }
            onResetPrices={() => setPriceOverrides({})}
          />
        )}

        {activeTab === 'roadmap' && (
          <RoadmapTab
            estimate={estimate}
            monthlySavings={monthlySavings}
            startingCash={startingCash}
            onChangeMonthlySavings={setMonthlySavings}
            onChangeStartingCash={setStartingCash}
            onLoadStarterCore={() => {
              loadTemplate('starter_core');
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'city' && (
          <CityGuideTab
            cityData={currentCityData}
            videos={videos}
            allCities={cities}
            selectedCityId={cityId}
            onChangeCity={(id) => {
              setCityId(id);
              setPriceOverrides({});
            }}
          />
        )}

        {activeTab === 'lab' && <SiteLabTab />}
      </main>
    </div>
  );
}
