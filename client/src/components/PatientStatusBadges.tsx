import { MONTHLY_NOTE_TARGET, WEEKLY_NOTE_TARGET, type PatientStatus } from '@dialyrounds/shared';

export function PatientStatusBadges({
  complete,
  comprehensiveCount,
  basicCount,
  unattestedVisitCount = 0,
  status = 'active',
  weeklyTarget,
}: {
  complete: boolean;
  comprehensiveCount: number;
  basicCount: number;
  unattestedVisitCount?: number;
  status?: PatientStatus | string;
  weeklyTarget?: number;
}) {
  const basicTarget = weeklyTarget ?? WEEKLY_NOTE_TARGET;
  const needsComp = comprehensiveCount < MONTHLY_NOTE_TARGET;
  const needsBasic = basicCount < basicTarget;

  return (
    <div className="patient-status-badges">
      {complete ? (
        <span className="badge badge-success">Complete</span>
      ) : (
        <>
          {needsComp && <span className="badge badge-warning">Needs Comp</span>}
          {!needsComp && needsBasic && <span className="badge badge-warning">Needs Basic</span>}
        </>
      )}
      {unattestedVisitCount > 0 && (
        <span className="badge badge-pending">
          {unattestedVisitCount} sign-off{unattestedVisitCount === 1 ? '' : 's'}
        </span>
      )}
      {status !== 'active' && <span className="badge">{status}</span>}
    </div>
  );
}
