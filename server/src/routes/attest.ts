import {
  validateAttestDayQuery,
  validateAttestQuery,
  validateAttestSessionQuery,
  validateBatchAttest,
  validateUpdateAttestSession,
} from '@dialyrounds/shared';
import type {
  AttestDayBoard,
  AttestDayUnitGroup,
  AttestQueueItem,
  AttestSession,
  AttestShiftBucket,
  AttestVisitRow,
  NoteType,
  Shift,
  VisitMode,
} from '@dialyrounds/shared';
import type { RouteHandler } from '../env.js';
import { auditKv, writeAudit } from '../utils/audit.js';
import { error, json, parseJson } from '../utils/response.js';
import { nowIso } from '../utils/time.js';

interface AttestRow {
  id: number;
  visit_date: string;
  note_type: NoteType;
  attested_at: string | null;
  visit_mode: VisitMode | null;
  patient_id: number;
  first_name: string;
  last_name: string;
  author_name: string;
  attested_by_name: string | null;
  seen_on_hd: number;
  cipa: number;
  notes: string;
  assessment: string;
}

interface DayVisitRow extends AttestRow {
  unit_id: number;
  unit_name: string;
  shift: string;
  session_visit_mode: VisitMode | null;
}

function mapAttestRow(row: AttestRow): AttestVisitRow {
  return {
    visitId: row.id,
    visitDate: row.visit_date,
    noteType: row.note_type,
    patientId: row.patient_id,
    firstName: row.first_name,
    lastName: row.last_name,
    authorName: row.author_name,
    attestedAt: row.attested_at,
    attestedByName: row.attested_by_name,
    visitMode: row.visit_mode,
    seenOnHd: row.seen_on_hd === 1,
    cipa: row.cipa === 1,
    notes: row.notes,
    assessment: row.assessment,
  };
}

const SESSION_VISITS_QUERY = `SELECT v.id, v.visit_date, v.note_type, v.attested_at, v.visit_mode,
       v.seen_on_hd, v.cipa, v.notes, v.assessment,
       p.id as patient_id, p.first_name, p.last_name,
       author.name as author_name,
       attester.name as attested_by_name
FROM visits v
JOIN patients p ON p.id = v.patient_id
JOIN users author ON author.id = v.user_id
LEFT JOIN users attester ON attester.id = v.attested_by
WHERE p.active = 1 AND p.unit_id = ? AND p.shift = ?
  AND v.visit_date = ? AND v.visit_logged = 1
ORDER BY p.last_name, p.first_name, v.id DESC`;

const ATTEST_LIST_QUERY = `SELECT v.id, v.visit_date, v.note_type, v.attested_at, v.visit_mode,
       v.seen_on_hd, v.cipa, v.notes, v.assessment,
       p.id as patient_id, p.first_name, p.last_name,
       author.name as author_name,
       attester.name as attested_by_name
FROM visits v
JOIN patients p ON p.id = v.patient_id
JOIN users author ON author.id = v.user_id
LEFT JOIN users attester ON attester.id = v.attested_by
WHERE p.active = 1 AND p.unit_id = ? AND p.shift = ?
  AND v.visit_date >= ? AND v.visit_date <= ? AND v.visit_logged = 1
ORDER BY v.visit_date DESC, p.last_name, p.first_name, v.id DESC`;

const QUEUE_QUERY = `SELECT p.unit_id, u.name as unit_name, p.shift, v.visit_date,
       SUM(CASE WHEN v.attested_at IS NULL THEN 1 ELSE 0 END) as pending_count,
       COUNT(*) as total_count,
       ss.visit_mode
FROM visits v
JOIN patients p ON p.id = v.patient_id
JOIN units u ON u.id = p.unit_id
LEFT JOIN shift_sessions ss ON ss.unit_id = p.unit_id
  AND ss.shift = p.shift AND ss.session_date = v.visit_date
WHERE p.active = 1 AND v.visit_logged = 1
GROUP BY p.unit_id, p.shift, v.visit_date
HAVING pending_count > 0
ORDER BY v.visit_date DESC, u.name, p.shift`;

