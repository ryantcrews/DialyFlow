import { MONTHLY_NOTE_TARGET, WEEKLY_NOTE_TARGET } from '@dialyrounds/shared';
import { PatientStatusBadges } from '../PatientStatusBadges';
import type { PreviewPatient } from './previewData';

function PatientRow({ patient }: { patient: PreviewPatient }) {
  const complete =
    patient.complete ??
    (patient.comprehensiveCount >= MONTHLY_NOTE_TARGET &&
      patient.basicCount >= WEEKLY_NOTE_TARGET);

  return (
    <li className="patient-item patient-item--rich app-preview-patient-row" aria-hidden="true">
      <div
        className={`patient-item-accent${complete ? ' patient-item-accent--complete' : ''}`}
        style={!complete && patient.accentColor ? { background: patient.accentColor } : undefined}
      />
      <div className="patient-item-main">
        <div className="patient-item-top">
          <div className="patient-name">
            {patient.lastName}, {patient.firstName}
          </div>
          <PatientStatusBadges
            complete={complete}
            comprehensiveCount={patient.comprehensiveCount}
            basicCount={patient.basicCount}
            unattestedVisitCount={patient.unattestedCount ?? 0}
          />
        </div>
        <div className="meta">
          DOB {patient.dob} · {patient.shift}
        </div>
        {patient.lastVisit && <div className="meta">Last visit {patient.lastVisit}</div>}
        <div className="note-badges">
          <span
            className={`note-badge${patient.comprehensiveCount >= MONTHLY_NOTE_TARGET ? ' note-badge--done' : ''}`}
          >
            {patient.comprehensiveCount}/{MONTHLY_NOTE_TARGET} Comp
          </span>
          <span
            className={`note-badge${patient.basicCount >= WEEKLY_NOTE_TARGET ? ' note-badge--done' : ''}`}
          >
            {patient.basicCount}/{WEEKLY_NOTE_TARGET} Basic
          </span>
        </div>
      </div>
      <span className="patient-chevron" aria-hidden="true">
        ›
      </span>
    </li>
  );
}

export function AppPreviewPatientList({
  patients,
  month = '2026-06',
  shift = 'MWF AM',
  unitName = 'North Dialysis Center',
  showSummary = true,
  compact = false,
}: {
  patients: PreviewPatient[];
  month?: string;
  shift?: string;
  unitName?: string;
  showSummary?: boolean;
  compact?: boolean;
}) {
  const completeCount = patients.filter(
    (p) =>
      p.comprehensiveCount >= MONTHLY_NOTE_TARGET && p.basicCount >= WEEKLY_NOTE_TARGET
  ).length;
  const needsComp = patients.filter((p) => p.comprehensiveCount < MONTHLY_NOTE_TARGET).length;

  return (
    <div className={`app-preview-panel${compact ? ' app-preview-panel--compact' : ''}`} aria-hidden="true">
      <div className="app-preview-toolbar">
        <span className="app-preview-toolbar-title">Patient list</span>
        <span className="meta">Jun 2026</span>
      </div>
      <div className="app-preview-filters meta">
        <span className="app-preview-filter">{unitName}</span>
        <span className="app-preview-filter">{shift}</span>
        {!compact && <span className="app-preview-filter">Active</span>}
      </div>
      {showSummary && (
        <p className="progress-summary app-preview-summary">
          {completeCount} of {patients.length} complete
          {needsComp > 0 ? ` · ${needsComp} need Comp` : ''}
        </p>
      )}
      <ul className="patient-list app-preview-patient-list">
        {patients.map((patient) => (
          <PatientRow key={`${patient.lastName}-${patient.firstName}`} patient={patient} />
        ))}
      </ul>
    </div>
  );
}
