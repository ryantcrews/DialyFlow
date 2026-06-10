/**
 * Generates seed-mock-data.sql for local and remote dev testing.
 * Visits align to shift weekdays (MWF / TTS) for a rolling ~2-week window.
 * Past visits are attested; today's visits are pending sign-off.
 *
 * Run: node scripts/generate-mock-seed.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLINIC_TZ = 'America/New_York';
const MOCK_USER_ID = 1;

const UNITS = [
  'West Iredell WFB',
  'Wilkesboro WFB',
  'Davie WFB',
  'Statesville WFB',
  'Lake Norman WFB',
  'Taylorsville FMC',
];

const SHIFTS = ['MWF AM', 'MWF PM', 'TTS AM', 'TTS PM'];

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda',
  'David', 'Elizabeth', 'Richard', 'Barbara', 'Joseph', 'Susan', 'Thomas', 'Jessica',
  'Charles', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
  'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley',
  'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright',
];

const STICKY_NOTES = [
  '',
  '',
  '',
  'Check BP before rounds',
  'Family prefers afternoon contact',
  'New to unit — verify meds list',
  'Transport chair 4',
  'Monthly note due this week',
];

const STATUSES = ['active', 'active', 'active', 'active', 'hospitalized', 'active'];

const WEEKDAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function esc(value) {
  return String(value).replace(/'/g, "''");
}

function pick(list, index) {
  return list[index % list.length];
}

function dobForIndex(i) {
  const year = 1945 + (i % 35);
  const month = String((i % 12) + 1).padStart(2, '0');
  const day = String((i % 27) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayInClinic() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function monthFromDate(isoDate) {
  return isoDate.slice(0, 7);
}

function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return dt.toISOString().slice(0, 10);
}

function weekdayInClinic(isoDate) {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    weekday: 'short',
  }).format(new Date(`${isoDate}T12:00:00Z`));
  return WEEKDAY_MAP[short] ?? 0;
}

function shiftMatchesDate(shift, isoDate) {
  const day = weekdayInClinic(isoDate);
  if (shift.startsWith('MWF')) return day === 1 || day === 3 || day === 5;
  return day === 2 || day === 4 || day === 6;
}

function dialysisDates(shift, startDate, endDate) {
  const dates = [];
  let cur = startDate;
  while (cur <= endDate) {
    if (shiftMatchesDate(shift, cur)) dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}

function admissionDateForPatient(patientIndex, monthStart, today) {
  if (patientIndex % 13 === 0) return today;
  if (patientIndex % 9 === 0) return addDays(today, -3);
  return monthStart;
}

function stickyNoteFor(i) {
  const note = pick(STICKY_NOTES, i);
  return note ? `Round note: ${note}` : '';
}

const today = todayInClinic();
const month = monthFromDate(today);
const monthStart = `${month}-01`;
const windowStart = addDays(today, -13);

const lines = [
  '-- Mock patient + visit data for dev testing',
  '-- Safe to re-run: skips duplicate patients/visits; refreshes mock visits in rolling window',
  '',
  'PRAGMA foreign_keys = ON;',
  '',
];

let patientIndex = 0;
const patientKeys = [];

for (const unitName of UNITS) {
  for (const shift of SHIFTS) {
    for (let p = 0; p < 3; p++) {
      const i = patientIndex++;
      const firstName = pick(FIRST_NAMES, i + p);
      const lastName = pick(LAST_NAMES, i * 2 + p);
      const dob = dobForIndex(i + p * 7);
      const stickyNote = pick(STICKY_NOTES, i);
      const status = pick(STATUSES, i);
      const admissionDate = admissionDateForPatient(i, monthStart, today);

      patientKeys.push({ unitName, shift, firstName, lastName, dob, i, admissionDate });

      lines.push(`-- ${unitName} / ${shift}: ${lastName}, ${firstName}`);
      lines.push(`INSERT INTO patients (first_name, last_name, dob, sticky_note, unit_id, shift, status, admission_date)
SELECT '${esc(firstName)}', '${esc(lastName)}', '${dob}', '${esc(stickyNote)}', u.id, '${shift}', '${status}', '${admissionDate}'
FROM units u
WHERE u.name = '${esc(unitName)}'
  AND NOT EXISTS (
    SELECT 1 FROM patients p
    WHERE p.unit_id = u.id AND p.active = 1
      AND lower(p.first_name) = lower('${esc(firstName)}')
      AND lower(p.last_name) = lower('${esc(lastName)}')
      AND p.dob = '${dob}'
  );`);
      lines.push(`UPDATE patients SET admission_date = '${admissionDate}'
WHERE id = (
  SELECT p.id FROM patients p
  JOIN units u ON u.id = p.unit_id
  WHERE u.name = '${esc(unitName)}'
    AND p.shift = '${shift}'
    AND lower(p.first_name) = lower('${esc(firstName)}')
    AND lower(p.last_name) = lower('${esc(lastName)}')
    AND p.dob = '${dob}'
    AND p.active = 1
  LIMIT 1
);`);
      lines.push('');
    }
  }
}

lines.push('-- Backfill admission dates on existing mock patients missing a date');
lines.push(`UPDATE patients SET admission_date = '${monthStart}' WHERE admission_date IS NULL;`);
lines.push('');

lines.push('-- Clear prior mock visits in rolling window (user_id = 1) before re-seeding');
lines.push('DELETE FROM visits');
lines.push(`WHERE user_id = ${MOCK_USER_ID}`);
lines.push(`  AND visit_date >= '${windowStart}'`);
lines.push(`  AND visit_date <= '${today}';`);
lines.push('');

lines.push('-- Visits: shift-aligned dates, attested history, pending today');
lines.push(`-- Window: ${windowStart} .. ${today} (clinic TZ)`);
lines.push('');

for (const patient of patientKeys) {
  const { unitName, shift, firstName, lastName, dob, i, admissionDate } = patient;
  const dates = dialysisDates(shift, windowStart, today).filter((d) => d >= admissionDate);
  if (dates.length === 0) continue;

  let comprehensivePlaced = false;
  const needsCompToday = i % 5 === 0;

  for (const visitDate of dates) {
    const isToday = visitDate === today;
    const visitMonth = monthFromDate(visitDate);
    const isFirstMonthVisit = !comprehensivePlaced && visitMonth === month;

    let noteType = 'basic';
    let monthlyNote = 0;
    let assessment = '';
    let notes = stickyNoteFor(i) || (isToday ? 'Today rounds note' : 'Weekly dialysis note');

    if (isToday) {
      if (needsCompToday && !comprehensivePlaced) {
        noteType = 'comprehensive';
        monthlyNote = 1;
        assessment = 'Monthly comprehensive assessment (pending sign-off).';
        notes = notes || 'Monthly visit note (pending sign-off).';
        comprehensivePlaced = true;
      }
    } else if (isFirstMonthVisit) {
      noteType = 'comprehensive';
      monthlyNote = 1;
      assessment = 'Monthly comprehensive assessment.';
      notes = notes || 'Monthly visit note.';
      comprehensivePlaced = true;
    }

    const seenOnHd = i % 5 !== 0 ? 1 : 0;
    const cipa = i % 2 === 0 ? 1 : 0;
    const visitMode = i % 3 === 0 ? 'in_person' : 'telemed';
    const attested = !isToday;
    const attestedAt = attested ? `'${visitDate}T18:30:00'` : 'NULL';
    const attestedBy = attested ? MOCK_USER_ID : 'NULL';
    const visitModeSql = attested ? `'${visitMode}'` : 'NULL';

    lines.push(`INSERT INTO visits (
  patient_id, user_id, updated_by, visit_date, note_type, seen_on_hd, monthly_note, cipa,
  notes, assessment, visit_logged, attested_at, attested_by, visit_mode
)
SELECT p.id, ${MOCK_USER_ID}, ${MOCK_USER_ID}, '${visitDate}', '${noteType}', ${seenOnHd}, ${monthlyNote}, ${cipa},
  '${esc(notes)}', '${esc(assessment)}', 1, ${attestedAt}, ${attestedBy}, ${visitModeSql}
FROM patients p
JOIN units u ON u.id = p.unit_id
WHERE u.name = '${esc(unitName)}'
  AND p.shift = '${shift}'
  AND lower(p.first_name) = lower('${esc(firstName)}')
  AND lower(p.last_name) = lower('${esc(lastName)}')
  AND p.dob = '${dob}'
  AND NOT EXISTS (
    SELECT 1 FROM visits v
    WHERE v.patient_id = p.id AND v.visit_date = '${visitDate}'
  );`);
  }
}

const outPath = join(__dirname, 'seed-mock-data.sql');
writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`  ${patientKeys.length} patients across ${UNITS.length} units`);
console.log(`  Visit window: ${windowStart} to ${today} (${CLINIC_TZ})`);
