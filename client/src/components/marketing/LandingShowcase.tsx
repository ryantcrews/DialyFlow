import { ProductMockupAttestBoard } from './ProductMockupAttestBoard';

const CALLOUTS = [
  'Visits grouped by dialysis unit',
  'Work one shift at a time',
  'Telemed or in-person locked at sign-off',
  'Completed visits stay visible for audit',
];

export function LandingShowcase() {
  return (
    <section className="mkt-section mkt-band mkt-band-white">
      <div className="mkt-band-inner">
        <div className="mkt-showcase-panel">
          <div className="mkt-showcase-grid">
            <div>
              <p className="mkt-eyebrow">Attestation desk</p>
              <h2 className="mkt-section-title">Sign off a full day in one view</h2>
              <p className="mkt-section-lead">
                The batch attest board organizes visits by location and shift — pending and
                attested status on every card.
              </p>
              <ul className="mkt-showcase-callouts">
                {CALLOUTS.map((text) => (
                  <li key={text} className="mkt-showcase-callout">
                    <span className="mkt-showcase-check" aria-hidden="true">
                      ✓
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <ProductMockupAttestBoard />
          </div>
        </div>
      </div>
    </section>
  );
}
