import type { AttestDayBoard, AttestShiftBucket, Unit, VisitMode } from '@dialyrounds/shared';
import { SHIFTS } from '@dialyrounds/shared';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '../api/client';
import { AttestDayBoard as AttestDayBoardView } from '../components/AttestDayBoard';
import { PatientListSkeleton } from '../components/Skeleton';
import { StatusChip } from '../components/StatusChip';
import { mutate, useFetch } from '../hooks/useApi';
import { useRouter } from '../hooks/useRouter';
import { useToast } from '../hooks/useToast';
import { formatDisplayDate, todayIsoDate } from '../utils/dateRange';

function buildAttestUrl(date: string, unitId?: string, shift?: string): string {
  const params = new URLSearchParams();
  params.set('date', date);
  if (unitId) params.set('unit', unitId);
  if (shift) params.set('shift', shift);
  return `/attest?${params.toString()}`;
}

function filterBoard(
  board: AttestDayBoard,
  unitId: string,
  shift: string
): AttestDayBoard {
  let units = board.units;

  if (unitId) {
    units = units.filter((u) => String(u.unitId) === unitId);
  }

  if (shift) {
    units = units
      .map((u) => ({
        ...u,
        shifts: u.shifts.filter((s) => s.shift === shift),
      }))
      .filter((u) => u.shifts.length > 0);
  }

  const pendingCount = units.reduce(
    (sum, u) => sum + u.shifts.reduce((s, b) => s + b.pendingCount, 0),
    0
  );
  const totalCount = units.reduce(
    (sum, u) => sum + u.shifts.reduce((s, b) => s + b.totalCount, 0),
    0
  );

  return { ...board, units, pendingCount, totalCount };
}

export function AttestPage() {
  const { navigate, searchParams, pathname } = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const dateParam = searchParams.get('date');
  const selectedDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayIsoDate();
  const unitFilter = searchParams.get('unit') ?? '';
  const shiftFilter = searchParams.get('shift') ?? '';

  useEffect(() => {
    if (pathname !== '/attest') return;

    const start = searchParams.get('start');
    const date = searchParams.get('date');

    if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
      navigate(buildAttestUrl(start, unitFilter || undefined, shiftFilter || undefined), {
        replace: true,
      });
      return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      navigate(buildAttestUrl(todayIsoDate(), unitFilter || undefined, shiftFilter || undefined), {
        replace: true,
      });
    }
  }, [pathname, searchParams, unitFilter, shiftFilter, navigate]);

  const { data: unitsData } = useFetch<{ units: Unit[] }>('/api/units');
  const boardPath = `/api/attest/day?date=${selectedDate}`;
  const { data: board, loading, reload } = useFetch<AttestDayBoard>(boardPath);

  const filteredBoard = useMemo(
    () => (board ? filterBoard(board, unitFilter, shiftFilter) : null),
    [board, unitFilter, shiftFilter]
  );

  function updateFilters(next: { date?: string; unitId?: string; shift?: string }) {
    navigate(
      buildAttestUrl(
        next.date ?? selectedDate,
        next.unitId !== undefined ? next.unitId : unitFilter || undefined,
        next.shift !== undefined ? next.shift : shiftFilter || undefined
      )
    );
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
      showToast('Visit signed off');
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
      const result = await mutate<{ attested: number; skippedNoMode?: number }>('/api/attest/batch', {
        method: 'POST',
        body: JSON.stringify({ visitIds: pendingIds }),
      });
      if (result.skippedNoMode && result.skippedNoMode > 0) {
        showToast(
          `${result.attested} signed · ${result.skippedNoMode} skipped (select visit type first)`,
          result.attested > 0 ? 'info' : 'error'
        );
      } else {
        showToast(`${result.attested} visit${result.attested === 1 ? '' : 's'} signed`);
      }
      await reload();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : 'Sign-off failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  const isToday = selectedDate === todayIsoDate();
  const units = unitsData?.units ?? [];
  const hasActiveFilters = Boolean(unitFilter || shiftFilter);

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
              onChange={(e) => updateFilters({ date: e.target.value })}
            />
          </div>
          <div className="field attest-filter-field">
            <label htmlFor="attest-unit-filter">Location</label>
            <select
              id="attest-unit-filter"
              value={unitFilter}
              onChange={(e) => updateFilters({ unitId: e.target.value })}
            >
              <option value="">All locations</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field attest-filter-field">
            <label htmlFor="attest-shift-filter">Shift</label>
            <select
              id="attest-shift-filter"
              value={shiftFilter}
              onChange={(e) => updateFilters({ shift: e.target.value })}
            >
              <option value="">All shifts</option>
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {!isToday && (
            <button
              className="btn"
              type="button"
              onClick={() => updateFilters({ date: todayIsoDate() })}
            >
              Back to today
            </button>
          )}
          {hasActiveFilters && (
            <button
              className="btn"
              type="button"
              onClick={() => navigate(buildAttestUrl(selectedDate))}
            >
              Clear filters
            </button>
          )}
        </div>
        <p className="meta" style={{ margin: 0 }}>
          {isToday ? "Today's" : formatDisplayDate(selectedDate)} visits grouped by location and
          shift. Sign off notes inline — no need to open each patient.
        </p>
        {filteredBoard && filteredBoard.totalCount > 0 && (
          <div className="context-summary attest-inbox-summary">
            {filteredBoard.pendingCount > 0 && (
              <StatusChip variant="pending" label={`${filteredBoard.pendingCount} pending`} />
            )}
            {filteredBoard.totalCount - filteredBoard.pendingCount > 0 && (
              <StatusChip
                variant="success"
                label={`${filteredBoard.totalCount - filteredBoard.pendingCount} completed`}
              />
            )}
            <StatusChip variant="neutral" label={`${filteredBoard.totalCount} total`} />
          </div>
        )}
        {filteredBoard && filteredBoard.totalCount > 0 && filteredBoard.pendingCount === 0 && (
          <p className="banner banner-success attest-all-done" style={{ margin: 0 }}>
            All visits for this day are signed off.
          </p>
        )}
      </div>

      <div className="attest-list-card">
        {loading && !board ? (
          <PatientListSkeleton />
        ) : filteredBoard ? (
          <AttestDayBoardView
            board={filteredBoard}
            busy={busy}
            filteredEmpty={Boolean(board.units.length > 0 && filteredBoard.units.length === 0)}
            onVisitModeChange={(bucket, mode) => void setVisitMode(bucket, mode)}
            onSignVisit={(id) => void signVisit(id)}
            onSignAllInShift={(bucket) => void signAllInShift(bucket)}
          />
        ) : null}
      </div>
    </div>
  );
}
