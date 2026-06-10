import type { ReactNode } from 'react';

export function MoreMenu({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <button type="button" className="more-menu-backdrop" aria-label="Close menu" onClick={onClose} />
      <div className="more-menu-sheet" role="dialog" aria-label="More options">
        <div className="more-menu-header">
          <strong>More</strong>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="more-menu-items">{children}</div>
      </div>
    </>
  );
}
