import { StatusChip } from '../StatusChip';
import { AppPreviewAttestBoard } from './AppPreviewAttestBoard';
import { AppPreviewPatientList } from './AppPreviewPatientList';
import { WORKFLOW_STEPS } from './marketingContent';
import { PREVIEW_PATIENTS_COMPACT } from './previewData';

function WorkflowPreview({ step }: { step: number }) {
  if (step === 0) {
    return <AppPreviewPatientList patients={PREVIEW_PATIENTS_COMPACT} compact showSummary={false} />;
  }
  if (step === 1) {
    return (
      <div className="app-preview-panel app-preview-panel--compact app-preview-visit-log" aria-hidden="true">
        <span className="app-preview-visit-log-label">Visit saved</span>
        <div className="attest-visit-chips">
          <StatusChip variant="neutral" label="Basic" />
          <StatusChip variant="neutral" label="CIPA: Yes" />
          <StatusChip variant="neutral" label="Seen on HD: Yes" />
        </div>
        <p className="meta">Martinez, James · MWF AM</p>
      </div>
    );
  }
  return <AppPreviewAttestBoard compact />;
}

export function LandingWorkflow() {
  return (
    <section className="mkt-section mkt-band mkt-band-white" id="how-it-works">
      <div className="mkt-band-inner">
        <div className="mkt-section-header mkt-section-header--center">
          <h2 className="mkt-section-title">How it works</h2>
          <p className="mkt-section-lead">Three steps from patient list to signed-off day.</p>
        </div>
        <ol className="mkt-timeline">
          {WORKFLOW_STEPS.map((step, index) => (
            <li key={step.title} className="mkt-timeline-step">
              <div className="mkt-timeline-marker">{index + 1}</div>
              <div className="mkt-timeline-content">
                <h3 className="mkt-timeline-title">{step.title}</h3>
                <p className="mkt-timeline-body">{step.body}</p>
                <div className="mkt-timeline-preview">
                  <WorkflowPreview step={index} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
