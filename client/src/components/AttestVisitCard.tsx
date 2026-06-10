import type { AttestVisitRow, VisitMode } from '@dialyrounds/shared';
import { VISIT_MODE_LABELS } from '@dialyrounds/shared';
import { StatusChip } from './StatusChip';

function noteLabel(type: AttestVisitRow['noteType']): string {
  return type === 'comprehensive' ? 'Comprehensive' : 'Basic';
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

export function AttestVisitCard({
  visit,
  sessionVisitMode,
  busy,
  onSign,
}: {
  visit: AttestVisitRow;
  sessionVisitMode: VisitMode | null;
  busy: boolean;
  onSign: (visitId: number) => void;
}) {
  const displayMode = visit.attestedAt ? visit.visitMode : sessionVisitMode;
  const canSign = Boolean(sessionVisitMode);

  return (
    <article
      className={`attest-visit-card${visit.attestedAt ? ' attest-visit-card--signed' : ' attest-visit-card--pending'}`}
    >
      <div className="attest-visit-card-header">
        <div>
          <h4 className="attest-visit-card-name">
            {visit.lastName}, {visit.firstName}
          </h4>
          <p className="meta">
            Note by {visit.authorName}
            {visit.attestedAt && visit.attestedByName ? ` · Signed by ${visit.attestedByName}` : ''}
          </p>
        </div>
        {visit.attestedAt ? (
          <StatusChip variant="success" label="Completed" />
        ) : (
          <StatusChip variant="pending" label="Pending sign-off" />
        )}
      </div>

      <div className="attest-visit-chips">
        <StatusChip variant="neutral" label={noteLabel(visit.noteType)} />
        <StatusChip variant="neutral" label={`CIPA: ${yesNo(visit.cipa)}`} />
        <StatusChip variant="neutral" label={`Seen on HD: ${yesNo(visit.seenOnHd)}`} />
        {displayMode && <StatusChip variant="neutral" label={VISIT_MODE_LABELS[displayMode]} />}
      </div>

      {visit.noteType === 'comprehensive' && visit.assessment.trim() && (
        <div className="attest-visit-notes-block">
          <strong className="attest-visit-notes-label">Assessment</strong>
          <p className="attest-visit-notes-text">{visit.assessment}</p>
        </div>
      )}

      <div className="attest-visit-notes-block">
        <strong className="attest-visit-notes-label">Notes</strong>
        <p className="attest-visit-notes-text">
          {visit.notes.trim() || <span className="meta">No notes entered</span>}
        </p>
      </div>

      <div className="attest-visit-card-actions">
        {!visit.attestedAt ? (
          <button
            type="button"
            className="btn btn-primary attest-sign-btn"
            disabled={busy || !canSign}
            title={!canSign ? 'Select telemed or in person for this shift first' : undefined}
            onClick={() => onSign(visit.visitId)}
          >
            Note signed
          </button>
        ) : (
          <div className="attest-sign-btn-spacer" aria-hidden="true" />
        )}
      </div>
    </article>
  );
}
