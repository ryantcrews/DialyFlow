import { StatusChip } from '../StatusChip';
import { AppPreviewPatientList } from './AppPreviewPatientList';
import {
  PREVIEW_PATIENTS,
  previewCompleteCount,
  previewNeedsCompCount,
} from './previewData';

export function HeroProductVisual() {
  const complete = previewCompleteCount(PREVIEW_PATIENTS);
  const needsComp = previewNeedsCompCount(PREVIEW_PATIENTS);

  return (
    <div className="mkt-hero-visual-stack" aria-hidden="true">
      <div className="mkt-hero-stats-card">
        <p className="mkt-hero-stats-label">Note progress · MWF AM</p>
        <div className="mkt-hero-stats-row">
          <div>
            <span className="mkt-hero-stats-num">{PREVIEW_PATIENTS.length}</span>
            <span className="mkt-hero-stats-key">Patients</span>
          </div>
          <div>
            <span className="mkt-hero-stats-num mkt-hero-stats-num--success">{complete}</span>
            <span className="mkt-hero-stats-key">Complete</span>
          </div>
          <div>
            <span className="mkt-hero-stats-num mkt-hero-stats-num--pending">{needsComp}</span>
            <span className="mkt-hero-stats-key">Need Comp</span>
          </div>
        </div>
      </div>
      <div className="mkt-hero-mockup-wrap">
        <AppPreviewPatientList patients={PREVIEW_PATIENTS} showSummary={false} />
      </div>
      <div className="mkt-hero-note-card">
        <span className="mkt-hero-note-label">Visit logged</span>
        <div className="attest-visit-chips app-preview-hero-chips">
          <StatusChip variant="neutral" label="Comprehensive" />
          <StatusChip variant="neutral" label="CIPA: Yes" />
          <StatusChip variant="neutral" label="Seen on HD: Yes" />
        </div>
        <span className="mkt-hero-note-text">Martinez, James · MWF AM</span>
      </div>
    </div>
  );
}
