import type { PatientWithProgress, Unit } from '@dialyrounds/shared';
import {
  MONTHLY_NOTE_TARGET,
  SHIFTS,
  WEEKLY_NOTE_TARGET,
  currentMonthInClinic,
} from '@dialyrounds/shared';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError, api } from '../api/client';
import { mutate, useFetch } from '../hooks/useApi';
import { useRouter } from '../hooks/useRouter';

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

export function MainPage() {
  const { navigate, searchParams } = useRouter();
  const { data: unitsData } = useFetch<{ units: Unit[] }>('/api/units');
  const [month] = useState(currentMonthInClinic());
  const [unitId, setUnitId] = useState('');
  const [shift, setShift] = useState<string>(SHIFTS[0]);
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);

  useEffect(() => {
    const unit = searchParams.get('unit');
    const shiftParam = searchParams.get('shift');
    const statusParam = searchParams.get('status');
    const msg = searchParams.get('msg');
    if (unit) setUnitId(unit);
    if (shiftParam && SHIFTS.includes(shiftParam as (typeof SHIFTS)[number])) {
      setShift(shiftParam);
    }
    if (statusParam) setStatus(statusParam);
    if (msg) setListMessage(msg);
  }, [searchParams]);

  const patientsPath = unitId && shift ? patientQuery(unitId, shift, status, month) : null;
  const { data, loading, reload } = useFetch<{ patients: PatientWithProgress[] }>(patientsPath);

  const patients = useMemo(() => {
    const list = data?.patients ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.dob.includes(q)
    );
  }, [data, search]);

  const completeCount = patients.filter(isNotesComplete).length;

  function openPatient(patientId: number) {
    navigate(
      `/patients/${patientId}?month=${month}&unit=${unitId}&shift=${encodeURIComponent(shift)}`
    );
  }

  function startRounds() {
    const first = patients.find((p) => !isNotesComplete(p)) ?? patients[0];
    if (first) openPatient(first.id);
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
      await reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not add patient');
    }
  }

  return (
    <div className="stack">
      <div className="card stack">
        <h2 style={{ margin: 0 }}>Patients</h2>
        {listMessage && <p className="banner badge-success">{listMessage}</p>}
        <div className="row">
          <div className="field">
            <label htmlFor="unit">Dialysis unit</label>
            <select id="unit" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
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
            <select id="shift" value={shift} onChange={(e) => setShift(e.target.value)}>
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="hospitalized">Hospitalized</option>
              <option value="discharged">Discharged</option>
              <option value="transferred">Transferred</option>
              <option value="deceased">Deceased</option>
              <option value="all">All</option>
            </select>
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
          <p className="meta">Select a unit to view patients.</p>
        ) : loading ? (
          <p className="meta">Loading patients…</p>
        ) : patients.length === 0 ? (
          <p className="meta">No patients found for this unit and shift.</p>
        ) : (
          <>
            <p className="meta list-header-meta">
              {shift} · {patients.length} patients · {completeCount} complete
            </p>
            <ul className="patient-list">
              {patients.map((patient) => {
                const age = computeAge(patient.dob);
                const preview = stickyPreview(patient.stickyNote);
                return (
                  <li
                    key={patient.id}
                    className="patient-item patient-item--rich"
                    onClick={() => openPatient(patient.id)}
                  >
                    <div className="patient-item-accent" aria-hidden="true" />
                    <div className="patient-item-main">
                      <div className="patient-item-top">
                        <div className="patient-name">
                          {patient.lastName}, {patient.firstName}
                        </div>
                        {patient.status !== 'active' && (
                          <span className="badge">{patient.status}</span>
                        )}
                      </div>
                      <div className="meta">
                        DOB {patient.dob}
                        {age != null ? ` (${age})` : ''} · {patient.shift}
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
