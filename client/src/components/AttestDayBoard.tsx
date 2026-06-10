import type { AttestDayBoard, AttestShiftBucket, VisitMode } from '@dialyrounds/shared';
import { VISIT_MODES, VISIT_MODE_LABELS } from '@dialyrounds/shared';
import { AttestVisitCard } from './AttestVisitCard';
import { StatusChip } from './StatusChip';

export function AttestDayBoard({
  board,
  busy,
  onVisitModeChange,
  onSignVisit,
  onSignAllInShift,
}: {
  board: AttestDayBoard;
  busy: boolean;
  onVisitModeChange: (bucket: AttestShiftBucket, mode: VisitMode) => void;
  onSignVisit: (visitId: number) => void;
  onSignAllInShift: (bucket: AttestShiftBucket) => void;
}) {
  if (board.units.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">All caught up for this day</p>
        <p className="empty-state-hint meta">
          No shift buckets need sign-off on this date. Use the date picker to review prior days.
        </p>
      </div>
    );
  }

  return (
    <div className="attest-day-board">
      {board.units.map((unit) => (
        <section key={unit.unitId} className="attest-location-bucket card">
          <header className="attest-location-header">
            <h3 className="attest-location-title">{unit.unitName}</h3>
            <span className="meta">
              {unit.shifts.length} shift{unit.shifts.length === 1 ? '' : 's'}
            </span>
          </header>

          <div className="attest-shift-buckets">
            {unit.shifts.map((bucket) => {
              const pending = bucket.visits.filter((v) => !v.attestedAt);
              return (
                <div
                  key={`${bucket.unitId}-${bucket.shift}`}
                  className="attest-shift-bucket"
                >
                  <header className="attest-shift-bucket-header">
                    <div className="attest-shift-bucket-title-row">
                      <h4 className="attest-shift-bucket-title">{bucket.shift}</h4>
                      <div className="context-summary">
                        <StatusChip variant="pending" label={`${bucket.pendingCount} pending`} />
                        <StatusChip variant="neutral" label={`${bucket.totalCount} seen`} />
                      </div>
                    </div>

                    <div className="attest-shift-bucket-controls">
                      <span className="context-bar-filter-label">Visit type</span>
                      <div className="visit-mode-tabs" role="tablist" aria-label="Visit type">
                        {VISIT_MODES.map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            role="tab"
                            aria-selected={bucket.visitMode === mode}
                            className={`visit-mode-tab${bucket.visitMode === mode ? ' visit-mode-tab--active' : ''}`}
                            disabled={busy}
                            onClick={() => onVisitModeChange(bucket, mode)}
                          >
                            {VISIT_MODE_LABELS[mode]}
                          </button>
                        ))}
                      </div>
                      {!bucket.visitMode && (
                        <p className="meta attest-mode-hint">
                          Select telemed or in person for this shift.
                        </p>
                      )}
                      {pending.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-primary attest-shift-sign-all"
                          disabled={busy}
                          onClick={() => onSignAllInShift(bucket)}
                        >
                          Sign all in {bucket.shift} ({pending.length})
                        </button>
                      )}
                    </div>
                  </header>

                  <ul className="attest-shift-visits">
                    {bucket.visits.map((visit) => (
                      <li key={visit.visitId}>
                        <AttestVisitCard
                          visit={visit}
                          visitMode={bucket.visitMode}
                          busy={busy}
                          onSign={onSignVisit}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
