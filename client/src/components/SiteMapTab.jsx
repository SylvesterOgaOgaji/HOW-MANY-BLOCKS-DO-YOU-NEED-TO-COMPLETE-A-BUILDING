import React, { useEffect, useMemo, useRef, useState } from 'react';

const CITY_CENTERS = {
  abuja: { lat: 9.05785, lng: 7.49508, label: 'Abuja (Lugbe / Central)' },
  lagos_mainland: { lat: 6.6018, lng: 3.3515, label: 'Lagos Mainland (Ikeja)' },
  lagos_island: { lat: 6.4474, lng: 3.5419, label: 'Lagos Island / Lekki' },
  portharcourt: { lat: 4.8156, lng: 7.0498, label: 'Port Harcourt' },
  enugu: { lat: 6.4584, lng: 7.5464, label: 'Enugu' },
  kano: { lat: 12.0022, lng: 8.592, label: 'Kano' }
};

export default function SiteMapTab({
  cityId,
  plot,
  siteGeo,
  onApplyToStudio
}) {
  const [coordInput, setCoordInput] = useState(
    `${CITY_CENTERS[cityId]?.lat || 9.05785}, ${CITY_CENTERS[cityId]?.lng || 7.49508}`
  );
  const [beacons, setBeacons] = useState(siteGeo?.beacons || null);
  const [activeBeaconIdx, setActiveBeaconIdx] = useState(0);
  const [slopeHighEdge, setSlopeHighEdge] = useState(siteGeo?.slopeHighEdge || 'south');
  const [showSatelliteOverlay, setShowSatelliteOverlay] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const svgRef = useRef(null);

  // Sync beacons whenever user switches city unless custom beacons already exist
  const fetchGeoAnalysis = async (payload) => {
    try {
      const res = await fetch('/api/geo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysis(data);
        if (!payload.beacons && data.beacons) {
          setBeacons(data.beacons);
        }
      }
    } catch {
      // Ignore transient offline error
    }
  };

  useEffect(() => {
    fetchGeoAnalysis({
      city: cityId,
      coordQuery: coordInput,
      beacons: beacons || undefined,
      widthM: plot?.width || 15,
      depthM: plot?.depth || 30,
      slopeHighEdge
    });
  }, [cityId, slopeHighEdge]);

  const center = analysis?.polygon?.center || CITY_CENTERS[cityId] || CITY_CENTERS.abuja;

  const handleDropPresetBeacons = (w, d) => {
    setBeacons(null);
    setStatusMsg(`Dropped 4 survey beacons for ${w}m × ${d}m plot around ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}.`);
    fetchGeoAnalysis({
      city: cityId,
      lat: center.lat,
      lng: center.lng,
      widthM: w,
      depthM: d,
      slopeHighEdge
    });
  };

  const handleCenterFromInput = () => {
    setBeacons(null);
    setStatusMsg(`Centered survey grid on coordinates: ${coordInput}`);
    fetchGeoAnalysis({
      city: cityId,
      coordQuery: coordInput,
      widthM: plot?.width || 15,
      depthM: plot?.depth || 30,
      slopeHighEdge
    });
  };

  const handleMapClick = (e) => {
    if (!svgRef.current || !beacons || beacons.length < 3) return;
    const rect = svgRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width; // 0..1
    const ny = (e.clientY - rect.top) / rect.height; // 0..1

    // Map click onto a 50m x 50m survey viewport centered at `center`
    const spanMeters = 54;
    const dxMeters = (nx - 0.5) * spanMeters;
    const dyMeters = (0.5 - ny) * spanMeters;

    const R = 6378137;
    const lat = center.lat + (dyMeters / R) * (180 / Math.PI);
    const lng = center.lng + (dxMeters / (R * Math.cos((center.lat * Math.PI) / 180))) * (180 / Math.PI);

    const updated = beacons.map((b, idx) =>
      idx === activeBeaconIdx
        ? { ...b, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }
        : b
    );
    setBeacons(updated);
    setActiveBeaconIdx((activeBeaconIdx + 1) % updated.length);
    setStatusMsg(`Moved ${updated[activeBeaconIdx].label || `B${activeBeaconIdx + 1}`} — polygon & wind separation updated live.`);
    fetchGeoAnalysis({
      city: cityId,
      beacons: updated,
      slopeHighEdge
    });
  };

  // Project beacons cleanly into SVG 600x440 viewport
  const projectedView = useMemo(() => {
    const W = 600;
    const H = 440;
    if (!analysis?.polygon?.valid || !analysis?.beacons) {
      return { W, H, pts: [], polyStr: '' };
    }
    const localPts = analysis.polygon.localPoints;
    const maxDim = Math.max(analysis.polygon.widthM, analysis.polygon.depthM, 24);
    const scale = Math.min(260 / maxDim, 14);
    const polyW = analysis.polygon.widthM * scale;
    const polyD = analysis.polygon.depthM * scale;
    const offsetX = (W - polyW) / 2;
    const offsetY = (H - polyD) / 2;

    const pts = localPts.map((p, idx) => ({
      id: p.id || `B${idx + 1}`,
      sx: offsetX + p.x * scale,
      sy: offsetY + p.z * scale,
      rawX: p.x,
      rawZ: p.z
    }));

    const bh = analysis.advice?.boreholePos;
    const sep = analysis.advice?.septicPos;
    return {
      W,
      H,
      scale,
      offsetX,
      offsetY,
      pts,
      polyStr: pts.map((p) => `${p.sx},${p.sy}`).join(' '),
      bhScreen: bh ? { x: offsetX + bh.x * scale, y: offsetY + bh.z * scale } : null,
      sepScreen: sep ? { x: offsetX + sep.x * scale, y: offsetY + sep.z * scale } : null
    };
  }, [analysis]);

  const tileUrl = useMemo(() => {
    // Open-standard Z=17 Slippy Map tile center preview when Online Satellite mode is toggled ON
    const zoom = 17;
    const latRad = (center.lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const xtile = Math.floor(((center.lng + 180) / 360) * n);
    const ytile = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
    );
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ytile}/${xtile}`;
  }, [center.lat, center.lng]);

  return (
    <div className="tab-stack">
      <section className="panel-card">
        <div className="panel-head-row">
          <div>
            <h2>Google Map / Satellite Land Pinpoint, Survey Beacons & Wind/Water Siting</h2>
            <p className="muted-p">
              Paste coordinates from Google Maps or WhatsApp, click the 4 survey beacons on your plot, check Nigeria SW Monsoon & Harmattan winds, and position Borehole vs. Soakaway safely.
            </p>
          </div>
          {analysis?.polygon?.valid && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => onApplyToStudio(analysis)}
            >
              Apply Land & Wind Siting to 3D Studio →
            </button>
          )}
        </div>

        {/* Coordinate & Preset Controls */}
        <div className="map-toolbar">
          <div className="map-search-group">
            <input
              type="text"
              className="title-input"
              style={{ width: '320px', maxWidth: '100%' }}
              value={coordInput}
              onChange={(e) => setCoordInput(e.target.value)}
              placeholder="Paste Lat, Lng or Google Maps link (e.g. 9.05785, 7.49508)"
            />
            <button type="button" className="btn-secondary" onClick={handleCenterFromInput}>
              Pin Coordinates
            </button>
          </div>

          <div className="map-preset-group">
            <button type="button" className="btn-secondary" onClick={() => handleDropPresetBeacons(9, 30)}>
              Half Plot (9×30m)
            </button>
            <button type="button" className="btn-secondary" onClick={() => handleDropPresetBeacons(15, 30)}>
              Standard (15×30m)
            </button>
            <button type="button" className="btn-secondary" onClick={() => handleDropPresetBeacons(18, 36)}>
              Full Plot (18×36m)
            </button>
            <label className="checkbox-row" style={{ marginTop: 0 }}>
              <input
                type="checkbox"
                checked={showSatelliteOverlay}
                onChange={(e) => setShowSatelliteOverlay(e.target.checked)}
              />
              <span>Online Satellite Tile</span>
            </label>
          </div>
        </div>

        {statusMsg && (
          <div className="notice-bar" style={{ borderRadius: 8, marginBottom: 12 }}>
            <span>{statusMsg}</span>
            <button type="button" className="notice-close" onClick={() => setStatusMsg('')}>
              ×
            </button>
          </div>
        )}

        <div className="map-layout-grid">
          {/* Interactive Survey & Wind Canvas */}
          <div className="map-canvas-card">
            <div className="map-beacon-bar">
              <span>Click map to reposition active beacon:</span>
              {(beacons || [{ id: 'B1' }, { id: 'B2' }, { id: 'B3' }, { id: 'B4' }]).map((b, idx) => (
                <button
                  key={b.id || idx}
                  type="button"
                  className={`tick-btn ${activeBeaconIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveBeaconIdx(idx)}
                >
                  {b.id || `B${idx + 1}`}
                </button>
              ))}
            </div>

            <div className="survey-viewport">
              {showSatelliteOverlay && (
                <img
                  src={tileUrl}
                  alt="Satellite tile preview"
                  className="satellite-bg-tile"
                />
              )}
              <svg
                ref={svgRef}
                viewBox={`0 0 ${projectedView.W} ${projectedView.H}`}
                className="survey-svg"
                onClick={handleMapClick}
              >
                {/* Survey Grid Lines */}
                <defs>
                  <pattern id="surveyGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,184,0.28)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={showSatelliteOverlay ? 'rgba(15,23,42,0.22)' : 'url(#surveyGrid)'} />

                {/* North Arrow */}
                <g transform="translate(550, 44)">
                  <circle r="22" fill="rgba(255,255,255,0.9)" stroke="#475569" strokeWidth="1.5" />
                  <polygon points="0,-16 6,6 0,2 -6,6" fill="#b91c1c" />
                  <text x="0" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">N</text>
                </g>

                {/* SW Monsoon Cool Breeze Arrows (Bottom-Left -> Top-Right) */}
                <g opacity="0.82">
                  <line x1="36" y1="400" x2="122" y2="330" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 4" />
                  <polygon points="126,326 112,330 119,340" fill="#0284c7" />
                  <text x="26" y="422" fontSize="11" fontWeight="bold" fill="#0369a1">
                    SW Cool Breeze (Apr–Oct)
                  </text>
                </g>

                {/* NE Harmattan Dry Dust Wind Arrows (Top-Right -> Bottom-Left) */}
                <g opacity="0.82">
                  <line x1="510" y1="78" x2="430" y2="140" stroke="#d97706" strokeWidth="3" strokeDasharray="6 4" />
                  <polygon points="426,144 440,140 433,130" fill="#d97706" />
                  <text x="415" y="64" fontSize="11" fontWeight="bold" fill="#b45309">
                    NE Harmattan (Nov–Mar)
                  </text>
                </g>

                {/* Beacon Polygon */}
                {projectedView.polyStr && (
                  <polygon
                    points={projectedView.polyStr}
                    fill="rgba(34, 197, 94, 0.22)"
                    stroke="#15803d"
                    strokeWidth="2.5"
                  />
                )}

                {/* Recommended Rotated House Footprint inside Polygon */}
                {analysis?.polygon?.valid && (
                  <g
                    transform={`translate(${projectedView.W / 2}, ${projectedView.H / 2}) rotate(${analysis.advice?.recommendedHouseRotationDeg || 12})`}
                  >
                    <rect
                      x={-(Math.max(4, analysis.polygon.widthM - 3.6) * projectedView.scale) / 2}
                      y={-(Math.max(4, analysis.polygon.depthM - 7) * projectedView.scale) / 2}
                      width={Math.max(4, analysis.polygon.widthM - 3.6) * projectedView.scale}
                      height={Math.max(4, analysis.polygon.depthM - 7) * projectedView.scale}
                      fill="rgba(245, 158, 11, 0.35)"
                      stroke="#b45309"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#7c2d12">
                      Optimal House Orientation (+{analysis.advice?.recommendedHouseRotationDeg}°)
                    </text>
                  </g>
                )}

                {/* Borehole vs Septic Separation Line & Pins */}
                {projectedView.bhScreen && projectedView.sepScreen && (
                  <g>
                    <line
                      x1={projectedView.bhScreen.x}
                      y1={projectedView.bhScreen.y}
                      x2={projectedView.sepScreen.x}
                      y2={projectedView.sepScreen.y}
                      stroke={analysis?.advice?.safeSeparation ? '#16a34a' : '#dc2626'}
                      strokeWidth="2"
                      strokeDasharray="5 4"
                    />
                    <circle cx={projectedView.bhScreen.x} cy={projectedView.bhScreen.y} r="9" fill="#0284c7" stroke="#fff" strokeWidth="2" />
                    <text x={projectedView.bhScreen.x + 12} y={projectedView.bhScreen.y + 4} fontSize="11" fontWeight="bold" fill="#0369a1">
                      Borehole (Water)
                    </text>
                    <circle cx={projectedView.sepScreen.x} cy={projectedView.sepScreen.y} r="9" fill="#334155" stroke="#fff" strokeWidth="2" />
                    <text x={projectedView.sepScreen.x - 105} y={projectedView.sepScreen.y + 4} fontSize="11" fontWeight="bold" fill="#1e293b">
                      Septic / Soakaway
                    </text>
                  </g>
                )}

                {/* Survey Beacon Corner Pins & Edge Distances */}
                {projectedView.pts.map((pt, idx) => {
                  const next = projectedView.pts[(idx + 1) % projectedView.pts.length];
                  const edge = analysis?.polygon?.edges?.[idx];
                  const midX = (pt.sx + next.sx) / 2;
                  const midY = (pt.sy + next.sy) / 2;
                  return (
                    <g key={pt.id}>
                      {edge && (
                        <text
                          x={midX}
                          y={midY - 6}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fill="#0f172a"
                        >
                          {edge.lengthM}m
                        </text>
                      )}
                      <circle cx={pt.sx} cy={pt.sy} r="8" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                      <text x={pt.sx} y={pt.sy - 12} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#991b1b">
                        {pt.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right Analysis & Wind/Water Engineering Advice */}
          <div className="map-advice-col">
            {analysis?.polygon?.valid && (
              <>
                <div className="control-card">
                  <h3>Measured Survey Land Summary</h3>
                  <div className="map-stat-grid">
                    <div>
                      <span>Land Area</span>
                      <strong>{analysis.polygon.areaM2} m² ({analysis.polygon.plots450Equivalent} plots)</strong>
                    </div>
                    <div>
                      <span>Usable Span</span>
                      <strong>{analysis.polygon.widthM}m × {analysis.polygon.depthM}m</strong>
                    </div>
                    <div>
                      <span>Perimeter Wall</span>
                      <strong>{analysis.polygon.perimeterM} m</strong>
                    </div>
                    <div>
                      <span>Center GPS</span>
                      <strong>{analysis.polygon.center.lat}, {analysis.polygon.center.lng}</strong>
                    </div>
                  </div>
                </div>

                <div className="control-card">
                  <h3>Wind & Sun Orientation Advisor</h3>
                  <p className="hint-text"><strong>Region:</strong> {analysis.advice.climateRegion}</p>
                  <ul className="check-list">
                    <li>
                      <strong>{analysis.advice.winds.monsoon.name}:</strong> {analysis.advice.winds.monsoon.advice}
                    </li>
                    <li>
                      <strong>{analysis.advice.winds.harmattan.name}:</strong> {analysis.advice.winds.harmattan.advice}
                    </li>
                    <li>
                      <strong>Afternoon Sun:</strong> {analysis.advice.sunPath.afternoon}
                    </li>
                  </ul>
                </div>

                <div className="control-card">
                  <h3>Water Borehole vs. Soakaway Hygiene</h3>
                  <div className={analysis.advice.safeSeparation ? 'advice-box diy' : 'advice-box pause'}>
                    <strong>
                      Separation Distance: {analysis.advice.separationM} m ({analysis.advice.safeSeparation ? 'SAFE >= 15m' : 'TOO CLOSE'})
                    </strong>
                    <p style={{ margin: '6px 0 0', fontSize: '0.84rem' }}>{analysis.advice.hygieneNote}</p>
                  </div>
                  <label className="stack-label" style={{ marginTop: 10 }}>
                    <span>Land Slope High Side (For Natural Drainage)</span>
                    <select value={slopeHighEdge} onChange={(e) => setSlopeHighEdge(e.target.value)}>
                      <option value="south">South / Front Road Higher</option>
                      <option value="north">North / Rear Higher</option>
                      <option value="west">West Higher</option>
                    </select>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
