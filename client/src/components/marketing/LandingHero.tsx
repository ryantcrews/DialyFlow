import { appLoginHref } from '../../utils/routes';
import { HERO } from './marketingContent';
import { HeroProductVisual } from './HeroProductVisual';

export function LandingHero() {
  return (
    <section className="mkt-hero mkt-band mkt-band-white">
      <div className="mkt-band-inner">
        <div className="mkt-hero-grid">
          <div className="mkt-hero-copy">
            <p className="mkt-eyebrow">{HERO.eyebrow}</p>
            <h1 className="mkt-hero-title">{HERO.title}</h1>
            <p className="mkt-lead">{HERO.lead}</p>
            <div className="mkt-hero-actions">
              <a className="mkt-btn mkt-btn--primary" href={appLoginHref()}>
                Log in
              </a>
              <a className="mkt-btn mkt-btn--secondary" href="#how-it-works">
                See how it works
              </a>
            </div>
          </div>
          <div className="mkt-hero-visual">
            <HeroProductVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
