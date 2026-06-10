import type { Unit } from '@dialyrounds/shared';
import type { ReactNode } from 'react';
import { ShiftTabs } from './ShiftTabs';

export function ContextBar({
  units,
  unitId,
  onUnitChange,
  shift,
  onShiftChange,
  children,
  summary,
}: {
  units: Unit[];
  unitId: string;
  onUnitChange: (unitId: string) => void;
  shift: string;
  onShiftChange: (shift: string) => void;
  children?: ReactNode;
  summary?: ReactNode;
}) {
  return (
    <div className="context-bar card">
      <div className="context-bar-top">
        <div className="field context-bar-location">
          <label htmlFor="context-unit">Location</label>
          <select id="context-unit" value={unitId} onChange={(e) => onUnitChange(e.target.value)}>
            <option value="">Select unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
        {summary ? <div className="context-summary">{summary}</div> : null}
      </div>

      <div className="context-bar-filters">
        <div className="context-bar-filter">
          <span className="context-bar-filter-label" id="context-shift-label">
            Shift
          </span>
          <ShiftTabs value={shift} onChange={onShiftChange} labelledBy="context-shift-label" />
        </div>
        {children ? <div className="context-bar-filter context-bar-filter--secondary">{children}</div> : null}
      </div>
    </div>
  );
}
