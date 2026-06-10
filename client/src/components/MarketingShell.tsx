import { useEffect } from 'react';
import '../styles/marketing.css';
import { appLoginHref, marketingHref } from '../utils/routes';
import { useRouter } from '../hooks/useRouter';

export function MarketingShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { pathname } = useRouter();

  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    const content =
      import.meta.env.VITE_DEPLOY_ENV === 'development'
        ? 'noindex, nofollow, noai, noimageai'
        : 'index, follow';
    meta.setAttribute('content', content);
  }, [title]);

  return (
    <div className="marketing-shell">
      <header className="marketing-nav">
        <a className="marketing-logo" href={marketingHref('/')}>
          DialyRounds
        </a>
        <nav className="marketing-nav-links" aria-label="Marketing">
          <a
            className={`marketing-nav-link${pathname === '/' ? ' marketing-nav-link--active' : ''}`}
            href={marketingHref('/')}
          >
            Home
          </a>
          <a className="marketing-nav-link" href={`${marketingHref('/')}#features`}>
            Features
          </a>
          <a className="marketing-nav-link" href={`${marketingHref('/')}#how-it-works`}>
            How it works
          </a>
          <a
            className={`marketing-nav-link${pathname === '/security' ? ' marketing-nav-link--active' : ''}`}
            href={marketingHref('/security')}
          >
            Security
          </a>
          <a className="mkt-btn mkt-btn--primary marketing-login-btn" href={appLoginHref()}>
            Log in
          </a>
        </nav>
      </header>

      <main className="marketing-main">{children}</main>

      <footer className="marketing-footer">
        <div className="marketing-footer-grid">
          <div>
            <a className="marketing-logo" href={marketingHref('/')}>
              DialyRounds
            </a>
            <p className="marketing-footer-tagline">
              Dialysis rounds, visit logging, and batch attestation.
            </p>
          </div>
          <nav className="marketing-footer-nav" aria-label="Footer">
            <div className="marketing-footer-col">
              <p className="marketing-footer-col-title">Product</p>
              <a href={`${marketingHref('/')}#features`}>Features</a>
              <a href={appLoginHref()}>Log in</a>
            </div>
            <div className="marketing-footer-col">
              <p className="marketing-footer-col-title">Legal</p>
              <a href={marketingHref('/security')}>Security</a>
              <a href={marketingHref('/privacy')}>Privacy</a>
            </div>
          </nav>
        </div>
        <p className="marketing-footer-bottom">&copy; {new Date().getFullYear()} DialyRounds</p>
      </footer>
    </div>
  );
}
