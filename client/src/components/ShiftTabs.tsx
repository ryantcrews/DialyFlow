import { SHIFTS } from '@dialyrounds/shared';

export function ShiftTabs({
  value,
  onChange,
  labelledBy,
}: {
  value: string;
  onChange: (shift: string) => void;
  labelledBy?: string;
}) {
  return (
    <div className="shift-tabs" role="tablist" aria-label="Shift" aria-labelledby={labelledBy}>
      {SHIFTS.map((s) => (
        <button
          key={s}
          type="button"
          role="tab"
          aria-selected={value === s}
          className={`shift-tab${value === s ? ' shift-tab--active' : ''}`}
          onClick={() => onChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
