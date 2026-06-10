import { SHIFTS, currentMonthInClinic, type ComplianceRow, type Unit } from '@dialyrounds/shared';
import { useState } from 'react';
import { downloadCsv } from '../api/client';
import { PatientListSkeleton } from '../components/Skeleton';
import { useFetch } from '../hooks/useApi';
import { useRouter } from '../hooks/useRouter';

function patientLink(row: ComplianceRow, month: string, unitId: string, shift: string): string {
  const params = new URLSearchParams({ month, unit: unitId, shift });
  return `/patients/${row.patientId}?${params.toString()}`;
}

export function ReportsPage() {
  const { navigate } = useRouter();
  const { data: unitsData } = useFetch<{ units: Unit[] }>('/api/units');
  const [unitId, setUnitId] = useState('');
  const [shift, setShift] = useState<string>(SHIFTS[0]);
  const [month, setMonth] = useState(currentMonthInClinic());

  const reportPath =
    unitId && shift
      ? `/api/reports/compliance?unit=${unitId}&shift=${encodeURIComponent(shift)}&month=${month}`
      : null;
  const { data, loading } = useFetch<{ month: string; rows: ComplianceRow[] }>(reportPath);

  async function exportReport() {
    if (!unitId) return;
    await downloadCsv(
      `/api/reports/compliance/export?unit=${unitId}&shift=${encodeURIComponent(shift)}&month=${month}`,
      `compliance-${month}.csv`
    );
  }

  const rows = data?.rows ?? [];

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row">
          <div className="field">
            <label>Unit</label>
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              <option value="">Select unit</option>
              {(unitsData?.units ?? []).map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Shift</label>
            <select value={shift} onChange={(e) => setShift(e.target.value)}>
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="button" disabled={!unitId} onClick={exportReport}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="card">
        {!unitId ? (
          <div className="empty-state">
            <p className="empty-state-title">Select a unit</p>
            <p className="empty-state-hint meta">Choose a unit to view monthly compliance.</p>
          </div>
        ) : loading ? (
          <PatientListSkeleton />
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No data</p>
            <p className="empty-state-hint meta">No patients match this unit and shift for {month}.</p>
          </div>
        ) : (
          <>
            <div className="report-cards report-cards-mobile">
              {rows.map((row) => (
                <button
                  key={row.patientId}
                  type="button"
                  className="report-card"
                  onClick={() => navigate(patientLink(row, month, unitId, shift))}
                >
                  <p className="report-card-name">
                    {row.lastName}, {row.firstName}
                  </p>
                  <span className="meta">DOB {row.dob}</span>
                  <span className="meta">
                    Monthly note: {row.monthlyNoteDone ? 'Yes' : 'No'} · Visits: {row.weeklyVisitCount}
                  </span>
                  {row.missingMonthlyNote && <span className="badge badge-warning">Missing monthly</span>}
                </button>
              ))}
            </div>

            <div className="table-wrap report-table-desktop">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>DOB</th>
                    <th>Monthly note</th>
                    <th>Visits</th>
                    <th>Missing monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.patientId}>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: 0, minHeight: 0 }}
                          onClick={() => navigate(patientLink(row, month, unitId, shift))}
                        >
                          {row.lastName}, {row.firstName}
                        </button>
                      </td>
                      <td>{row.dob}</td>
                      <td>{row.monthlyNoteDone ? 'Yes' : 'No'}</td>
                      <td>{row.weeklyVisitCount}</td>
                      <td>{row.missingMonthlyNote ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
