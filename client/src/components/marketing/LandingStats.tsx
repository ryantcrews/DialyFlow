import { STATS } from './marketingContent';

export function LandingStats() {
  return (
    <section className="mkt-stats mkt-band mkt-band-white" aria-label="Platform metrics">
      <div className="mkt-band-inner">
        <ul className="mkt-stat-grid">
          {STATS.map((stat) => (
            <li key={stat.label} className="mkt-stat">
              <span className="mkt-stat-value">{stat.value}</span>
              <span className="mkt-stat-label">{stat.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
