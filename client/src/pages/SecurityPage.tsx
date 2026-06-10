import { PASSWORD_MIN_LENGTH } from '@dialyrounds/shared';
import { MarketingShell } from '../components/MarketingShell';
import { marketingHref } from '../utils/routes';

export function SecurityPage() {
  return (
    <MarketingShell title="Security — DialyRounds">
      <article className="marketing-article card stack">
        <header>
          <h1>Security &amp; HIPAA</h1>
          <p className="meta">
            Technical safeguards built into DialyRounds and what your organization must do before
            storing real patient health information.
          </p>
        </header>

        <section className="stack">
          <h2>What DialyRounds implements</h2>
          <ul className="marketing-list">
            <li>
              <strong>Role-based access</strong> — Admin, physician, and physician assistant roles
              enforced on every API route.
            </li>
            <li>
              <strong>Authentication</strong> — Passwords hashed with PBKDF2-SHA256 (100,000
              iterations). Minimum {PASSWORD_MIN_LENGTH} characters with a letter and a number.
              Sessions use HttpOnly, Secure, SameSite=Strict cookies.
            </li>
            <li>
              <strong>Session controls</strong> — 24-hour maximum session, 1-hour idle timeout,
              server-side revocation on logout.
            </li>
            <li>
              <strong>Login protection</strong> — Account lockout after repeated failed attempts;
              login events audited with client IP.
            </li>
            <li>
              <strong>Audit logging</strong> — Clinical and administrative actions recorded with
              user, action, entity, and timestamp.
            </li>
            <li>
              <strong>Data integrity</strong> — Attested visits cannot be edited. Telemed/in-person
              mode is saved and locked at sign-off.
            </li>
            <li>
              <strong>Transport security</strong> — HTTPS via Cloudflare; security headers and
              no-store caching on API responses.
            </li>
            <li>
              <strong>API isolation</strong> — Patient data APIs exist only on{' '}
              <code>app.dialyrounds.com</code>, require a valid session, and block cross-origin
              writes from other sites.
            </li>
            <li>
              <strong>App isolation</strong> — Clinical app on <code>app.dialyrounds.com</code>,
              excluded from search engine indexing.
            </li>
          </ul>
        </section>

        <section className="stack">
          <h2>HIPAA technical safeguards</h2>
          <p>
            DialyRounds is designed with HIPAA Security Rule technical safeguards in mind:
          </p>
          <ul className="marketing-list">
            <li>
              <strong>Access control</strong> — Role-based permissions for clinical vs admin
              functions.
            </li>
            <li>
              <strong>Audit controls</strong> — Persistent audit log for authentication and clinical
              workflows.
            </li>
            <li>
              <strong>Integrity</strong> — Signed-off visits and attestation modes are locked.
            </li>
            <li>
              <strong>Authentication</strong> — Strong password policy and server-managed sessions.
            </li>
            <li>
              <strong>Transmission security</strong> — TLS and hardened HTTP response headers.
            </li>
          </ul>
          <p>
            <strong>DialyRounds is not HIPAA-certified.</strong> Compliance is a shared
            responsibility between the platform and your covered entity.
          </p>
        </section>

        <section className="stack">
          <h2>Known limitations</h2>
          <ul className="marketing-list">
            <li>No multi-factor authentication in the current release.</li>
            <li>
              All authenticated clinicians can open any active patient record by ID (single-practice
              model).
            </li>
            <li>Audit log retention and export are not automated — your organization must define a policy.</li>
            <li>Database backups require a documented operational procedure.</li>
          </ul>
        </section>

        <section className="stack">
          <h2>Before storing real PHI</h2>
          <ul className="marketing-list">
            <li>Execute a Cloudflare Enterprise Business Associate Agreement (BAA) for Workers and D1.</li>
            <li>Complete a risk assessment and adopt privacy, security, and breach notification policies.</li>
            <li>Sign BAAs with any additional subprocessors that handle PHI.</li>
            <li>Bootstrap production with a strong admin password — never use default dev credentials.</li>
            <li>Establish D1 backup and data retention procedures.</li>
            <li>Train workforce members on acceptable use and minimum necessary access.</li>
          </ul>
        </section>

        <p className="meta">
          See also our <a href={marketingHref('/privacy')}>Privacy Policy</a>. For deployment
          questions, contact your organization&apos;s DialyRounds administrator.
        </p>
      </article>
    </MarketingShell>
  );
}
