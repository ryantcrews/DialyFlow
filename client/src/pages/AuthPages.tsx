import { currentMonthInClinic, SHIFTS } from '@dialyrounds/shared';
import { useState } from 'react';
import { ApiClientError, api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { refresh } = useAuth();
  const [email, setEmail] = useState('admin@dialyrounds.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content">
      <div className="card stack" style={{ maxWidth: 420, margin: '4rem auto' }}>
        <div>
          <h2 style={{ margin: 0 }}>DialyRounds</h2>
          <p className="meta">Sign in to manage dialysis rounds</p>
        </div>
        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {import.meta.env.DEV && (
          <p className="meta">Default admin: admin@dialyrounds.local / ChangeMe123!</p>
        )}
      </div>
    </div>
  );
}

export function ChangePasswordPage() {
  const { refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content">
      <div className="card stack">
        <h2 style={{ margin: 0 }}>Change your password</h2>
        <p className="meta">You must set a new password before continuing.</p>
        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="current">Current password</label>
            <input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new">New password</label>
            <input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}

export { SHIFTS, currentMonthInClinic };
