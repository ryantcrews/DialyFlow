export function StatusChip({
  label,
  variant = 'neutral',
}: {
  label: string;
  variant?: 'neutral' | 'pending' | 'success' | 'warning';
}) {
  return <span className={`status-chip status-chip--${variant}`}>{label}</span>;
}
