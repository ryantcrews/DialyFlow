import { FeatureIcon } from './FeatureIcon';
import { FEATURES } from './marketingContent';

export function LandingFeatures() {
  return (
    <section className="mkt-section mkt-band mkt-band-blue" id="features">
      <div className="mkt-band-inner">
        <div className="mkt-section-header mkt-section-header--center">
          <h2 className="mkt-section-title">Built for dialysis rounds</h2>
          <p className="mkt-section-lead">
            Everything your team needs from morning rounds through end-of-day attestation.
          </p>
        </div>
        <ul className="mkt-features-grid">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="mkt-feature-card">
              <span className="mkt-feature-icon">
                <FeatureIcon type={feature.icon} />
              </span>
              <span className="mkt-feature-label">{feature.label}</span>
              <h3 className="mkt-feature-title">{feature.title}</h3>
              <p className="mkt-feature-body">{feature.body}</p>
              <p className="mkt-feature-metric">{feature.metric}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
