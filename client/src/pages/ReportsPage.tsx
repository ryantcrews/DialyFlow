import { SHIFTS, currentMonthInClinic, type ComplianceRow, type Unit } from '@dialyrounds/shared';
import { useState } from 'react';
import { downloadCsv } from '../api/client';
import { ContextBar } from '../components/ContextBar';
import { MonthPicker } from '../components/DateRangePicker';
import { PatientListSkeleton } from '../components/Skeleton';
import { StatusChip } from '../components/StatusChip';
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
  const missingMonthly = rows.filter((r) => r.missingMonthlyNote).length;
  const unattested = rows.reduce((sum, r) => sum + r.unattestedVisitCount, 0);
  const attested = rows.reduce((sum, r) => sum + r.attestedVisitCount, 0);
  const complete = rows.filter((r) => !r.missingMonthlyNote && r.weeklyVisitCount >= 3).length;

  function attestationLabel(row: ComplianceRow): string {
    if (row.weeklyVisitCount === 0) return '—';
    if (row.unattestedVisitCount === 0) return 'Complete';
    return `${row.unattestedVisitCount} pending`;
  }

  return (
    <div className="stack">
      <ContextBar
        units={unitsData?.units ?? []}
        unitId={unitId}
        onUnitChange={setUnitId}
        shift={shift}
        onShiftChange={setShift}
      >
        <div className="context-bar-report-tools row">
          <MonthPicker value={month} onChange={setMonth} />
          <button
            className="btn btn-primary"
            type="button"
            disabled={!unitId}
            onClick={exportReport}
          >
            Export CSV
          </button>
        </div>
      </ContextBar>

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
            <p className="kpi-strip">
              <StatusChip variant="warning" label={`${missingMonthly} missing monthly`} />
              <StatusChip variant="pending" label={`${unattested} pending attest`} />
              <StatusChip variant="success" label={`${attested} attested`} />
              <StatusChip variant="success" label={`${complete} complete`} />
            </p>

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
                  {row.unattestedVisitCount > 0 && (
                    <StatusChip
                      variant="pending"
                      label={`${row.unattestedVisitCount} pending attest`}
                    />
                  )}
                  {row.weeklyVisitCount > 0 && row.unattestedVisitCount === 0 && (
                    <StatusChip variant="success" label="Attestation complete" />
                  )}
                  {row.missingMonthlyNote && <StatusChip variant="warning" label="Missing monthly" />}
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
                    <th>Attestation</th>
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
                      <td>{attestationLabel(row)}</td>
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
