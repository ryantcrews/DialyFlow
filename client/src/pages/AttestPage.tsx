import type { AttestDayBoard, AttestShiftBucket, VisitMode } from '@dialyrounds/shared';
import { useEffect, useState } from 'react';
import { ApiClientError } from '../api/client';
import { AttestDayBoard as AttestDayBoardView } from '../components/AttestDayBoard';
import { PatientListSkeleton } from '../components/Skeleton';
import { StatusChip } from '../components/StatusChip';
import { mutate, useFetch } from '../hooks/useApi';
import { useRouter } from '../hooks/useRouter';
import { useToast } from '../hooks/useToast';
import { formatDisplayDate, todayIsoDate } from '../utils/dateRange';

function attestDayUrl(date: string): string {
  return `/attest?date=${date}`;
}

export function AttestPage() {
  const { navigate, searchParams, pathname } = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const dateParam = searchParams.get('date');
  const selectedDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayIsoDate();

  useEffect(() => {
    if (pathname !== '/attest') return;

    const start = searchParams.get('start');
    const unit = searchParams.get('unit');
    const shift = searchParams.get('shift');
    const date = searchParams.get('date');

    if (unit && shift && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      navigate(attestDayUrl(date), { replace: true });
      return;
    }

    if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
      navigate(attestDayUrl(start), { replace: true });
      return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      navigate(attestDayUrl(todayIsoDate()), { replace: true });
    }
  }, [pathname, searchParams, navigate]);

  const boardPath = `/api/attest/day?date=${selectedDate}`;
  const { data: board, loading, reload } = useFetch<AttestDayBoard>(boardPath);

  function setDate(nextDate: string) {
    navigate(attestDayUrl(nextDate));
  }

  async function setVisitMode(bucket: AttestShiftBucket, mode: VisitMode) {
    setBusy(true);
    try {
      await mutate('/api/attest/session', {
        method: 'PATCH',
        body: JSON.stringify({
          unitId: bucket.unitId,
          shift: bucket.shift,
          visitDate: bucket.visitDate,
          visitMode: mode,
        }),
      });
      await reload();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Could not save visit type', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function signVisit(visitId: number) {
    setBusy(true);
    try {
      await mutate(`/api/attest/${visitId}`, { method: 'POST' });
      showToast('Note signed');
      await reload();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Sign-off failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function signAllInShift(bucket: AttestShiftBucket) {
    const pendingIds = bucket.visits.filter((v) => !v.attestedAt).map((v) => v.visitId);
    if (pendingIds.length === 0) return;
    if (!window.confirm(`Sign off ${pendingIds.length} visit(s) in ${bucket.shift}?`)) return;

    setBusy(true);
    try {
      const result = await mutate<{ attested: number }>('/api/attest/batch', {
        method: 'POST',
        body: JSON.stringify({ visitIds: pendingIds }),
      });
      showToast(`${result.attested} visit${result.attested === 1 ? '' : 's'} signed`);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Sign-off failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  const isToday = selectedDate === todayIsoDate();

  return (
    <div className="attest-page stack">
      <div className="card attest-inbox-header">
        <div className="attest-day-toolbar row">
          <div className="field attest-day-picker">
            <label htmlFor="attest-date">Review date</label>
            <input
              id="attest-date"
              type="date"
              value={selectedDate}
              max={todayIsoDate()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {!isToday && (
            <button className="btn" type="button" onClick={() => setDate(todayIsoDate())}>
              Back to today
            </button>
          )}
        </div>
        <p className="meta" style={{ margin: 0 }}>
          {isToday ? "Today's" : formatDisplayDate(selectedDate)} visits grouped by location and
          shift. Sign off notes inline — no need to open each patient.
        </p>
        {board && board.pendingCount > 0 && (
          <div className="context-summary attest-inbox-summary">
            <StatusChip variant="pending" label={`${board.pendingCount} pending`} />
            <StatusChip variant="neutral" label={`${board.totalCount} visits in queue`} />
          </div>
        )}
      </div>

      <div className="attest-list-card">
        {loading && !board ? (
          <PatientListSkeleton />
        ) : board ? (
          <AttestDayBoardView
            board={board}
            busy={busy}
            onVisitModeChange={(bucket, mode) => void setVisitMode(bucket, mode)}
            onSignVisit={(id) => void signVisit(id)}
            onSignAllInShift={(bucket) => void signAllInShift(bucket)}
          />
        ) : null}
      </div>
    </div>
  );
}
