import { isClinicalRole, ROLE_LABELS } from '@dialyrounds/shared';
import { useEffect, useRef, useState } from 'react';
import { MoreMenu } from './components/MoreMenu';
import { useAuth } from './hooks/useAuth';
import { useRouter } from './hooks/useRouter';
import { AdminPage } from './pages/AdminPage';
import { AttestPage } from './pages/AttestPage';
import { ChangePasswordPage, LoginPage } from './pages/AuthPages';
import { ImportPage } from './pages/ImportPage';
import { MainPage } from './pages/MainPage';
import { PatientPage } from './pages/PatientPage';
import { ReportsPage } from './pages/ReportsPage';
import { formatDisplayDate } from './utils/dateRange';

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/patients/')) return 'Patient detail';
  if (pathname === '/attest') return 'Batch attest';
  if (pathname === '/import') return 'Import patients';
  if (pathname === '/reports') return 'Compliance report';
  if (pathname === '/admin') return 'User management';
  return 'Patient list';
}

function pageSubtitle(pathname: string, searchParams: URLSearchParams): string | null {
  if (pathname === '/') {
    const shift = searchParams.get('shift');
    const month = searchParams.get('month');
    if (shift && month) return `${shift} · ${month}`;
  }
  if (pathname === '/attest') {
    const date = searchParams.get('date');
    if (date) return formatDisplayDate(date);
    return 'Sign-off inbox';
  }
  if (pathname.startsWith('/patients/')) {
    const month = searchParams.get('month');
    return month ? `Notes for ${month}` : null;
  }
  return null;
}

function navClass(active: boolean): string {
  return `btn btn-ghost${active ? ' nav-active' : ''}`;
}

export function App() {
  const { user, loading, logout } = useAuth();
  const { pathname, searchParams, navigate } = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const chromeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chrome = chromeRef.current;
    if (!chrome) return;

    const syncStickyTop = () => {
      document.documentElement.style.setProperty(
        '--shell-sticky-top',
        `${chrome.getBoundingClientRect().height}px`,
      );
    };

    syncStickyTop();
    const observer = new ResizeObserver(syncStickyTop);
    observer.observe(chrome);
    window.addEventListener('resize', syncStickyTop);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncStickyTop);
    };
  }, [pathname, searchParams.toString()]);

  if (loading) {
    return (
      <div className="content">
        <div className="skeleton-card" style={{ height: 120 }} aria-busy="true" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.mustChangePassword) {
    return (
      <div className="app-shell">
        <div className="app-chrome" ref={chromeRef}>
          <header className="topbar">
            <h1>DialyRounds</h1>
          </header>
        </div>
        <ChangePasswordPage />
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const canImport = isAdmin || isClinicalRole(user.role);
  const canAttest = isAdmin || isClinicalRole(user.role);

  let page = <MainPage />;
  if (pathname.startsWith('/patients/')) page = <PatientPage />;
  else if (pathname === '/attest') page = canAttest ? <AttestPage /> : <MainPage />;
  else if (pathname === '/import') page = canImport ? <ImportPage /> : <MainPage />;
  else if (pathname === '/reports') page = isAdmin ? <ReportsPage /> : <MainPage />;
  else if (pathname === '/admin') page = isAdmin ? <AdminPage /> : <MainPage />;

  const title = pageTitle(pathname);
  const subtitle = pageSubtitle(pathname, searchParams);

  function go(path: string) {
    setMoreOpen(false);
    navigate(path);
  }

  const moreActive =
    pathname === '/import' || pathname === '/reports' || pathname === '/admin';

  return (
    <div className="app-shell">
      <div className="app-chrome" ref={chromeRef}>
        <header className="topbar">
          <div className="topbar-brand">
            <h1>DialyRounds</h1>
            <span className="topbar-user meta">
              {user.name} · {ROLE_LABELS[user.role]}
            </span>
          </div>
          <nav className="topbar-actions topbar-actions--desktop" aria-label="Main">
            <button
              className={navClass(pathname === '/')}
              type="button"
              onClick={() => navigate('/')}
            >
              Patients
            </button>
            {canAttest && (
              <button
                className={navClass(pathname === '/attest')}
                type="button"
                onClick={() => navigate('/attest')}
              >
                Attest
              </button>
            )}
            {canImport && (
              <button
                className={navClass(pathname === '/import')}
                type="button"
                onClick={() => navigate('/import')}
              >
                Import
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  className={navClass(pathname === '/reports')}
                  type="button"
                  onClick={() => navigate('/reports')}
                >
                  Reports
                </button>
                <button
                  className={navClass(pathname === '/admin')}
                  type="button"
                  onClick={() => navigate('/admin')}
                >
                  Users
                </button>
              </>
            )}
            <button className="btn btn-ghost" type="button" onClick={() => void logout()}>
              Logout
            </button>
          </nav>
        </header>

        <div className="page-header">
          <h2 className="page-header-title">{title}</h2>
          {subtitle && <p className="page-header-sub meta">{subtitle}</p>}
        </div>
      </div>

      <main className="content">{page}</main>

      <nav className="bottom-nav" aria-label="Mobile">
        <button
          className={`bottom-nav-item${pathname === '/' ? ' bottom-nav-item--active' : ''}`}
          type="button"
          onClick={() => navigate('/')}
        >
          Patients
        </button>
        {canAttest && (
          <button
            className={`bottom-nav-item${pathname === '/attest' ? ' bottom-nav-item--active' : ''}`}
            type="button"
            onClick={() => navigate('/attest')}
          >
            Attest
          </button>
        )}
        {canImport && !isAdmin && (
          <button
            className={`bottom-nav-item${pathname === '/import' ? ' bottom-nav-item--active' : ''}`}
            type="button"
            onClick={() => navigate('/import')}
          >
            Import
          </button>
        )}
        <button
          className={`bottom-nav-item${moreActive || moreOpen ? ' bottom-nav-item--active' : ''}`}
          type="button"
          onClick={() => setMoreOpen(true)}
        >
          More
        </button>
      </nav>

      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)}>
        {canImport && isAdmin && (
          <button className="more-menu-link" type="button" onClick={() => go('/import')}>
            Import
          </button>
        )}
        {isAdmin && (
          <>
            <button className="more-menu-link" type="button" onClick={() => go('/reports')}>
              Reports
            </button>
            <button className="more-menu-link" type="button" onClick={() => go('/admin')}>
              Users
            </button>
          </>
        )}
        {!isAdmin && canImport && pathname !== '/import' && (
          <button className="more-menu-link" type="button" onClick={() => go('/import')}>
            Import
          </button>
        )}
        <button
          className="more-menu-link"
          type="button"
          onClick={() => {
            setMoreOpen(false);
            void logout();
          }}
        >
          Logout
        </button>
      </MoreMenu>
    </div>
  );
}
