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
  visitMode,
  busy,
  onSign,
}: {
  visit: AttestVisitRow;
  visitMode: VisitMode | null;
  busy: boolean;
  onSign: (visitId: number) => void;
}) {
  return (
    <article
      className={`attest-visit-card${visit.attestedAt ? ' attest-visit-card--signed' : ' attest-visit-card--pending'}`}
    >
      <div className="attest-visit-card-header">
        <div>
          <h4 className="attest-visit-card-name">
            {visit.lastName}, {visit.firstName}
          </h4>
          <p className="meta">Note by {visit.authorName}</p>
        </div>
        {visit.attestedAt ? (
          <StatusChip
            variant="success"
            label={`Completed · ${visit.attestedByName ?? 'unknown'}`}
          />
        ) : (
          <StatusChip variant="pending" label="Pending sign-off" />
        )}
      </div>

      <div className="attest-visit-chips">
        <StatusChip variant="neutral" label={noteLabel(visit.noteType)} />
        <StatusChip variant="neutral" label={`CIPA: ${yesNo(visit.cipa)}`} />
        <StatusChip variant="neutral" label={`Seen on HD: ${yesNo(visit.seenOnHd)}`} />
        {visitMode && <StatusChip variant="neutral" label={VISIT_MODE_LABELS[visitMode]} />}
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

      {!visit.attestedAt && (
        <button
          type="button"
          className="btn btn-primary attest-sign-btn"
          disabled={busy}
          onClick={() => onSign(visit.visitId)}
        >
          Note signed
        </button>
      )}
    </article>
  );
}
