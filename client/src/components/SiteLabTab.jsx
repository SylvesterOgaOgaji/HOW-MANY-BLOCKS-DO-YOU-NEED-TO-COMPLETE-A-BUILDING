import React, { useState } from 'react';
import { FIELD_QUIZZES, REBAR_STAMP_PARTS } from '../data/presets.js';

export default function SiteLabTab() {
  const [selectedCode, setSelectedCode] = useState(REBAR_STAMP_PARTS[0]);
  const [mixRatio, setMixRatio] = useState('1:1.5:3');
  const [cementBags, setCementBags] = useState(10);
  const [excLen, setExcLen] = useState(10);
  const [excWid, setExcWid] = useState(0.45);
  const [excDep, setExcDep] = useState(1.0);
  const [swellPct, setSwellPct] = useState(30);
  const [answers, setAnswers] = useState({});

  const ratios = {
    '1:1.5:3': { sand: 1.5, gravel: 3, label: 'Columns, Beams & High-Strength Concrete' },
    '1:2:3': { sand: 2, gravel: 3, label: 'General RCC Footings, Slabs & Platforms' },
    '1:2:4': { sand: 2, gravel: 4, label: 'Standard Strip Footing & German Floor' }
  };
  const r = ratios[mixRatio];
  const waterLitres = cementBags * 25; // w/c = 0.50 -> 25L per 50kg bag
  const sandBuckets = (cementBags * r.sand * 2).toFixed(1); // ~2 headpans/buckets per 50kg bag volume (0.035m3)
  const gravelBuckets = (cementBags * r.gravel * 2).toFixed(1);

  const bankVol = excLen * excWid * excDep;
  const looseVol = bankVol * (1 + swellPct / 100);
  const tipperTrips = Math.ceil(looseVol / 12);

  return (
    <div className="tab-stack">
      {/* Rebar Stamp Decoder + Concrete Mix Lab */}
      <section className="panel-card two-col-panel">
        <div>
          <h2>1. Iron Rod Stamp Decoder (Check Before Offloading)</h2>
          <p className="muted">
            Tap any marking stamped on a reinforcement bar to see what it means on site:
          </p>
          <div className="rebar-bar">
            {REBAR_STAMP_PARTS.map((part) => (
              <button
                key={part.code}
                type="button"
                className={`rebar-token ${selectedCode.code === part.code ? 'active' : ''}`}
                onClick={() => setSelectedCode(part)}
              >
                {part.code}
              </button>
            ))}
          </div>
          <div className="rebar-detail">
            <strong>{selectedCode.code} — {selectedCode.title}</strong>
            <p>{selectedCode.detail}</p>
          </div>

          <h3 className="subhead">Column Size Quick Guide</h3>
          <div className="mini-table">
            <div><strong>9" × 9" (225×225mm)</strong><span>4–Y16 or 4–Y12, Y8 @ 150mm · Light bungalows</span></div>
            <div><strong>9" × 12" (225×300mm)</strong><span>4–Y16, Y8 @ 150mm · Standard G+1 / G+2 residential</span></div>
            <div><strong>12" × 12" (300×300mm)</strong><span>4–Y20, Y8 @ 150mm · Multi-storey / heavier spans</span></div>
          </div>
        </div>

        <div>
          <h2>2. Concrete Mix & Water Calculator</h2>
          <p className="muted">
            Wrong watery mix causes weak, cracked concrete. Keep clean water at <strong>25 litres per 50kg bag</strong> (w/c = 0.50).
          </p>
          <div className="mix-controls">
            <label>
              <span>Mix Ratio</span>
              <select value={mixRatio} onChange={(e) => setMixRatio(e.target.value)}>
                <option value="1:1.5:3">1 : 1.5 : 3 (Columns / Beams)</option>
                <option value="1:2:3">1 : 2 : 3 (Slabs / EPS Platform)</option>
                <option value="1:2:4">1 : 2 : 4 (Strip Footing / Floor)</option>
              </select>
            </label>
            <label>
              <span>Bags of Cement (50kg)</span>
              <input
                type="number"
                min="1"
                max="500"
                value={cementBags}
                onChange={(e) => setCementBags(Math.max(1, Number(e.target.value)))}
              />
            </label>
          </div>
          <div className="mix-result">
            <p className="muted">{r.label}</p>
            <div className="thumb-grid">
              <span>Cement: <strong>{cementBags} bags</strong></span>
              <span>Sharp Sand: <strong>~{sandBuckets} headpans</strong></span>
              <span>20mm Granite: <strong>~{gravelBuckets} headpans</strong></span>
              <span>Clean Water: <strong>{waterLitres} Litres</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Excavation Swell & Spirit Level Check */}
      <section className="panel-card two-col-panel">
        <div>
          <h2>3. Trench Excavation & Tipper Swell Calculator</h2>
          <p className="muted">
            Dug soil expands by 30%–40%. Pay diggers on <strong>Bank Volume</strong>, book haulage tippers on <strong>Loose Volume</strong>.
          </p>
          <div className="mix-controls">
            <label>
              <span>Length (m)</span>
              <input type="number" step="0.5" value={excLen} onChange={(e) => setExcLen(Math.max(0.5, Number(e.target.value)))} />
            </label>
            <label>
              <span>Width (m)</span>
              <input type="number" step="0.05" value={excWid} onChange={(e) => setExcWid(Math.max(0.2, Number(e.target.value)))} />
            </label>
            <label>
              <span>Depth (m)</span>
              <input type="number" step="0.1" value={excDep} onChange={(e) => setExcDep(Math.max(0.2, Number(e.target.value)))} />
            </label>
            <label>
              <span>Soil Swell (%)</span>
              <input type="number" step="5" value={swellPct} onChange={(e) => setSwellPct(Math.max(10, Number(e.target.value)))} />
            </label>
          </div>
          <div className="mix-result">
            <div className="thumb-grid">
              <span>Bank (In-Situ): <strong>{bankVol.toFixed(2)} m³</strong></span>
              <span>Loose (Bulked): <strong>{looseVol.toFixed(2)} m³</strong></span>
              <span>20T Tipper Trips: <strong>~{tipperTrips} trip(s)</strong></span>
            </div>
          </div>
        </div>

        <div>
          <h2>4. DIY Field Quality Checks (Zero Cost)</h2>
          <ul className="clean-list">
            <li>
              <strong>Spirit Level 180° Reversal Test:</strong> Place the mason’s level on a flat wall, mark the bubble, then spin the level 180° end-for-end. If the bubble shifts, that level is bent—don’t build with it!
            </li>
            <li>
              <strong>Commercial Block Audit:</strong> One 50kg cement bag should yield <strong>28–30 (9-inch)</strong> or <strong>35–38 (6-inch)</strong> solid/hollow blocks. Drop a cured block from waist height onto sand—quality blocks won’t crumble to dust.
            </li>
            <li>
              <strong>Water Hose Leveling:</strong> A transparent water-filled hose costs ~₦3,000 and transfers exact floor/foundation levels across your entire plot without a surveyor’s optical dumpy level.
            </li>
          </ul>
        </div>
      </section>

      {/* Interactive 1-Minute Site Quizzes */}
      <section className="panel-card">
        <h2>5. Test Yourself: 1-Minute Site Audit Quizzes</h2>
        <div className="quiz-grid">
          {FIELD_QUIZZES.map((q) => {
            const chosenId = answers[q.id];
            const chosen = q.options.find((o) => o.id === chosenId);
            return (
              <article key={q.id} className="quiz-card">
                <h4>{q.title}</h4>
                <p>{q.prompt}</p>
                <div className="quiz-options">
                  {q.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`quiz-opt ${
                        chosenId === opt.id ? (opt.correct ? 'correct' : 'wrong') : ''
                      }`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {chosen && (
                  <p className={`quiz-feedback ${chosen.correct ? 'ok' : 'bad'}`}>
                    {chosen.correct ? 'Correct! ' : 'Watch out: '}
                    {q.explanation}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
