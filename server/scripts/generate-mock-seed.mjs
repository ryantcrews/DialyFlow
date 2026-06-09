/**
 * Generates seed-mock-data.sql for local testing.
 * Run: node scripts/generate-mock-seed.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

function pick(list, index) {
  return list[index % list.length];
}

function dobForIndex(i) {
  const year = 1945 + (i % 35);
  const month = String((i % 12) + 1).padStart(2, '0');
  const day = String((i % 27) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function visitDatesForMonth(month, count, seed) {
  const [year, mon] = month.split('-').map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const dates = [];
  for (let i = 0; i < count; i++) {
    const day = Math.min(lastDay, 2 + ((seed + i * 5) % (lastDay - 1)));
    dates.push(`${month}-${String(day).padStart(2, '0')}`);
  }
  return dates;
}

const month = currentMonth();
const lines = [
  '-- Mock patient + visit data for local testing',
  '-- Safe to re-run: skips patients that already exist in a unit (name + DOB)',
  '',
  'PRAGMA foreign_keys = ON;',
  '',
];

let patientIndex = 0;

for (const unitName of UNITS) {
  for (const shift of SHIFTS) {
    const patientsPerShift = 3;
    for (let p = 0; p < patientsPerShift; p++) {
      const i = patientIndex++;
      const firstName = pick(FIRST_NAMES, i + p);
      const lastName = pick(LAST_NAMES, i * 2 + p);
      const dob = dobForIndex(i + p * 7);
      const stickyNote = pick(STICKY_NOTES, i);
      const status = pick(STATUSES, i);

      lines.push(`-- ${unitName} / ${shift}: ${lastName}, ${firstName}`);
      lines.push(`INSERT INTO patients (first_name, last_name, dob, sticky_note, unit_id, shift, status)
SELECT '${firstName.replace(/'/g, "''")}', '${lastName.replace(/'/g, "''")}', '${dob}', '${stickyNote.replace(/'/g, "''")}', u.id, '${shift}', '${status}'
FROM units u
WHERE u.name = '${unitName.replace(/'/g, "''")}'
  AND NOT EXISTS (
    SELECT 1 FROM patients p
    WHERE p.unit_id = u.id AND p.active = 1
      AND lower(p.first_name) = lower('${firstName.replace(/'/g, "''")}')
      AND lower(p.last_name) = lower('${lastName.replace(/'/g, "''")}')
      AND p.dob = '${dob}'
  );`);
      lines.push('');
    }
  }
}

lines.push('-- Visits for current month (admin user_id = 1)');
lines.push(`-- Month: ${month}`);
lines.push('');

patientIndex = 0;
for (const unitName of UNITS) {
  for (const shift of SHIFTS) {
    for (let p = 0; p < 3; p++) {
      const i = patientIndex++;
      const firstName = pick(FIRST_NAMES, i + p);
      const lastName = pick(LAST_NAMES, i * 2 + p);
      const dob = dobForIndex(i + p * 7);

      const visitCount = (i % 4) + 1;
      const dates = visitDatesForMonth(month, visitCount, i);
      let visitNum = 0;
      for (const visitDate of dates) {
        visitNum++;
        const monthlyNote = visitNum === 1 && i % 3 !== 0 ? 1 : 0;
        const seenOnHd = i % 5 !== 0 ? 1 : 0;
        const cipa = i % 2 === 0 ? 1 : 0;
        const visitLogged = 1;
        const notes = visitNum === 1 && stickyNoteFor(i) ? `'${stickyNoteFor(i).replace(/'/g, "''")}'` : "''";

        lines.push(`INSERT INTO visits (patient_id, user_id, visit_date, seen_on_hd, monthly_note, cipa, notes, visit_logged)
SELECT p.id, 1, '${visitDate}', ${seenOnHd}, ${monthlyNote}, ${cipa}, ${notes}, ${visitLogged}
FROM patients p
JOIN units u ON u.id = p.unit_id
WHERE u.name = '${unitName.replace(/'/g, "''")}'
  AND p.shift = '${shift}'
  AND lower(p.first_name) = lower('${firstName.replace(/'/g, "''")}')
  AND lower(p.last_name) = lower('${lastName.replace(/'/g, "''")}')
  AND p.dob = '${dob}'
  AND NOT EXISTS (
    SELECT 1 FROM visits v
    WHERE v.patient_id = p.id AND v.visit_date = '${visitDate}'
  );`);
      }
    }
  }
}

function stickyNoteFor(i) {
  const note = pick(STICKY_NOTES, i);
  return note ? `Round note: ${note}` : '';
}

const outPath = join(__dirname, 'seed-mock-data.sql');
writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${outPath} (${patientIndex} patients across ${UNITS.length} units)`);
