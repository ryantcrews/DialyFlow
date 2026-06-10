import { SHIFTS, type Unit } from '@dialyrounds/shared';
import { useState } from 'react';
import { ApiClientError, api } from '../api/client';
import { useFetch } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { normalizeDate, parseCsv } from '../utils/csv';

export function ImportPage() {
  const { showToast } = useToast();
  const { data: unitsData } = useFetch<{ units: Unit[] }>('/api/units');
  const [unitId, setUnitId] = useState('');
  const [shift, setShift] = useState<string>(SHIFTS[0]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [firstCol, setFirstCol] = useState('0');
  const [lastCol, setLastCol] = useState('1');
  const [dobCol, setDobCol] = useState('2');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const step = result ? 3 : rows.length > 0 ? 2 : 1;

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result ?? ''));
      if (parsed.length === 0) return;
      setHeaders(parsed[0]);
      setRows(parsed.slice(1));
      setResult(null);
      setError(null);
    };
    reader.readAsText(file);
  }

  async function onImport() {
    if (!unitId) {
      setError('Select a unit');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payloadRows = rows
        .map((row) => {
          const firstName = row[Number(firstCol)]?.trim() ?? '';
          const lastName = row[Number(lastCol)]?.trim() ?? '';
          const dob = normalizeDate(row[Number(dobCol)] ?? '');
          if (!firstName || !lastName || !dob) return null;
          return { firstName, lastName, dob };
        })
        .filter(Boolean);

      const data = await api<{ added: number; skipped: number }>('/api/import', {
        method: 'POST',
        body: JSON.stringify({
          unitId: Number(unitId),
          shift,
          rows: payloadRows,
        }),
      });
      const message = `Added ${data.added} patients, skipped ${data.skipped} duplicates.`;
      setResult(message);
      showToast('Import complete');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="card stack">
        <div className="steps" aria-label="Import progress">
          <span className={`step-pill${step === 1 ? ' step-pill--active' : step > 1 ? ' step-pill--done' : ''}`}>
            1. Upload
          </span>
          <span className={`step-pill${step === 2 ? ' step-pill--active' : step > 2 ? ' step-pill--done' : ''}`}>
            2. Map columns
          </span>
          <span className={`step-pill${step === 3 ? ' step-pill--active step-pill--done' : ''}`}>3. Done</span>
        </div>
        <p className="meta">
          Save your Excel file as CSV, then upload it here. Existing patients are never updated.
        </p>
        <div className="row">
          <div className="field">
            <label>Target unit</label>
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
            <label>Target shift</label>
            <select value={shift} onChange={(e) => setShift(e.target.value)}>
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </div>

      {rows.length > 0 && (
        <div className="card stack">
          <h3 style={{ margin: 0 }}>Column mapping</h3>
          <div className="row">
            <div className="field">
              <label>First name column</label>
              <select value={firstCol} onChange={(e) => setFirstCol(e.target.value)}>
                {headers.map((header, index) => (
                  <option key={header + index} value={index}>
                    {header || `Column ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Last name column</label>
              <select value={lastCol} onChange={(e) => setLastCol(e.target.value)}>
                {headers.map((header, index) => (
                  <option key={header + index} value={index}>
                    {header || `Column ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>DOB column</label>
              <select value={dobCol} onChange={(e) => setDobCol(e.target.value)}>
                {headers.map((header, index) => (
                  <option key={header + index} value={index}>
                    {header || `Column ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={header + index}>{header || `Col ${index + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="error-text">{error}</p>}
          {result && <p className="banner badge-success">{result}</p>}
          <button className="btn btn-primary" type="button" disabled={loading} onClick={onImport}>
            {loading ? 'Importing…' : 'Confirm import'}
          </button>
        </div>
      )}
    </div>
  );
}
