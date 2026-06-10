export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-stack" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton-line" style={{ width: i === lines - 1 ? '70%' : '100%' }} />
      ))}
    </div>
  );
}

export function PatientListSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading patients">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}
