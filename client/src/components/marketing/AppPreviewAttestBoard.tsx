import { StatusChip } from '../StatusChip';

type PreviewAttestVisit = {
  lastName: string;
  firstName: string;
  attested: boolean;
  visitMode: 'telemed' | 'in_person';
  noteType?: 'comprehensive' | 'basic';
};

const DEFAULT_VISITS: PreviewAttestVisit[] = [
  {
    lastName: 'Wilson',
    firstName: 'Linda',
    attested: true,
    visitMode: 'telemed',
    noteType: 'comprehensive',
  },
  {
    lastName: 'Martinez',
    firstName: 'James',
    attested: false,
    visitMode: 'in_person',
    noteType: 'basic',
  },
];

export function AppPreviewAttestBoard({
  compact = false,
  dateLabel = 'Monday, June 8, 2026',
  shift = 'MWF AM',
  unitName = 'North Dialysis Center',
  visits = DEFAULT_VISITS,
}: {
  compact?: boolean;
  dateLabel?: string;
  shift?: string;
  unitName?: string;
  visits?: PreviewAttestVisit[];
}) {
  return (
    <div className={`app-preview-panel app-preview-panel--attest${compact ? ' app-preview-panel--compact' : ''}`} aria-hidden="true">
      <div className="app-preview-toolbar">
        <span className="app-preview-toolbar-title">Batch attest</span>
        <span className="meta">{dateLabel.split(',')[1]?.trim() ?? dateLabel}</span>
      </div>
      <div className="app-preview-attest-meta">
        <span className="app-preview-attest-date">{dateLabel}</span>
        <span className="app-preview-filter">{shift}</span>
      </div>
      <section className="attest-location-bucket app-preview-location">
        <header className="attest-location-header">
          <h3 className="attest-location-title">{unitName}</h3>
          <span className="meta">1 shift</span>
        </header>
        <div className="attest-shift-buckets">
          <div className="attest-shift-bucket">
            <header className="attest-shift-bucket-header">
              <div className="attest-shift-bucket-title-row">
                <h4 className="attest-shift-bucket-title">{shift}</h4>
                <div className="context-summary">
                  {visits.some((v) => !v.attested) && (
                    <StatusChip
                      variant="pending"
                      label={`${visits.filter((v) => !v.attested).length} pending`}
                    />
                  )}
                  {visits.some((v) => v.attested) && (
                    <StatusChip
                      variant="success"
                      label={`${visits.filter((v) => v.attested).length} completed`}
                    />
                  )}
                </div>
              </div>
            </header>
            <ul className="attest-shift-visits">
              {visits.map((visit) => (
                <li key={`${visit.lastName}-${visit.firstName}`}>
                  <article
                    className={`attest-visit-card app-preview-attest-card${visit.attested ? ' attest-visit-card--signed' : ' attest-visit-card--pending'}`}
                  >
                    <div className="attest-visit-card-header">
                      <div>
                        <h4 className="attest-visit-card-name">
                          {visit.lastName}, {visit.firstName}
                        </h4>
                        <p className="meta">Note by Dr. Smith</p>
                      </div>
                      {visit.attested ? (
                        <StatusChip variant="success" label="Completed" />
                      ) : (
                        <StatusChip variant="pending" label="Pending sign-off" />
                      )}
                    </div>
                    <div className="attest-visit-chips">
                      <StatusChip
                        variant="neutral"
                        label={visit.noteType === 'comprehensive' ? 'Comprehensive' : 'Basic'}
                      />
                      <StatusChip variant="neutral" label="CIPA: Yes" />
                      <StatusChip variant="neutral" label="Seen on HD: Yes" />
                      <StatusChip
                        variant="neutral"
                        label={visit.visitMode === 'telemed' ? 'Telemed' : 'In person'}
                      />
                    </div>
                    {!visit.attested && (
                      <div className="attest-visit-card-actions">
                        <span className="btn btn-primary attest-sign-btn app-preview-sign-btn">
                          Note signed
                        </span>
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
