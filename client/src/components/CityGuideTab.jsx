import React from 'react';

export default function CityGuideTab({ cityData, videos, allCities, selectedCityId, onChangeCity }) {
  if (!cityData) return null;

  return (
    <div className="tab-stack">
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <h2>City, Soil, Approvals & Local Sourcing — {cityData.name}</h2>
            <p className="muted">
              Don’t import expensive materials—see where to source polystyrene (EPS), blocks, and steel locally, and which government offices clear your land and building plan.
            </p>
          </div>
          <label className="inline-select">
            <span>Switch City</span>
            <select value={selectedCityId} onChange={(e) => onChangeCity(e.target.value)}>
              {allCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="guide-two-col">
          <div className="guide-block">
            <h3>Soil & Foundation Reality</h3>
            <p>{cityData.soilProfile}</p>
            <div className="sub-callout">
              <strong>If Building with Sandcrete Blocks:</strong>
              <p>{cityData.recommendedFoundation.blocks}</p>
            </div>
            <div className="sub-callout">
              <strong>If Building with Polystyrene (EPS):</strong>
              <p>{cityData.recommendedFoundation.eps}</p>
            </div>
          </div>

          <div className="guide-block">
            <h3>Where to Go for Land & Building Approvals</h3>
            <ol className="approval-list">
              {cityData.approvals.map((item, idx) => (
                <li key={idx}>
                  <strong>{item.agency}</strong>
                  <p>{item.step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <h3>Local Material & Polystyrene (EPS) Sourcing Hubs in {cityData.name}</h3>
        <div className="supplier-grid">
          {cityData.localSuppliers.map((sup, idx) => (
            <article key={idx} className="supplier-card">
              <h4>{sup.name}</h4>
              <p className="supplier-focus">{sup.focus}</p>
              <p className="supplier-tip">
                <strong>Buyer Check:</strong> {sup.tip}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <h3>Learn from Global & Local Builds (YouTube Guides — Adapted for Nigeria)</h3>
        <p className="muted">
          Watch how EPS polystyrene platforms, starter pegs, shotcreting, and DIY setting-out work in Brazil, India, the US, and Nigerian sites—then source the panels locally.
        </p>
        <div className="video-grid">
          {videos.map((v) => (
            <article key={v.id} className="video-card">
              <span className="video-cat">{v.category} · {v.region}</span>
              <h4>{v.title}</h4>
              <p>{v.takeaway}</p>
              <a
                className="video-link"
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.query)}`}
                target="_blank"
                rel="noreferrer"
              >
                Watch YouTube Guides →
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
