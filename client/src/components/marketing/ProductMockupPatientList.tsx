import { AppPreviewPatientList } from './AppPreviewPatientList';
import { PREVIEW_PATIENTS, PREVIEW_PATIENTS_COMPACT } from './previewData';

export function ProductMockupPatientList({
  size = 'default',
  showStatus = false,
  compact = false,
}: {
  size?: 'default' | 'large';
  showStatus?: boolean;
  compact?: boolean;
}) {
  void size;
  void showStatus;
  return (
    <AppPreviewPatientList
      patients={compact ? PREVIEW_PATIENTS_COMPACT : PREVIEW_PATIENTS}
      showSummary={!compact}
      compact={compact}
    />
  );
}
