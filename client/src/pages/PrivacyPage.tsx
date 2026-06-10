import { MarketingShell } from '../components/MarketingShell';

export function PrivacyPage() {
  return (
    <MarketingShell title="Privacy — DialyRounds">
      <article className="marketing-article card stack">
        <h1>Privacy Policy</h1>
        <p className="meta">Last updated: June 2026</p>
        <p>
          This page is a placeholder. Your organization should publish a privacy policy that
          describes how patient health information is collected, used, stored, and protected when
          using DialyRounds.
        </p>
        <p className="meta">
          Contact your administrator or legal counsel to finalize this policy before go-live with
          real PHI.
        </p>
      </article>
    </MarketingShell>
  );
}