const DAY_VISITS_QUERY = `SELECT v.id, v.visit_date, v.note_type, v.attested_at, v.visit_mode,
       v.seen_on_hd, v.cipa, v.notes, v.assessment,
       p.id as patient_id, p.first_name, p.last_name,
       p.unit_id, u.name as unit_name, p.shift,
       author.name as author_name,
       attester.name as attested_by_name,
       ss.visit_mode as session_visit_mode
FROM visits v
JOIN patients p ON p.id = v.patient_id
JOIN units u ON u.id = p.unit_id
JOIN users author ON author.id = v.user_id
LEFT JOIN users attester ON attester.id = v.attested_by
LEFT JOIN shift_sessions ss ON ss.unit_id = p.unit_id
  AND ss.shift = p.shift AND ss.session_date = v.visit_date
WHERE p.active = 1 AND v.visit_logged = 1 AND v.visit_date = ?
ORDER BY u.name, p.shift, p.last_name, p.first_name, v.id DESC`;

interface QueueRow {
  unit_id: number;
  unit_name: string;
  shift: string;
  visit_date: string;
  pending_count: number;
  total_count: number;
  visit_mode: VisitMode | null;
}

function buildDayBoard(date: string, rows: DayVisitRow[]): AttestDayBoard {
  const bucketMap = new Map<string, AttestShiftBucket>();

  for (const row of rows) {
    const key = `${row.unit_id}-${row.shift}`;
    let bucket = bucketMap.get(key);
    if (!bucket) {
      bucket = {
        unitId: row.unit_id,
        unitName: row.unit_name,
        shift: row.shift as Shift,
        visitDate: date,
        visitMode: row.session_visit_mode,
        pendingCount: 0,
        totalCount: 0,
        visits: [],
      };
      bucketMap.set(key, bucket);
    }
    const visit = mapAttestRow(row);
    bucket.visits.push(visit);
    bucket.totalCount++;
    if (!visit.attestedAt) bucket.pendingCount++;
    if (row.session_visit_mode) bucket.visitMode = row.session_visit_mode;
  }

  const allBuckets = [...bucketMap.values()];
  const unitMap = new Map<number, AttestDayUnitGroup>();

  for (const bucket of allBuckets) {
    let unit = unitMap.get(bucket.unitId);
    if (!unit) {
      unit = { unitId: bucket.unitId, unitName: bucket.unitName, shifts: [] };
      unitMap.set(bucket.unitId, unit);
    }
    unit.shifts.push(bucket);
  }

  const units = [...unitMap.values()].sort((a, b) => a.unitName.localeCompare(b.unitName));
  for (const unit of units) {
    unit.shifts.sort((a, b) => a.shift.localeCompare(b.shift));
  }

  const pendingCount = allBuckets.reduce((sum, b) => sum + b.pendingCount, 0);
  const totalCount = allBuckets.reduce((sum, b) => sum + b.totalCount, 0);

  return { date, pendingCount, totalCount, units };
}

export const getAttestDay: RouteHandler = async (_request, ctx) => {
  const parsed = validateAttestDayQuery(ctx.url.searchParams.get('date'));
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const { date } = parsed.value;
  const { results } = await ctx.env.DB.prepare(DAY_VISITS_QUERY).bind(date).all<DayVisitRow>();
  const board = buildDayBoard(date, results ?? []);

  return json(board);
};

export const listAttestQueue: RouteHandler = async (_request, ctx) => {
  const dateParam = ctx.url.searchParams.get('date');
  let query = QUEUE_QUERY;
  const binds: unknown[] = [];

  if (dateParam) {
    const dateCheck = validateAttestDayQuery(dateParam);
    if (!dateCheck.ok) return error('Validation failed', 400, dateCheck.errors);
    query = `${QUEUE_QUERY.replace('WHERE p.active = 1', 'WHERE p.active = 1 AND v.visit_date = ?')}`;
    binds.push(dateCheck.value.date);
  }

  const stmt = ctx.env.DB.prepare(query);
  const { results } =
    binds.length > 0
      ? await stmt.bind(...binds).all<QueueRow>()
      : await stmt.all<QueueRow>();
  const items: AttestQueueItem[] = (results ?? []).map((row) => ({
    unitId: row.unit_id,
    unitName: row.unit_name,
    shift: row.shift as AttestQueueItem['shift'],
    visitDate: row.visit_date,
    pendingCount: row.pending_count,
    totalCount: row.total_count,
    visitMode: row.visit_mode,
  }));

  return json({ items });
};

