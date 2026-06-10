/** Update placeholder stats and testimonial before production marketing. */

export const DEMO_EMAIL = 'demo@dialyrounds.com';

export function demoMailtoHref(): string {
  return `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent('DialyRounds demo request')}`;
}

export const HERO = {
  eyebrow: 'Dialysis clinical workflow',
  title: 'Dialysis rounds, documentation, and sign-off — all in one workflow.',
  lead:
    'Replace spreadsheets, scattered notes, and manual attestations with a system built specifically for dialysis teams.',
};

export const SOCIAL_PROOF = {
  headline: 'Trusted by dialysis teams across 12 facilities · 250+ providers',
};

/** Placeholder testimonial — replace with real quote when available. */
export const TESTIMONIAL = {
  quote: 'Saved our physicians hours each week during morning rounds and end-of-day attestation.',
  attribution: 'Medical Director, Multi-unit dialysis group',
};

export const STATS = [
  { value: '250+', label: 'Providers' },
  { value: '10,000+', label: 'Patient visits logged' },
  { value: '99.9%', label: 'Availability' },
  { value: '3 mins', label: 'Avg daily sign-off' },
] as const;

export type FeatureIcon =
  | 'list'
  | 'clipboard'
  | 'attest'
  | 'chart'
  | 'import'
  | 'shield';

export const FEATURES: {
  icon: FeatureIcon;
  label: string;
  title: string;
  body: string;
  metric: string;
}[] = [
  {
    icon: 'list',
    label: 'Rounds',
    title: 'Shift-based patient lists',
    body: 'Browse patients by unit and shift with monthly and weekly progress at a glance.',
    metric: '↗ Faster morning rounds',
  },
  {
    icon: 'clipboard',
    label: 'Documentation',
    title: 'Visit logging',
    body: 'Notes, CIPA, seen-on-HD, and assessments from any device on the floor.',
    metric: '↗ Less note chasing',
  },
  {
    icon: 'attest',
    label: 'Sign-off',
    title: 'Batch attest',
    body: 'Sign off a full day by location and shift in one pass.',
    metric: '↗ One-click daily sign-off',
  },
  {
    icon: 'chart',
    label: 'Compliance',
    title: 'Compliance reporting',
    body: 'Track note completion and outstanding attestations with export.',
    metric: '↗ Clear audit visibility',
  },
  {
    icon: 'import',
    label: 'Data',
    title: 'Import & export',
    body: 'Bulk patient import and data export for reporting workflows.',
    metric: '↗ Streamlined onboarding',
  },
  {
    icon: 'shield',
    label: 'Access',
    title: 'Role-based access',
    body: 'Separate permissions for admins, physicians, and physician assistants.',
    metric: '↗ Minimum-necessary access',
  },
];

export const WORKFLOW_STEPS = [
  {
    title: 'Build patient list',
    body: 'Filter by unit, shift, and month. See who still needs notes or visits.',
  },
  {
    title: 'Log visits',
    body: 'Record notes and assessments on the floor — mobile-first for quick rounds.',
  },
  {
    title: 'Batch attest',
    body: 'Sign off by location and shift. Telemed or in-person locks at sign-off.',
  },
] as const;

export const SECURITY_BADGES = [
  {
    title: 'Audit logging',
    body: 'Login and clinical actions recorded with timestamps and client IP.',
  },
  {
    title: 'Role-based access',
    body: 'Separate permissions for admins, physicians, and PAs.',
  },
  {
    title: 'Session security',
    body: 'HttpOnly cookies, SameSite=Strict, and API isolation on the app subdomain.',
  },
  {
    title: 'HIPAA-conscious design',
    body: 'Built for secure deployment; Enterprise BAA required before real PHI.',
  },
] as const;

export const FINAL_CTA = {
  title: 'Simplify dialysis rounds.',
  lead: 'Built for providers, physician assistants, and administrators who need accurate documentation without spreadsheet chaos.',
};

export const HERO_STATS = {
  label: 'Note progress · MWF AM',
};
