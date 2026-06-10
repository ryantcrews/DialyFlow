import {

  NOTE_TYPES,

  PATIENT_STATUSES,

  SHIFTS,

  MONTHLY_NOTE_TARGET,

  WEEKLY_NOTE_TARGET,

  VISIT_MODE_LABELS,

  dateFromMonthParam,
  monthFromDate,
  todayInClinic,

  isClinicalRole,

  type NoteType,

  type Patient,

  type PatientSummary,

  type PatientWithProgress,

  type Unit,

  type Visit,

} from '@dialyrounds/shared';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiClientError } from '../api/client';

import { Skeleton } from '../components/Skeleton';

import { FixedActionBar } from '../components/FixedActionBar';

import { StatusChip } from '../components/StatusChip';

import { mutate, useFetch } from '../hooks/useApi';

import { useAuth } from '../hooks/useAuth';

import { useRouter } from '../hooks/useRouter';

import { useSwipeNav } from '../hooks/useSwipeNav';

import { useToast } from '../hooks/useToast';
import { patientsListUrl } from '../utils/routes';



const ROUNDS_MODE_KEY = 'dialyrounds-rounds-mode';



function computeAge(dob: string): number | null {

  const birth = new Date(dob);

  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;

  return age;

}



function todayIsoDate(): string {

  return new Date().toISOString().slice(0, 10);

}



