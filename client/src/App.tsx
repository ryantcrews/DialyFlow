import { useAuth } from './hooks/useAuth';
import { useRouter } from './hooks/useRouter';
import { AdminPage } from './pages/AdminPage';
import { ChangePasswordPage, LoginPage } from './pages/AuthPages';
import { ImportPage } from './pages/ImportPage';
import { MainPage } from './pages/MainPage';
import { PatientPage } from './pages/PatientPage';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  const { user, loading, logout } = useAuth();
  const { pathname, navigate } = useRouter();

  if (loading) {
    return (
      <div className="content">
        <p className="meta">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.mustChangePassword) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <h1>DialyRounds</h1>
        </header>
        <ChangePasswordPage />
      </div>
    );
  }

  let page = <MainPage />;
  if (pathname.startsWith('/patients/')) page = <PatientPage />;
  else if (pathname === '/import') page = <ImportPage />;
  else if (pathname === '/reports') page = <ReportsPage />;
  else if (pathname === '/admin') page = <AdminPage />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>DialyRounds</h1>
        <div className="topbar-actions">
          <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}>
            Patients
          </button>
          {user.role === 'admin' && (
            <>
              <button className="btn btn-ghost" type="button" onClick={() => navigate('/import')}>
                Import
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => navigate('/reports')}>
                Reports
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => navigate('/admin')}>
                Users
              </button>
            </>
          )}
          <button className="btn btn-ghost" type="button" onClick={() => void logout()}>
            Logout
          </button>
        </div>
      </header>
      <main className="content">{page}</main>
    </div>
  );
}