export const getAttestSession: RouteHandler = async (_request, ctx) => {
  const parsed = validateAttestSessionQuery({
    unit: ctx.url.searchParams.get('unit'),
    shift: ctx.url.searchParams.get('shift'),
    date: ctx.url.searchParams.get('date'),
  });
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const { unitId, shift, visitDate } = parsed.value;

  const unit = await ctx.env.DB.prepare('SELECT name FROM units WHERE id = ?')
    .bind(unitId)
    .first<{ name: string }>();
  if (!unit) return error('Unit not found', 404);

  const sessionMeta = await ctx.env.DB.prepare(
    `SELECT visit_mode FROM shift_sessions
     WHERE unit_id = ? AND shift = ? AND session_date = ?`
  )
    .bind(unitId, shift, visitDate)
    .first<{ visit_mode: VisitMode | null }>();

  const { results } = await ctx.env.DB.prepare(SESSION_VISITS_QUERY)
    .bind(unitId, shift, visitDate)
    .all<AttestRow>();

  const visits = (results ?? []).map(mapAttestRow);
  const pendingCount = visits.filter((v) => !v.attestedAt).length;

  const session: AttestSession = {
    unitId,
    unitName: unit.name,
    shift,
    visitDate,
    visitMode: sessionMeta?.visit_mode ?? null,
    pendingCount,
    totalCount: visits.length,
    visits,
  };

  return json(session);
};

