import { marketingHref } from '../../utils/routes';
import { SECURITY_BADGES } from './marketingContent';

export function LandingSecurityTeaser() {
  return (
    <section className="mkt-section mkt-band mkt-band-gray">
      <div className="mkt-band-inner">
        <div className="mkt-section-header mkt-section-header--center">
          <h2 className="mkt-section-title">Security &amp; Compliance</h2>
          <p className="mkt-section-lead">
            Session-gated access, audit trails, and architecture designed for HIPAA-conscious
            deployments.
          </p>
        </div>
        <ul className="mkt-security-badges">
          {SECURITY_BADGES.map((badge) => (
            <li key={badge.title} className="mkt-badge-card">
              <span className="mkt-badge-check" aria-hidden="true">
                ✓
              </span>
              <div>
                <h3 className="mkt-badge-title">{badge.title}</h3>
                <p className="mkt-badge-body">{badge.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mkt-security-cta">
          <a className="mkt-btn mkt-btn--primary" href={marketingHref('/security')}>
            View security overview
          </a>
        </div>
      </div>
    </section>
  );
}