export function PatientPage() {

  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const { pathname, searchParams, navigate } = useRouter();

  const { showToast } = useToast();

  const idMatch = pathname.match(/\/patients\/(\d+)/);

  const id = idMatch?.[1] ?? '';

  const unitId = searchParams.get('unit') ?? '';

  const shift = searchParams.get('shift') ?? '';

  const monthParam = searchParams.get('month');
  const dateParam = searchParams.get('date');
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : monthParam && /^\d{4}-\d{2}$/.test(monthParam)
        ? dateFromMonthParam(monthParam, shift || SHIFTS[0])
        : todayInClinic();
  const month = monthFromDate(date);

  const startRoundsParam = searchParams.get('rounds') === '1';



  const [roundsMode, setRoundsMode] = useState(

    () => localStorage.getItem(ROUNDS_MODE_KEY) === '1'

  );



  const { data: patientData, reload: reloadPatient } = useFetch<{ patient: Patient }>(

    id ? `/api/patients/${id}` : null

  );

  const { data: summaryData, reload: reloadSummary } = useFetch<{ summary: PatientSummary }>(

    id ? `/api/patients/${id}/summary?date=${date}` : null

  );

  const { data: visitsData, reload: reloadVisits } = useFetch<{ visits: Visit[] }>(

    id ? `/api/patients/${id}/visits?month=${month}` : null

  );

  const { data: unitsData } = useFetch<{ units: Unit[] }>('/api/units');



  const cohortPath =

    unitId && shift

      ? `/api/patients?unit=${unitId}&shift=${encodeURIComponent(shift)}&status=active&date=${date}`

      : null;

  const { data: cohortData } = useFetch<{ patients: PatientWithProgress[] }>(cohortPath);



  const patient = patientData?.patient;

  const summary = summaryData?.summary;

  const visits = visitsData?.visits ?? [];

  const cohort = cohortData?.patients ?? [];

  const cohortIndex = cohort.findIndex((p) => String(p.id) === id);



  const [stickyNote, setStickyNote] = useState('');

  const [status, setStatus] = useState<string>('active');

  const [reassignUnit, setReassignUnit] = useState('');

  const [reassignShift, setReassignShift] = useState<string>(SHIFTS[0]);

  const [visitDate, setVisitDate] = useState(todayInClinic());

  useEffect(() => {
    setVisitDate(date);
  }, [date]);

  const [noteType, setNoteType] = useState<NoteType>('basic');

  const [seenOnHd, setSeenOnHd] = useState(false);

  const [cipa, setCipa] = useState(false);

  const [notes, setNotes] = useState('');

  const [assessment, setAssessment] = useState('');

  const [error, setError] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const [showMore, setShowMore] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(() => localStorage.getItem(ROUNDS_MODE_KEY) !== '1');

  const [stickyMessage, setStickyMessage] = useState<string | null>(null);

  const [saveFlash, setSaveFlash] = useState(false);



  const defaultNoteType = useMemo((): NoteType => {

    if (!summary) return 'basic';

    return summary.comprehensiveCount < MONTHLY_NOTE_TARGET ? 'comprehensive' : 'basic';

  }, [summary]);



  useEffect(() => {

    localStorage.setItem(ROUNDS_MODE_KEY, roundsMode ? '1' : '0');

    if (roundsMode) setHistoryOpen(false);

  }, [roundsMode]);



  useEffect(() => {

    if (startRoundsParam && user && isClinicalRole(user.role)) {

      setRoundsMode(true);

    }

  }, [startRoundsParam, user]);



  useEffect(() => {

    if (!patient) return;

    setStickyNote(patient.stickyNote);

    setStatus(patient.status);

    setReassignUnit(String(patient.unitId));

    setReassignShift(patient.shift);

  }, [patient]);



  useEffect(() => {

    setNoteType(defaultNoteType);

    setVisitDate(todayIsoDate());

    setNotes('');

    setAssessment('');

    setError(null);

    setHistoryOpen(!roundsMode);

  }, [defaultNoteType, id, roundsMode]);



  const visitMonth = visitDate.slice(0, 7);

  const monthlyComprehensiveBlocked =

    visitMonth === month && (summary?.comprehensiveCount ?? 0) >= MONTHLY_NOTE_TARGET;



  useEffect(() => {

    if (monthlyComprehensiveBlocked && noteType === 'comprehensive') {

      setNoteType('basic');

    }

  }, [monthlyComprehensiveBlocked, noteType]);



  function patientUrl(patientId: number): string {

    const params = new URLSearchParams({ date });

    if (unitId) params.set('unit', unitId);

    if (shift) params.set('shift', shift);

    return `/patients/${patientId}?${params.toString()}`;

  }



  function attestUrlForVisit(visitDate: string): string {
    return `/attest?date=${visitDate}`;
  }



  function listUrl(msg?: string): string {
    return patientsListUrl({
      unitId: unitId || undefined,
      shift: shift ?? SHIFTS[0],
      status: 'active',
      date,
      msg,
    });
  }



  const goToPatient = useCallback(

    (patientId: number) => {

      navigate(patientUrl(patientId));

    },

    [navigate, date, unitId, shift]

  );



  const goPrev = useCallback(() => {

    if (cohortIndex > 0) goToPatient(cohort[cohortIndex - 1].id);

  }, [cohort, cohortIndex, goToPatient]);



  const goNext = useCallback(() => {

    if (cohortIndex >= 0 && cohortIndex < cohort.length - 1) {

      goToPatient(cohort[cohortIndex + 1].id);

    }

  }, [cohort, cohortIndex, goToPatient]);



  useSwipeNav(goPrev, goNext, cohortIndex >= 0);



  async function saveProfile() {

    if (!patient) return;

    setStickyMessage(null);

    try {

      await mutate(`/api/patients/${patient.id}`, {

        method: 'PATCH',

        body: JSON.stringify({ stickyNote }),

      });

      await reloadPatient();

      showToast('Sticky note saved');

      setStickyMessage('Sticky note saved.');

    } catch (err) {

      setStickyMessage(null);

      setError(err instanceof ApiClientError ? err.message : 'Could not save sticky note');

    }

  }



  async function saveStatus() {

    if (!patient) return;

    setActionError(null);

    setActionMessage(null);

    try {

      await mutate(`/api/patients/${patient.id}/status`, {

        method: 'PATCH',

        body: JSON.stringify({ status }),

      });

      if (status !== 'active') {

        navigate(listUrl('Status updated — patient removed from active list'));

        return;

      }

      await reloadPatient();

      showToast('Status updated');

      setActionMessage('Status updated.');

    } catch (err) {

      setActionError(err instanceof ApiClientError ? err.message : 'Could not update status');

    }

  }



  async function saveAssignment() {

    if (!patient) return;

    setActionError(null);

    setActionMessage(null);

    try {

      await mutate(`/api/patients/${patient.id}/assignment`, {

        method: 'PATCH',

        body: JSON.stringify({

          unitId: Number(reassignUnit),

          shift: reassignShift,

        }),

      });

      navigate(
        patientsListUrl({
          unitId: reassignUnit,
          shift: reassignShift,
          status: 'active',
          date,
          msg: 'Patient reassigned',
        })
      );

    } catch (err) {

      setActionError(err instanceof ApiClientError ? err.message : 'Could not reassign');

    }

  }



  async function removePatient() {

    if (!patient || !window.confirm('Remove this patient from the active list?')) return;

    await mutate(`/api/patients/${patient.id}`, { method: 'DELETE' });

    navigate(listUrl());

  }



  function flashSaveSuccess(message: string) {

    setSaveFlash(true);

    showToast(message);

    window.setTimeout(() => setSaveFlash(false), 650);

  }



  async function submitVisit(andNext: boolean) {

    if (!patient) return;

    setError(null);

    try {

      await mutate('/api/visits', {

        method: 'POST',

        body: JSON.stringify({

          patientId: patient.id,

          visitDate,

          noteType,

          seenOnHd,

          cipa,

          notes,

          assessment: noteType === 'comprehensive' ? assessment : '',

        }),

      });

      setNotes('');

      setAssessment('');

      await Promise.all([reloadVisits(), reloadSummary()]);

      setNoteType(defaultNoteType);

      flashSaveSuccess(andNext ? 'Note saved — next patient' : 'Note saved');



      if (andNext && cohortIndex >= 0 && cohortIndex < cohort.length - 1) {

        goToPatient(cohort[cohortIndex + 1].id);

      }

    } catch (err) {

      setError(err instanceof ApiClientError ? err.message : 'Could not log visit');

    }

  }



  async function logVisit(e: React.FormEvent) {

    e.preventDefault();

    await submitVisit(false);

  }



  if (!patient) {

    return (

      <div className="card stack">

        <Skeleton lines={4} />

      </div>

    );

  }



  const notesComplete =
    (summary?.comprehensiveCount ?? 0) >= MONTHLY_NOTE_TARGET &&
    (summary?.basicCount ?? 0) >= (summary?.weeklyTarget ?? WEEKLY_NOTE_TARGET);



  const age = computeAge(patient.dob);

  const stickyPreview = patient.stickyNote.trim();

  const needsComprehensive = (summary?.comprehensiveCount ?? 0) < MONTHLY_NOTE_TARGET;



  return (

    <div className="stack">

      <div className="row">

        <button className="btn" type="button" onClick={() => navigate(listUrl())}>

          Back to list

        </button>

        {cohortIndex >= 0 && (

          <>

            <button className="btn" type="button" disabled={cohortIndex <= 0} onClick={goPrev}>

              Previous

            </button>

            <button className="btn" type="button" disabled={cohortIndex >= cohort.length - 1} onClick={goNext}>

              Next patient

            </button>

            <span className="meta">

              {cohortIndex + 1} of {cohort.length}

            </span>

          </>

        )}

      </div>



      <div className="rounds-mode-bar">

        <span>Rounds mode — focus on note entry</span>

        <label className="toggle-row toggle-row--large" style={{ margin: 0 }}>

          <span>{roundsMode ? 'On' : 'Off'}</span>

          <input

            type="checkbox"

            checked={roundsMode}

            onChange={(e) => setRoundsMode(e.target.checked)}

            aria-label="Toggle rounds mode"

          />

        </label>

      </div>



      <div className="card stack patient-header-card patient-sticky-header">

        <div>

          <h2 style={{ margin: 0 }}>

            {patient.lastName}, {patient.firstName}

          </h2>

          <p className="meta">

            DOB {patient.dob}

            {age != null ? ` · Age ${age}` : ''}

          </p>

        </div>



        <div className={`banner ${notesComplete ? 'badge-success' : 'banner-warning'}`}>

          <strong>{month}</strong> — Visits logged {summary?.visitLoggedCount ?? 0} · Comprehensive{' '}

          {summary?.comprehensiveCount ?? 0}/{MONTHLY_NOTE_TARGET} · Basic {summary?.basicCount ?? 0}/

          {summary?.weeklyTarget ?? WEEKLY_NOTE_TARGET}

        </div>



        {(summary?.pendingSignOffCount ?? 0) > 0 && (
          <div className="banner banner-warning patient-signoff-banner">
            <div>
              <strong>
                {summary!.pendingSignOffCount} visit
                {summary!.pendingSignOffCount === 1 ? '' : 's'} need sign-off
              </strong>
              <p className="meta" style={{ margin: '0.25rem 0 0' }}>
                Saved notes awaiting physician sign-off for {month}.
              </p>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate('/attest')}
            >
              Go to Batch Attest
            </button>
          </div>
        )}



        {stickyPreview ? (

          <button

            type="button"

            className="patient-sticky-callout patient-sticky-callout--btn meta"

            onClick={() => setShowMore(true)}

          >

            <strong>Sticky:</strong> {stickyPreview}

          </button>

        ) : null}

      </div>



      <div className={`card stack patient-primary-card${saveFlash ? ' save-flash' : ''}`}>

        <h3 style={{ margin: 0 }}>Save note</h3>

        <form id="save-note-form" className="stack" onSubmit={logVisit}>

          <div className="field">

            <label>Visit date</label>

            <div className="row" style={{ alignItems: 'flex-end' }}>

              <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />

              <button className="btn" type="button" onClick={() => setVisitDate(todayIsoDate())}>

                Today

              </button>

            </div>

          </div>

          <div className="field">

            <label>Note type</label>

            {needsComprehensive && !monthlyComprehensiveBlocked ? (

              <button

                type="button"

                className="note-suggestion"

                onClick={() => setNoteType('comprehensive')}

              >

                Suggested: Comprehensive (monthly)

              </button>

            ) : !needsComprehensive ? (

              <span className="note-suggestion note-suggestion--done">Monthly comprehensive done</span>

            ) : null}

            <select value={noteType} onChange={(e) => setNoteType(e.target.value as NoteType)}>

              {NOTE_TYPES.map((t) => (

                <option

                  key={t}

                  value={t}

                  disabled={t === 'comprehensive' && monthlyComprehensiveBlocked}

                >

                  {t === 'comprehensive' ? 'Comprehensive (monthly)' : 'Basic (weekly)'}

                </option>

              ))}

            </select>

            {monthlyComprehensiveBlocked && (

              <p className="meta">

                Monthly comprehensive note already submitted for {month}. Another can be added on the 1st

                of next month.

              </p>

            )}

          </div>

          <Toggle label="Seen on HD" checked={seenOnHd} onChange={setSeenOnHd} large />

          <Toggle label="CIPA" checked={cipa} onChange={setCipa} large />

          {noteType === 'comprehensive' && (

            <div className="field">

              <label>Comprehensive assessment</label>

              <textarea

                value={assessment}

                onChange={(e) => setAssessment(e.target.value)}

                placeholder="Full monthly assessment…"

              />

            </div>

          )}

          <div className="field">

            <label>Notes</label>

            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

          </div>

          {error && <p className="error-text">{error}</p>}

        </form>

        <FixedActionBar>

          <button className="btn btn-primary" type="submit" form="save-note-form">

            Save note

          </button>

          {cohortIndex >= 0 && (

            <button className="btn btn-primary" type="button" onClick={() => void submitVisit(true)}>

              Save note &amp; next patient

            </button>

          )}

        </FixedActionBar>

      </div>



      {!roundsMode && (

        <div className="card stack">

          <button

            type="button"

            className="visit-history-toggle"

            onClick={() => setHistoryOpen((open) => !open)}

            aria-expanded={historyOpen}

          >

            <span>

              Visit history ({month}) · {visits.length} visit{visits.length === 1 ? '' : 's'}

            </span>

            <span aria-hidden="true">{historyOpen ? '▾' : '▸'}</span>

          </button>

          {historyOpen &&

            (visits.length === 0 ? (

              <p className="meta">No visits logged this month.</p>

            ) : (

              <div className="visit-history-list">

                {visits.map((visit) => (

                  <VisitHistoryItem

                    key={visit.id}

                    visit={visit}

                    month={month}

                    monthlyComprehensiveTaken={

                      (summary?.comprehensiveCount ?? 0) >= MONTHLY_NOTE_TARGET

                    }

                    onGoToAttest={() => navigate(attestUrlForVisit(visit.visitDate))}

                    onSaved={async () => {

                      await Promise.all([reloadVisits(), reloadSummary()]);

                    }}

                  />

                ))}

              </div>

            ))}

        </div>

      )}



      {roundsMode && visits.length > 0 && (

        <div className="card">

          <button

            type="button"

            className="visit-history-toggle"

            onClick={() => setHistoryOpen((open) => !open)}

            aria-expanded={historyOpen}

          >

            <span>

              Visit history ({visits.length}) — tap to {historyOpen ? 'hide' : 'show'}

            </span>

            <span aria-hidden="true">{historyOpen ? '▾' : '▸'}</span>

          </button>

          {historyOpen && (

            <div className="visit-history-list">

              {visits.map((visit) => (

                <VisitHistoryItem

                  key={visit.id}

                  visit={visit}

                  month={month}

                  monthlyComprehensiveTaken={(summary?.comprehensiveCount ?? 0) >= MONTHLY_NOTE_TARGET}

                  onGoToAttest={() => navigate(attestUrlForVisit(visit.visitDate))}

                  onSaved={async () => {

                    await Promise.all([reloadVisits(), reloadSummary()]);

                  }}

                />

              ))}

            </div>

          )}

        </div>

      )}



      <div className="card stack">

        <button

          type="button"

          className="visit-history-toggle"

          onClick={() => setShowMore((open) => !open)}

          aria-expanded={showMore}

        >

          <span>More — sticky note{isAdmin ? ' & admin' : ''}</span>

          <span aria-hidden="true">{showMore ? '▾' : '▸'}</span>

        </button>

        {showMore && (

          <div className="stack">

            <div className="field">

              <label>Sticky note</label>

              <textarea value={stickyNote} onChange={(e) => setStickyNote(e.target.value)} />

            </div>

            <button className="btn" type="button" onClick={() => void saveProfile()}>

              Save sticky note

            </button>

            {stickyMessage && <p className="banner badge-success">{stickyMessage}</p>}



            {isAdmin && (

              <>

                {actionMessage && <p className="banner badge-success">{actionMessage}</p>}

                {actionError && <p className="error-text">{actionError}</p>}



                <div className="row">

                  <div className="field">

                    <label>Status</label>

                    <select value={status} onChange={(e) => setStatus(e.target.value)}>

                      {PATIENT_STATUSES.map((s) => (

                        <option key={s} value={s}>

                          {s}

                        </option>

                      ))}

                    </select>

                  </div>

                  <button className="btn" type="button" onClick={() => void saveStatus()}>

                    Update status

                  </button>

                </div>



                <div className="row">

                  <div className="field">

                    <label>Reassign unit</label>

                    <select value={reassignUnit} onChange={(e) => setReassignUnit(e.target.value)}>

                      {(unitsData?.units ?? []).map((unit) => (

                        <option key={unit.id} value={unit.id}>

                          {unit.name}

                        </option>

                      ))}

                    </select>

                  </div>

                  <div className="field">

                    <label>Reassign shift</label>

                    <select value={reassignShift} onChange={(e) => setReassignShift(e.target.value)}>

                      {SHIFTS.map((s) => (

                        <option key={s} value={s}>

                          {s}

                        </option>

                      ))}

                    </select>

                  </div>

                  <button className="btn" type="button" onClick={() => void saveAssignment()}>

                    Reassign

                  </button>

                </div>



                <button className="btn btn-danger" type="button" onClick={() => void removePatient()}>

                  Remove patient

                </button>

              </>

            )}

          </div>

        )}

      </div>

    </div>

  );

}



