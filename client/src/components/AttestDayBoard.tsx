import type { AttestDayBoard, AttestShiftBucket, VisitMode } from '@dialyrounds/shared';
import { VISIT_MODES, VISIT_MODE_LABELS } from '@dialyrounds/shared';
import { AttestVisitCard } from './AttestVisitCard';
import { StatusChip } from './StatusChip';

export function AttestDayBoard({
  board,
  busy,
  filteredEmpty,
  onVisitModeChange,
  onSignVisit,
  onSignAllInShift,
}: {
  board: AttestDayBoard;
  busy: boolean;
  filteredEmpty?: boolean;
  onVisitModeChange: (bucket: AttestShiftBucket, mode: VisitMode) => void;
  onSignVisit: (visitId: number) => void;
  onSignAllInShift: (bucket: AttestShiftBucket) => void;
}) {
  if (board.units.length === 0) {
    return (
      <div className="empty-state card">
        <p className="empty-state-title">
          {filteredEmpty ? 'No matching visits' : 'No visits for this day'}
        </p>
        <p className="empty-state-hint meta">
          {filteredEmpty
            ? 'Try clearing the location or shift filter, or choose another date.'
            : 'No notes were logged on this date. Choose another day or check back after rounds.'}
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
              const visitModeLocked =
                bucket.visits.length === 1 && bucket.pendingCount === 0;
              const displayVisitMode =
                visitModeLocked && bucket.visits[0]?.visitMode
                  ? bucket.visits[0].visitMode
                  : bucket.visitMode;
              return (
                <div key={`${bucket.unitId}-${bucket.shift}`} className="attest-shift-bucket">
                  <header className="attest-shift-bucket-header">
                    <div className="attest-shift-bucket-title-row">
                      <h4 className="attest-shift-bucket-title">{bucket.shift}</h4>
                      <div className="context-summary">
                        {bucket.pendingCount > 0 && (
                          <StatusChip variant="pending" label={`${bucket.pendingCount} pending`} />
                        )}
                        {bucket.totalCount - bucket.pendingCount > 0 && (
                          <StatusChip
                            variant="success"
                            label={`${bucket.totalCount - bucket.pendingCount} completed`}
                          />
                        )}
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
                            aria-selected={displayVisitMode === mode}
                            className={`visit-mode-tab${displayVisitMode === mode ? ' visit-mode-tab--active' : ''}`}
                            disabled={busy || visitModeLocked}
                            title={
                              visitModeLocked
                                ? 'Visit type is locked after sign-off'
                                : undefined
                            }
                            onClick={() => onVisitModeChange(bucket, mode)}
                          >
                            {VISIT_MODE_LABELS[mode]}
                          </button>
                        ))}
                      </div>
                      <p className="meta attest-mode-hint">
                        {!displayVisitMode && !visitModeLocked
                          ? 'Select telemed or in person for this shift.'
                          : '\u00a0'}
                      </p>
                      <div className="attest-shift-sign-all-slot">
                        {pending.length > 1 ? (
                          <button
                            type="button"
                            className="btn btn-primary attest-shift-sign-all"
                            disabled={busy || !bucket.visitMode}
                            title={
                              !bucket.visitMode
                                ? 'Select telemed or in person for this shift first'
                                : undefined
                            }
                            onClick={() => onSignAllInShift(bucket)}
                          >
                            Sign all in {bucket.shift} ({pending.length})
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </header>

                  <ul className="attest-shift-visits">
                    {bucket.visits.map((visit) => (
                      <li key={visit.visitId}>
                        <AttestVisitCard
                          visit={visit}
                          sessionVisitMode={bucket.visitMode}
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
