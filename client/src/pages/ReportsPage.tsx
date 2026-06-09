import { SHIFTS, currentMonthInClinic, type ComplianceRow, type Unit } from '@dialyrounds/shared';
import { useState } from 'react';
import { downloadCsv } from '../api/client';
import { useFetch } from '../hooks/useApi';

export function ReportsPage() {
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

  return (
    <div className="stack">
      <div className="card stack">
        <h2 style={{ margin: 0 }}>Monthly compliance report</h2>
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
          <p className="meta">Select a unit to view the report.</p>
        ) : loading ? (
          <p className="meta">Loading report…</p>
        ) : (
          <div className="table-wrap">
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
                {(data?.rows ?? []).map((row) => (
                  <tr key={row.patientId}>
                    <td>
                      {row.lastName}, {row.firstName}
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
        )}
      </div>
    </div>
  );
}
