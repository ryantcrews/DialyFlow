import type { NoteType, PatientWithProgress, Unit } from '@dialyrounds/shared';
import {
  MONTHLY_NOTE_TARGET,
  SHIFTS,
  WEEKLY_NOTE_TARGET,
  currentMonthInClinic,
} from '@dialyrounds/shared';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError, downloadCsv } from '../api/client';
import { PatientListSkeleton } from '../components/Skeleton';
import { mutate, useFetch } from '../hooks/useApi';
import { useRouter } from '../hooks/useRouter';
import { useToast } from '../hooks/useToast';
import { unitAccentColor } from '../utils/unitColor';

function patientQuery(unitId: string, shift: string, status: string, month: string): string {
  return `/api/patients?unit=${unitId}&shift=${encodeURIComponent(shift)}&status=${status}&month=${month}`;
}

function isNotesComplete(p: PatientWithProgress): boolean {
  return p.comprehensiveCount >= MONTHLY_NOTE_TARGET && p.basicCount >= WEEKLY_NOTE_TARGET;
}

function computeAge(dob: string): number | null {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function stickyPreview(note: string, max = 48): string | null {
  const trimmed = note.trim();
  if (!trimmed) return null;
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
}

function formatLastVisit(date: string | null): string {
  if (!date) return 'No visits this month';
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return `Last visit ${date}`;
  return `Last visit ${parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function lastNoteLabel(type: NoteType | null): string | null {
  if (!type) return null;
  return type === 'comprehensive' ? 'Last: Comprehensive' : 'Last: Basic';
}

function listUrlFromFilters(unitId: string, shift: string, status: string, month: string, msg?: string): string {
  const params = new URLSearchParams();
  if (unitId) params.set('unit', unitId);
  params.set('shift', shift);
  params.set('status', status);
  params.set('month', month);
  if (msg) params.set('msg', msg);
  return `/?${params.toString()}`;
}

export function MainPage() {
  const { navigate, searchParams, pathname, path } = useRouter();
  const { showToast } = useToast();
  const { data: unitsData } = useFetch<{ units: Unit[] }>('/api/units');

  const unitId = searchParams.get('unit') ?? '';
  const shiftParam = searchParams.get('shift');
  const shift =
    shiftParam && SHIFTS.includes(shiftParam as (typeof SHIFTS)[number]) ? shiftParam : SHIFTS[0];
  const status = searchParams.get('status') ?? 'active';
  const monthParam = searchParams.get('month');
  const month =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonthInClinic();
  const listMessage = searchParams.get('msg');

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);

  const query = path.includes('?') ? path.split('?')[1] : '';

  useEffect(() => {
    if (pathname !== '/') return;
    if (query) return;
    navigate(listUrlFromFilters('', SHIFTS[0], 'active', currentMonthInClinic()), { replace: true });
  }, [pathname, query, navigate]);

  function updateFilters(
    next: Partial<{ unitId: string; shift: string; status: string; month: string }>
  ) {
    navigate(
      listUrlFromFilters(
        next.unitId ?? unitId,
        next.shift ?? shift,
        next.status ?? status,
        next.month ?? month
      ),
      { replace: true }
    );
  }

  const patientsPath = unitId && shift ? patientQuery(unitId, shift, status, month) : null;
  const { data, loading, reload } = useFetch<{ patients: PatientWithProgress[] }>(patientsPath);

  const patients = useMemo(() => {
    const list = data?.patients ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter(
          (p) =>
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            p.dob.includes(q)
        )
      : list;
    return [...filtered].sort((a, b) => {
      const aComplete = isNotesComplete(a);
      const bComplete = isNotesComplete(b);
      if (aComplete !== bComplete) return aComplete ? 1 : -1;
      return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
    });
  }, [data, search]);

  const completeCount = patients.filter(isNotesComplete).length;
  const needsCompCount = patients.filter((p) => p.comprehensiveCount < MONTHLY_NOTE_TARGET).length;
  const remainingCount = patients.length - completeCount;
  const unitColor = unitId ? unitAccentColor(Number(unitId)) : undefined;

  function openPatient(patientId: number, rounds = false) {
    const params = new URLSearchParams({
      month,
      unit: unitId,
      shift,
    });
    if (rounds) params.set('rounds', '1');
    navigate(`/patients/${patientId}?${params.toString()}`);
  }

  const handlePatientKeyDown = (patientId: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPatient(patientId);
    }
  };

  function startRounds() {
    const first = patients.find((p) => !isNotesComplete(p)) ?? patients[0];
    if (first) openPatient(first.id, true);
  }

  async function addPatient(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutate('/api/patients', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          dob,
          unitId: Number(unitId),
          shift,
        }),
      });
      setShowAdd(false);
      setFirstName('');
      setLastName('');
      setDob('');
      showToast('Patient added');
      await reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not add patient');
    }
  }

  async function exportPatients() {
    if (!unitId) return;
    await downloadCsv(
      `/api/export?unit=${unitId}&shift=${encodeURIComponent(shift)}&month=${month}`,
      `patients-${month}.csv`
    );
    showToast('Export started', 'info');
  }

  return (
    <div className="stack">
      <div className="card stack">
        {listMessage && <p className="banner badge-success">{listMessage}</p>}
        <div className="row">
          <div className="field">
            <label htmlFor="unit">Dialysis unit</label>
            <select id="unit" value={unitId} onChange={(e) => updateFilters({ unitId: e.target.value })}>
              <option value="">Select unit</option>
              {(unitsData?.units ?? []).map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="shift">Shift</label>
            <select id="shift" value={shift} onChange={(e) => updateFilters({ shift: e.target.value })}>
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(e) => updateFilters({ status: e.target.value })}>
              <option value="active">Active</option>
              <option value="hospitalized">Hospitalized</option>
              <option value="discharged">Discharged</option>
              <option value="transferred">Transferred</option>
              <option value="deceased">Deceased</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="month">Month</label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(e) => updateFilters({ month: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients"
          />
        </div>
        <div className="row">
          <button
            className="btn btn-primary"
            type="button"
            disabled={!unitId}
            onClick={() => setShowAdd((v) => !v)}
          >
            Add patient
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!unitId || patients.length === 0}
            onClick={startRounds}
          >
            Start rounds
          </button>
          <button
            className="btn"
            type="button"
            disabled={!unitId}
            onClick={() => void exportPatients()}
          >
            Export CSV
          </button>
        </div>
        {showAdd && (
          <form className="stack" onSubmit={addPatient}>
            <div className="row">
              <div className="field">
                <label>First name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Last name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div className="field">
                <label>DOB</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
              </div>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary" type="submit">
              Save patient
            </button>
          </form>
        )}
      </div>

      <div className="card">
        {!unitId ? (
          <div className="empty-state">
            <p className="empty-state-title">Choose a unit to begin</p>
            <p className="empty-state-hint meta">
              Select a dialysis unit above to load patients for {month}.
            </p>
          </div>
        ) : loading ? (
          <PatientListSkeleton />
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No patients found</p>
            <p className="empty-state-hint meta">
              Try a different shift or status filter, or add a patient to this unit.
            </p>
          </div>
        ) : (
          <>
            <p className="progress-summary">
              {completeCount} of {patients.length} complete
              {needsCompCount > 0 ? ` · ${needsCompCount} need Comp` : ''}
              {remainingCount > 0 && needsCompCount < remainingCount
                ? ` · ${remainingCount - needsCompCount} need Basic only`
                : ''}
            </p>
            <p className="meta list-header-meta">
              {month} · {shift} · sorted incomplete first
            </p>
            <ul className="patient-list">
              {patients.map((patient) => {
                const age = computeAge(patient.dob);
                const preview = stickyPreview(patient.stickyNote);
                const complete = isNotesComplete(patient);
                const lastNote = lastNoteLabel(patient.lastNoteType);
                return (
                  <li
                    key={patient.id}
                    className="patient-item patient-item--rich"
                    role="button"
                    tabIndex={0}
                    onClick={() => openPatient(patient.id)}
                    onKeyDown={handlePatientKeyDown(patient.id)}
                  >
                    <div
                      className={`patient-item-accent${complete ? ' patient-item-accent--complete' : ''}`}
                      style={!complete && unitColor ? { background: unitColor } : undefined}
                      aria-hidden="true"
                    />
                    <div className="patient-item-main">
                      <div className="patient-item-top">
                        <div className="patient-name">
                          {patient.lastName}, {patient.firstName}
                        </div>
                        {complete && <span className="badge badge-success">Complete</span>}
                        {!complete && patient.comprehensiveCount < MONTHLY_NOTE_TARGET && (
                          <span className="badge badge-warning">Needs Comp</span>
                        )}
                        {patient.unattestedVisitCount > 0 && (
                          <span className="badge badge-warning">
                            {patient.unattestedVisitCount} sign-off
                          </span>
                        )}
                        {patient.status !== 'active' && (
                          <span className="badge">{patient.status}</span>
                        )}
                      </div>
                      <div className="meta">
                        DOB {patient.dob}
                        {age != null ? ` (${age})` : ''} · {patient.shift}
                      </div>
                      <div className="meta">
                        {formatLastVisit(patient.lastVisitDate)}
                        {lastNote ? ` · ${lastNote}` : ''}
                      </div>
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
                        {patient.visitLoggedCount > 0 && (
                          <span className="note-badge">{patient.visitLoggedCount} logged</span>
                        )}
                      </div>
                      {preview && <div className="patient-sticky-preview meta">{preview}</div>}
                    </div>
                    <span className="patient-chevron" aria-hidden="true">
                      ›
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
