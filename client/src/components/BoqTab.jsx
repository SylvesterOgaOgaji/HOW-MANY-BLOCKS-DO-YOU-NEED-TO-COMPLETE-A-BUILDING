import React, { useState } from 'react';
import MaterialXRay3D from './MaterialXRay3D.jsx';

const formatNaira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;

export default function BoqTab({
  estimate,
  wallSystem,
  onSelectWallSystem,
  priceOverrides,
  onUpdatePrice,
  onResetPrices
}) {
  const [showThumbRules, setShowThumbRules] = useState(false);
  const [showPriceEditor, setShowPriceEditor] = useState(false);

  if (!estimate) return null;

  const { notebookMath, quantities, costs, boqLines, comparison, thumbRules, pricesUsed } = estimate;
  const isEps = wallSystem === 'eps_panel';

  const editableItems = [
    { key: 'cement_bag', label: 'Cement (50kg, 42.5 grade)' },
    { key: 'block_9_inch', label: '9-inch Hollow Block' },
    { key: 'block_6_inch', label: '6-inch Hollow Block' },
    { key: 'eps_panel_m2', label: 'EPS 3D Wire-Mesh Panel (per m²)' },
    { key: 'rebar_12mm_12m', label: '12mm Iron Rod (12m length)' },
    { key: 'rebar_10mm_12m', label: '10mm Iron Rod (12m length)' },
    { key: 'sharp_sand_tipper', label: 'Sharp Sand (20T tipper)' },
    { key: 'granite_20mm_tipper', label: '20mm Granite (20T tipper)' },
    { key: 'roof_sheet_m2', label: 'Roofing Sheet (per m²)' },
    { key: 'water_1000l', label: 'Water Supply (per 1,000L)' },
    { key: 'mason_day', label: 'Mason Daily Rate' }
  ];

  return (
    <div className="tab-stack">
      {/* Side-by-Side Comparison: Blocks vs Polystyrene */}
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <h2>Blocks vs. Polystyrene (EPS) — Same House, Side by Side</h2>
            <p className="muted">
              Tap any option to switch your 3D model and recalculate foundation, water, and labour.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            Print / Save PDF BOQ
          </button>
        </div>

        <div className="compare-grid">
          {[
            { id: 'block_6', title: '6-inch Sandcrete Blocks', tag: 'Common Bungalow' },
            { id: 'block_9', title: '9-inch Sandcrete Blocks', tag: 'Standard Load-Bearing' },
            { id: 'eps_panel', title: 'Polystyrene (EPS) 3D Panels', tag: 'Platform + Pegs + Mesh' }
          ].map((opt) => {
            const c = comparison[opt.id];
            const active = wallSystem === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`compare-card ${active ? 'active' : ''}`}
                onClick={() => onSelectWallSystem(opt.id)}
              >
                <div className="compare-top">
                  <span className="compare-tag">{opt.tag}</span>
                  {active && <span className="active-badge">Selected</span>}
                </div>
                <h3>{opt.title}</h3>
                <div className="compare-metric">
                  <span>Wall Units</span>
                  <strong>{c.wallUnitsCount.toLocaleString()} {opt.id === 'eps_panel' ? 'panels' : 'blocks'}</strong>
                </div>
                <div className="compare-metric">
                  <span>Foundation + Walls + Roof (Carcass)</span>
                  <strong>{formatNaira(c.carcassTotal)}</strong>
                </div>
                <div className="compare-metric">
                  <span>Complete Move-In Estimate</span>
                  <strong>{formatNaira(c.completeTurnkeyTotal)}</strong>
                </div>
                <div className="compare-metric">
                  <span>Est. Shell Build Time</span>
                  <strong>~{c.estimatedDays} days</strong>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step-by-Step Visual Math + 3D Material X-Ray */}
      <section className="panel-card two-col-panel">
        <div>
          <div className="panel-head-tight">
            <h2>Step-by-Step Wall Math (No Guesswork)</h2>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowThumbRules((v) => !v)}
            >
              {showThumbRules ? 'Hide Thumb Rules' : '30s Thumb-Rule Sanity Check'}
            </button>
          </div>

          <div className="notebook-steps">
            <div className="step-row">
              <span className="step-num">1</span>
              <div>
                <strong>Gross Wall Area</strong>
                <p>
                  {notebookMath.grossWallLengthM}m unique wall length × {notebookMath.wallHeightM}m height
                  {notebookMath.floors > 1 ? ` × ${notebookMath.floors} floors` : ''} ={' '}
                  <code>{notebookMath.grossWallAreaM2} m²</code>
                </p>
              </div>
            </div>
            <div className="step-row">
              <span className="step-num">2</span>
              <div>
                <strong>Deduct Doors & Windows</strong>
                <p>
                  {notebookMath.doorsCount} doors ({notebookMath.doorsAreaM2} m²) +{' '}
                  {notebookMath.windowsCount} windows ({notebookMath.windowsAreaM2} m²) ={' '}
                  <code>−{notebookMath.totalOpeningsM2} m²</code> → Net Wall Area ={' '}
                  <code>{notebookMath.netWallAreaM2} m²</code>
                </p>
              </div>
            </div>
            <div className="step-row">
              <span className="step-num">3</span>
              <div>
                <strong>{isEps ? 'EPS Panel Coverage + Pegs' : 'Block Coverage + Mortar Joint'}</strong>
                <p>
                  {isEps
                    ? `1 standard 3D EPS panel (1.2m × 3.0m) = 3.60 m². Anchored onto ${quantities.starterPegsCount} vertical iron pegs on your raised concrete platform.`
                    : `Block + 10mm mortar joint (${notebookMath.effectiveBlockSizeMm}mm) ≈ 10 blocks/m².`}
                </p>
              </div>
            </div>
            <div className="step-row">
              <span className="step-num">4</span>
              <div>
                <strong>Total Order (Incl. {notebookMath.wastagePct}% Wastage)</strong>
                <p>
                  Order <code>{quantities.wallUnitsCount.toLocaleString()}</code>{' '}
                  {isEps ? 'EPS 3D panels' : 'blocks (incl. foundation plinth)'},{' '}
                  <code>{quantities.cementBags} bags</code> cement,{' '}
                  <code>{quantities.waterLitres.toLocaleString()} L</code> water ({quantities.waterTanks1000L} × 1,000L tanks), and{' '}
                  <code>{quantities.labour.totalWorkerDays}</code> total worker-days.
                </p>
              </div>
            </div>
          </div>

          {showThumbRules && (
            <div className="thumb-box">
              <h4>Preliminary Thumb-Rule Sanity Check ({thumbRules.builtAreaM2} m² built area)</h4>
              <p className="muted">
                Quick industry thumb rules before detailed structural drawings — useful for spotting wildly inflated contractor quotes:
              </p>
              <div className="thumb-grid">
                <span>Steel Rebar: <strong>~{thumbRules.preliminaryRebarKg.toLocaleString()} kg</strong></span>
                <span>Concrete: <strong>~{thumbRules.preliminaryConcreteM3} m³</strong></span>
                <span>Formwork Plywood: <strong>~{thumbRules.formworkPlywoodM2} m²</strong></span>
                <span>Plaster Sand: <strong>~{thumbRules.plasterSandM3} m³</strong></span>
              </div>
            </div>
          )}
        </div>

        <div className="xray-box">
          <h3>3D Material X-Ray: {isEps ? 'EPS Platform + Pegs + Mesh' : 'Hollow Block + 10mm Joint'}</h3>
          <p className="muted">
            {isEps
              ? 'Drag to spin: concrete platform (grey), vertical starter iron pegs, white EPS foam core, blue wire mesh, and two-coat shotcrete plaster.'
              : 'Drag to spin: standard 450×225mm hollow block sitting on a 10mm mortar bed (orange).'}
          </p>
          <MaterialXRay3D mode={isEps ? 'eps' : 'block'} />
        </div>
      </section>

      {/* Editable Market Prices + Itemized BOQ */}
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <h2>Complete Bill of Quantities (BOQ) — {estimate.meta.cityName}</h2>
            <p className="muted">
              Carcass Shell: <strong>{formatNaira(costs.carcassTotal)}</strong> · Complete Turnkey (w/ Doors, Windows, Plumbing, Wiring, Tiling):{' '}
              <strong>{formatNaira(costs.completeTurnkeyTotal)}</strong>
            </p>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowPriceEditor((v) => !v)}
            >
              {showPriceEditor ? 'Close Market Prices' : 'Edit Today’s Local Prices'}
            </button>
          </div>
        </div>

        {showPriceEditor && (
          <div className="price-editor">
            <div className="price-editor-head">
              <p>
                Building material prices move fast in Nigeria. Type your supplier’s exact quote below to update your entire BOQ instantly:
              </p>
              {Object.keys(priceOverrides).length > 0 && (
                <button type="button" className="btn-ghost" onClick={onResetPrices}>
                  Reset to {estimate.meta.cityName} Defaults
                </button>
              )}
            </div>
            <div className="price-grid">
              {editableItems.map((item) => (
                <label key={item.key} className="price-field">
                  <span>{item.label}</span>
                  <input
                    type="number"
                    min="0"
                    value={pricesUsed[item.key] ?? 0}
                    onChange={(e) => onUpdatePrice(item.key, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table className="boq-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Item & Engineering Spec</th>
                <th>Estimated Quantity</th>
                <th className="num">Cost (₦)</th>
              </tr>
            </thead>
            <tbody>
              {boqLines.map((line, idx) => (
                <tr key={idx}>
                  <td><span className="stage-pill">{line.stage}</span></td>
                  <td>{line.item}</td>
                  <td><code>{line.qty}</code></td>
                  <td className="num"><strong>{formatNaira(line.amount)}</strong></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}><strong>Carcass Total (Foundation + Walls + Roof + Water + Labour)</strong></td>
                <td className="num"><strong>{formatNaira(costs.carcassTotal)}</strong></td>
              </tr>
              <tr className="grand-row">
                <td colSpan={3}><strong>Estimated Move-In Total (Including Doors, Windows & MEP/Finish)</strong></td>
                <td className="num"><strong>{formatNaira(costs.completeTurnkeyTotal)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
