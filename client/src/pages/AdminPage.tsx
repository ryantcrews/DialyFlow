import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  ROLE_LABELS,
  USER_ROLES,
  type AuditLogEntry,
  type User,
  type UserRole,
} from '@dialyrounds/shared';
import { useMemo, useState } from 'react';
import { ApiClientError } from '../api/client';
import { mutate, useFetch } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';

function roleBadgeClass(role: UserRole): string {
  if (role === 'admin') return 'role-badge role-badge--admin';
  if (role === 'physician') return 'role-badge role-badge--physician';
  return 'role-badge role-badge--physician_assistant';
}

const ACTION_LABELS: Record<string, string> = {
  login: 'Signed in',
  logout: 'Signed out',
  login_failed: 'Failed sign-in',
  create_visit: 'Created note',
  update_visit: 'Updated note',
  create_patient: 'Added patient',
  update_patient: 'Updated patient',
  delete_patient: 'Removed patient',
  reassign_patient: 'Reassigned patient',
  update_status: 'Changed patient status',
  attest_visit: 'Attested visit',
  batch_attest: 'Batch attested',
  password_change: 'Changed password',
  create_user: 'Created user',
  update_user: 'Updated user',
  reset_password: 'Reset user password',
  import_patients: 'Imported patients',
  export_patients: 'Exported patients',
  export_compliance: 'Exported compliance report',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

function formatAuditDetails(details: string): string {
  if (!details.trim()) return '—';
  return details
    .split(';')
    .map((part) => {
      const eq = part.indexOf('=');
      if (eq === -1) return part;
      const key = part.slice(0, eq);
      const value = part.slice(eq + 1);
      return `${key}: ${value}`;
    })
    .join(' · ');
}

function formatAuditWhen(iso: string): string {
  const date = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ActivityLogPanel() {
  const [showAll, setShowAll] = useState(false);
  const path = showAll ? '/api/audit-log?all=1&limit=200' : '/api/audit-log?limit=200';
  const { data, loading } = useFetch<{ entries: AuditLogEntry[] }>(path);

  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Activity log</h3>
          <p className="meta">Sign-ins, notes, patient updates, and attestations by account.</p>
        </div>
        <label className="row meta" style={{ gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Show all events
        </label>
      </div>
      {loading ? (
        <p className="meta">Loading activity…</p>
      ) : entries.length === 0 ? (
        <p className="meta">No activity recorded yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Account</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="meta">{formatAuditWhen(entry.createdAt)}</td>
                  <td>
                    {entry.userName ?? 'Unknown'}
                    {entry.userEmail ? (
                      <div className="meta">{entry.userEmail}</div>
                    ) : null}
                  </td>
                  <td>{actionLabel(entry.action)}</td>
                  <td className="meta">{formatAuditDetails(entry.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const { showToast } = useToast();
  const { data, reload } = useFetch<{ users: User[] }>('/api/users');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('physician');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutate('/api/users', {
        method: 'POST',
        body: JSON.stringify({ email, name, role, password }),
      });
      setEmail('');
      setName('');
      setPassword('');
      showToast('User created');
      await reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not create user');
    }
  }

  async function toggleActive(user: User) {
    const action = user.active ? 'Deactivate' : 'Activate';
    if (!window.confirm(`${action} ${user.name}?`)) return;
    await mutate(`/api/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !user.active }),
    });
    showToast(user.active ? 'User deactivated' : 'User activated');
    await reload();
  }

  async function resetPassword(user: User) {
    if (!window.confirm(`Set a temporary password for ${user.email}?`)) return;
    const password = window.prompt(`Temporary password for ${user.email}`);
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      showToast(PASSWORD_REQUIREMENTS, 'error');
      return;
    }
    await mutate(`/api/users/${user.id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    showToast('Password reset — user must change on next login');
  }

  return (
    <div className="stack">
      <div className="card stack">
        <form className="stack" onSubmit={createUser}>
          <div className="row">
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Temporary password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={PASSWORD_MIN_LENGTH}
                required
              />
              <p className="meta">{PASSWORD_REQUIREMENTS}</p>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit">
            Create user
          </button>
        </form>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users ?? []).map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={roleBadgeClass(user.role)}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td>{user.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="row">
                      <button className="btn" type="button" onClick={() => void toggleActive(user)}>
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn" type="button" onClick={() => void resetPassword(user)}>
                        Reset password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ActivityLogPanel />
    </div>
  );
}
