import React from 'react';

const formatNaira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;

export default function RoadmapTab({
  estimate,
  monthlySavings,
  startingCash,
  onChangeMonthlySavings,
  onChangeStartingCash,
  onLoadStarterCore
}) {
  if (!estimate) return null;
  const { phases, costs, meta } = estimate;
  const totalMonths = phases.length ? phases[phases.length - 1].cumulativeMonths : 0;

  return (
    <div className="tab-stack">
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <h2>Build-As-You-Earn Coach (For Hustlers & Civil Servants)</h2>
            <p className="muted">
              Most Nigerians don’t build with one lump sum. Enter what you can save monthly or raise via cooperative/loan to see each safe milestone.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onLoadStarterCore}>
            Try “1-Bed Starter Core” Strategy
          </button>
        </div>

        <div className="savings-controls">
          <label className="control-field">
            <span>Cash on Hand Right Now (₦)</span>
            <input
              type="number"
              step="50000"
              min="0"
              value={startingCash}
              onChange={(e) => onChangeStartingCash(Math.max(0, Number(e.target.value)))}
            />
          </label>
          <label className="control-field">
            <span>Monthly Savings Capacity (₦ / month)</span>
            <input
              type="number"
              step="10000"
              min="20000"
              value={monthlySavings}
              onChange={(e) => onChangeMonthlySavings(Math.max(20000, Number(e.target.value)))}
            />
          </label>
          <div className="summary-stat">
            <span>Estimated Time to Complete Shell + Finish</span>
            <strong>{totalMonths} months ({(totalMonths / 12).toFixed(1)} yrs)</strong>
          </div>
        </div>

        <div className="strategy-banner">
          <strong>The “Stop Paying Rent First” Rule:</strong> If {formatNaira(costs.completeTurnkeyTotal)} feels heavy at once, build Stage 1–4 on a{' '}
          <strong>1-Bedroom Starter Core</strong> (or finish 1 bedroom + bath + kitchen inside your 3-bedroom plan), move in once doors & windows are mounted, and redirect your annual rent straight into finishing the remaining rooms!
        </div>
      </section>

      <section className="roadmap-list">
        {phases.map((phase) => (
          <article key={phase.step} className="phase-card">
            <div className="phase-header">
              <div className="phase-title-group">
                <span className="phase-badge">Stage {phase.step}</span>
                <h3>{phase.title}</h3>
              </div>
              <div className="phase-numbers">
                <span className="phase-cost">{formatNaira(phase.cost)}</span>
                <span className="phase-time">
                  {phase.monthsToSave === 0
                    ? 'Covered by starting cash'
                    : `+${phase.monthsToSave} mo (Month ${phase.cumulativeMonths})`}
                </span>
              </div>
            </div>

            <div className="phase-advice-grid">
              <div className="advice-box pause-box">
                <strong>How to Pause Safely & Avoid Inflation Traps</strong>
                <p>{phase.pauseSafe}</p>
              </div>
              <div className="advice-box diy-box">
                <strong>DIY Actions (Save Labour Money Yourself)</strong>
                <p>{phase.diyTip}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="panel-card">
        <h3>Key Rules for {meta.wallSystem === 'eps_panel' ? 'Polystyrene (EPS)' : 'Sandcrete Block'} Stage Pauses</h3>
        <ul className="clean-list">
          <li>
            <strong>Never buy cement months ahead:</strong> Bagged cement absorbs humidity and cakes within 6–8 weeks. Buy <em>iron rods</em>, <em>stone/granite</em>, or <em>moulded blocks</em> if hedging against price spikes.
          </li>
          <li>
            <strong>Protect exposed steel & EPS pegs:</strong> If you pause after casting your foundation or EPS platform, brush exposed starter bars/pegs with a cement slurry wash or anti-rust primer so rainwater doesn’t pit the steel.
          </li>
          <li>
            <strong>Plan water before bricks arrive:</strong> Your build needs roughly{' '}
            <strong>{estimate.quantities.waterLitres.toLocaleString()} litres</strong> of clean water—if there’s no borehole yet, factor tanker water or dig your borehole/well in Stage 1.
          </li>
        </ul>
      </section>
    </div>
  );
}