function noteTypeLabel(type: NoteType): string {

  return type === 'comprehensive' ? 'Comprehensive' : 'Basic';

}



function visitSummary(visit: Visit): string {

  const parts = [
    `${noteTypeLabel(visit.noteType)} · HD: ${visit.seenOnHd ? 'Y' : 'N'} · CIPA: ${visit.cipa ? 'Y' : 'N'}`,
  ];
  if (visit.attestedAt && visit.visitMode) {
    parts.push(VISIT_MODE_LABELS[visit.visitMode]);
  }
  return parts.join(' · ');

}



function formatTimestamp(iso: string): string {

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString();

}



function yesNo(value: boolean): string {

  return value ? 'Yes' : 'No';

}



function VisitHistoryItem({

  visit,

  month,

  monthlyComprehensiveTaken,

  onGoToAttest,

  onSaved,

}: {

  visit: Visit;

  month: string;

  monthlyComprehensiveTaken: boolean;

  onGoToAttest: () => void;

  onSaved: () => Promise<void>;

}) {

  const [expanded, setExpanded] = useState(false);

  const [editing, setEditing] = useState(false);

  const [noteType, setNoteType] = useState(visit.noteType);

  const [seenOnHd, setSeenOnHd] = useState(visit.seenOnHd);

  const [cipa, setCipa] = useState(visit.cipa);

  const [notes, setNotes] = useState(visit.notes);

  const [assessment, setAssessment] = useState(visit.assessment);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const comprehensiveBlocked =

    visit.noteType !== 'comprehensive' &&

    visit.visitDate.slice(0, 7) === month &&

    monthlyComprehensiveTaken;



  useEffect(() => {

    setNoteType(visit.noteType);

    setSeenOnHd(visit.seenOnHd);

    setCipa(visit.cipa);

    setNotes(visit.notes);

    setAssessment(visit.assessment);

  }, [visit]);



  function resetEditFields() {

    setNoteType(visit.noteType);

    setSeenOnHd(visit.seenOnHd);

    setCipa(visit.cipa);

    setNotes(visit.notes);

    setAssessment(visit.assessment);

    setError(null);

  }



  function toggleExpanded() {

    setExpanded((value) => !value);

    setEditing(false);

    resetEditFields();

  }



  function startEditing(e: React.MouseEvent) {

    e.stopPropagation();

    setExpanded(true);

    setEditing(true);

    resetEditFields();

  }



  function cancelEditing(e: React.MouseEvent) {

    e.stopPropagation();

    setEditing(false);

    resetEditFields();

  }



  async function saveVisit(e: React.FormEvent) {

    e.preventDefault();

    e.stopPropagation();

    setSaving(true);

    setError(null);

    try {

      await mutate(`/api/visits/${visit.id}`, {

        method: 'PATCH',

        body: JSON.stringify({

          noteType,

          seenOnHd,

          cipa,

          notes,

          assessment: noteType === 'comprehensive' ? assessment : '',

        }),

      });

      setEditing(false);

      await onSaved();

    } catch (err) {

      setError(err instanceof ApiClientError ? err.message : 'Could not save visit');

    } finally {

      setSaving(false);

    }

  }



  return (

    <div
      className={`visit-history-item${expanded ? ' visit-history-item--expanded' : ''}${!visit.attestedAt && visit.visitLogged ? ' visit-history-item--needs-signoff' : ''}${visit.attestedAt ? ' visit-history-item--signed' : ''}`}
    >

      <button

        type="button"

        className="visit-history-header"

        onClick={toggleExpanded}

        aria-expanded={expanded}

      >

        <div className="visit-history-header-main">

          <strong>{visit.visitDate}</strong>

          <div className="meta">

            {visitSummary(visit)}

            {!visit.attestedAt ? (
              <span className="visit-attest-pending">
                <StatusChip variant="pending" label="Needs sign-off" />
              </span>
            ) : (
              <span className="visit-attest-pending">
                <StatusChip variant="success" label="Completed" />
              </span>
            )}

          </div>

        </div>

        <span className="visit-history-caret" aria-hidden="true">

          {expanded ? '▾' : '▸'}

        </span>

      </button>



      {expanded && (

        <div className="visit-history-detail">

          {editing ? (

            <form className="stack" onSubmit={saveVisit}>

              <div className="field">

                <label>Note type</label>

                <select value={noteType} onChange={(e) => setNoteType(e.target.value as NoteType)}>

                  {NOTE_TYPES.map((t) => (

                    <option

                      key={t}

                      value={t}

                      disabled={t === 'comprehensive' && comprehensiveBlocked}

                    >

                      {noteTypeLabel(t)}

                    </option>

                  ))}

                </select>

              </div>

              <Toggle label="Seen on HD" checked={seenOnHd} onChange={setSeenOnHd} large />

              <Toggle label="CIPA" checked={cipa} onChange={setCipa} large />

              {noteType === 'comprehensive' && (

                <div className="field">

                  <label>Assessment</label>

                  <textarea value={assessment} onChange={(e) => setAssessment(e.target.value)} />

                </div>

              )}

              <div className="field">

                <label>Notes</label>

                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

              </div>

              {error && <p className="error-text">{error}</p>}

              <div className="row">

                <button className="btn btn-primary" type="submit" disabled={saving}>

                  {saving ? 'Saving…' : 'Save'}

                </button>

                <button className="btn" type="button" onClick={cancelEditing} disabled={saving}>

                  Cancel

                </button>

              </div>

            </form>

          ) : (

            <>

              <dl className="visit-detail-grid">

                <div>

                  <dt>Note type</dt>

                  <dd>{noteTypeLabel(visit.noteType)}</dd>

                </div>

                <div>

                  <dt>Seen on HD</dt>

                  <dd>{yesNo(visit.seenOnHd)}</dd>

                </div>

                <div>

                  <dt>CIPA</dt>

                  <dd>{yesNo(visit.cipa)}</dd>

                </div>

              </dl>

              {visit.noteType === 'comprehensive' && (

                <div className="visit-detail-notes">

                  <strong>Assessment</strong>

                  {visit.assessment ? (

                    <p>{visit.assessment}</p>

                  ) : (

                    <p className="meta">No assessment recorded.</p>

                  )}

                </div>

              )}

              <div className="visit-detail-notes">

                <strong>Notes</strong>

                {visit.notes ? <p>{visit.notes}</p> : <p className="meta">No notes recorded.</p>}

              </div>

              <div className="visit-detail-meta meta">

                <div>Recorded: {formatTimestamp(visit.createdAt)}</div>

                <div className="visit-updated-meta">
                  <span>
                    Last updated by {visit.updatedByName ?? visit.authorName ?? 'Unknown'}
                  </span>
                  <span>{formatTimestamp(visit.updatedAt)}</span>
                </div>

              </div>

              {!visit.attestedAt && (

                <button className="btn" type="button" onClick={onGoToAttest}>

                  Go to Attest

                </button>

              )}

              <button className="btn" type="button" onClick={startEditing}>

                Edit

              </button>

            </>

          )}

        </div>

      )}

    </div>

  );

}



function Toggle({

  label,

  checked,

  onChange,

  large = false,

}: {

  label: string;

  checked: boolean;

  onChange: (value: boolean) => void;

  large?: boolean;

}) {

  return (

    <label className={`toggle-row${large ? ' toggle-row--large' : ''}`}>

      <span>{label}</span>

      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />

    </label>

  );

}


