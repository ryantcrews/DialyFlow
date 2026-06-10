import type { DateRangePreset } from '../utils/dateRange';
import { todayIsoDate } from '../utils/dateRange';

export function DateRangePicker({
  preset,
  start,
  end,
  onPresetChange,
  onRangeChange,
}: {
  preset: DateRangePreset;
  start: string;
  end: string;
  onPresetChange: (preset: DateRangePreset) => void;
  onRangeChange: (start: string, end: string) => void;
}) {
  return (
    <div className="date-range-picker">
      <span className="context-bar-filter-label">Date range</span>
      <div className="date-range-presets">
        <button
          type="button"
          className={`preset-pill${preset === 'today' ? ' preset-pill--active' : ''}`}
          onClick={() => onPresetChange('today')}
        >
          Today
        </button>
        <button
          type="button"
          className={`preset-pill${preset === 'week' ? ' preset-pill--active' : ''}`}
          onClick={() => onPresetChange('week')}
        >
          This week
        </button>
        <button
          type="button"
          className={`preset-pill${preset === 'custom' ? ' preset-pill--active' : ''}`}
          onClick={() => onPresetChange('custom')}
        >
          Custom
        </button>
      </div>
      {preset === 'custom' && (
        <div className="date-range-custom row">
          <div className="field">
            <label htmlFor="range-start">From</label>
            <input
              id="range-start"
              type="date"
              value={start}
              max={end || todayIsoDate()}
              onChange={(e) => onRangeChange(e.target.value, end)}
            />
          </div>
          <div className="field">
            <label htmlFor="range-end">To</label>
            <input
              id="range-end"
              type="date"
              value={end}
              min={start}
              max={todayIsoDate()}
              onChange={(e) => onRangeChange(start, e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function MonthPicker({
  value,
  onChange,
  id = 'month',
}: {
  value: string;
  onChange: (month: string) => void;
  id?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>Month</label>
      <input id={id} type="month" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
