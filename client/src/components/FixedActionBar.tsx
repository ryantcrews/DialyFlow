import type { ReactNode } from 'react';

export function FixedActionBar({ children }: { children: ReactNode }) {
  return <div className="fixed-action-bar">{children}</div>;
}
