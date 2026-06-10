import { appLoginHref, marketingHref } from '../../utils/routes';
import { FINAL_CTA, demoMailtoHref } from './marketingContent';

export function LandingFinalCta() {
  return (
    <section className="mkt-section mkt-band mkt-band-white">
      <div className="mkt-band-inner">
        <div className="mkt-final-cta">
          <h2 className="mkt-section-title">{FINAL_CTA.title}</h2>
          <p className="mkt-section-lead">{FINAL_CTA.lead}</p>
          <div className="mkt-final-cta-actions">
            <a className="mkt-btn mkt-btn--primary" href={demoMailtoHref()}>
              Contact us for a demo
            </a>
            <a className="mkt-btn mkt-btn--secondary" href={marketingHref('/security')}>
              View security overview
            </a>
          </div>
          <p className="mkt-final-cta-login">
            Already have access?{' '}
            <a href={appLoginHref()}>Log in to your workspace</a>
          </p>
        </div>
      </div>
    </section>
  );
}