export const updateAttestSession: RouteHandler = async (request, ctx) => {
  const body = await parseJson(request);
  const parsed = validateUpdateAttestSession(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const { unitId, shift, visitDate, visitMode } = parsed.value;
  const now = nowIso();

  await ctx.env.DB.prepare(
    `INSERT INTO shift_sessions (unit_id, shift, session_date, visit_mode, visit_mode_set_by, visit_mode_set_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(unit_id, shift, session_date) DO UPDATE SET
       visit_mode = excluded.visit_mode,
       visit_mode_set_by = excluded.visit_mode_set_by,
       visit_mode_set_at = excluded.visit_mode_set_at`
  )
    .bind(unitId, shift, visitDate, visitMode, ctx.user!.id, now)
    .run();

  await writeAudit(
    ctx.env,
    ctx.user!.id,
    'update_attest_session',
    'unit',
    unitId,
    `shift=${shift};date=${visitDate};mode=${visitMode}`
  );

  return json({ ok: true, visitMode });
};

export const listAttestVisits: RouteHandler = async (_request, ctx) => {
  const parsed = validateAttestQuery({
    unit: ctx.url.searchParams.get('unit'),
    shift: ctx.url.searchParams.get('shift'),
    start: ctx.url.searchParams.get('start'),
    end: ctx.url.searchParams.get('end'),
  });
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const { unitId, shift, start, end } = parsed.value;
  const { results } = await ctx.env.DB.prepare(ATTEST_LIST_QUERY)
    .bind(unitId, shift, start, end)
    .all<AttestRow>();

  const visits = (results ?? []).map(mapAttestRow);
  const pendingCount = visits.filter((v) => !v.attestedAt).length;

  return json({ visits, pendingCount, totalCount: visits.length });
};

async function getSessionVisitMode(
  db: D1Database,
  unitId: number,
  shift: string,
  sessionDate: string
): Promise<VisitMode | null> {
  const row = await db
    .prepare(
      `SELECT visit_mode FROM shift_sessions
       WHERE unit_id = ? AND shift = ? AND session_date = ?`
    )
    .bind(unitId, shift, sessionDate)
    .first<{ visit_mode: VisitMode | null }>();
  return row?.visit_mode ?? null;
}

type AttestOutcome = 'ok' | 'not_found' | 'already' | 'not_logged' | 'no_mode' | 'failed';

async function attestSingleVisit(
  db: D1Database,
  userId: number,
  visitId: number
): Promise<AttestOutcome> {
  const visit = await db
    .prepare(
      `SELECT v.id, v.visit_date, v.attested_at, v.visit_logged,
              p.unit_id, p.shift
       FROM visits v
       JOIN patients p ON p.id = v.patient_id
       WHERE v.id = ?`
    )
    .bind(visitId)
    .first<{
      id: number;
      visit_date: string;
      attested_at: string | null;
      visit_logged: number;
      unit_id: number;
      shift: string;
    }>();

  if (!visit) return 'not_found';
  if (visit.attested_at) return 'already';
  if (visit.visit_logged !== 1) return 'not_logged';

  const sessionMode = await getSessionVisitMode(
    db,
    visit.unit_id,
    visit.shift,
    visit.visit_date
  );
  if (!sessionMode) return 'no_mode';

  const now = nowIso();
  const result = await db
    .prepare(
      `UPDATE visits SET attested_at = ?, attested_by = ?, visit_mode = ?
       WHERE id = ? AND attested_at IS NULL AND visit_logged = 1`
    )
    .bind(now, userId, sessionMode, visitId)
    .run();

  return (result.meta.changes ?? 0) > 0 ? 'ok' : 'failed';
}

async function attestVisits(
  db: D1Database,
  userId: number,
  visitIds: number[]
): Promise<{ attested: number; noMode: number }> {
  let attested = 0;
  let noMode = 0;
  for (const visitId of visitIds) {
    const outcome = await attestSingleVisit(db, userId, visitId);
    if (outcome === 'ok') attested++;
    else if (outcome === 'no_mode') noMode++;
  }
  return { attested, noMode };
}

export const batchAttest: RouteHandler = async (request, ctx) => {
  const body = await parseJson(request);
  const parsed = validateBatchAttest(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const { attested, noMode } = await attestVisits(ctx.env.DB, ctx.user!.id, parsed.value.visitIds);
  await writeAudit(
    ctx.env,
    ctx.user!.id,
    'batch_attest',
    'visit',
    null,
    `count=${attested};requested=${parsed.value.visitIds.length};no_mode=${noMode}`
  );

  if (attested === 0 && noMode > 0) {
    return error('Select telemed or in person for this shift before signing off', 400);
  }

  return json({ attested, skippedNoMode: noMode });
};

export const attestVisit: RouteHandler = async (_request, ctx) => {
  const visitId = Number(ctx.params.id);
  if (!Number.isInteger(visitId)) return error('Invalid visit id', 400);

  const outcome = await attestSingleVisit(ctx.env.DB, ctx.user!.id, visitId);
  if (outcome === 'ok') {
    const row = await ctx.env.DB.prepare(
      `SELECT v.note_type, v.visit_mode, v.visit_date, p.last_name, p.first_name
       FROM visits v
       JOIN patients p ON p.id = v.patient_id
       WHERE v.id = ?`
    )
      .bind(visitId)
      .first<{
        note_type: NoteType;
        visit_mode: VisitMode | null;
        visit_date: string;
        last_name: string;
        first_name: string;
      }>();

    await writeAudit(
      ctx.env,
      ctx.user!.id,
      'attest_visit',
      'visit',
      visitId,
      auditKv({
        patient: row ? `${row.last_name}, ${row.first_name}` : undefined,
        noteType: row?.note_type,
        visitMode: row?.visit_mode ?? undefined,
        visitDate: row?.visit_date,
      })
    );
    return json({ ok: true });
  }

  if (outcome === 'not_found') return error('Visit not found', 404);
  if (outcome === 'already') return error('Visit already attested', 409);
  if (outcome === 'not_logged') return error('Visit has not been logged', 400);
  if (outcome === 'no_mode') {
    return error('Select telemed or in person for this shift before signing off', 400);
  }

  return error('Could not attest visit', 400);
};
