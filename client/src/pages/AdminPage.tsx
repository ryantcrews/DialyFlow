import type { User } from '@dialyrounds/shared';
import { useState } from 'react';
import { ApiClientError, api } from '../api/client';
import { mutate, useFetch } from '../hooks/useApi';

export function AdminPage() {
  const { data, reload } = useFetch<{ users: User[] }>('/api/users');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'clinician'>('clinician');
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
      await reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not create user');
    }
  }

  async function toggleActive(user: User) {
    await mutate(`/api/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !user.active }),
    });
    await reload();
  }

  async function resetPassword(user: User) {
    const password = window.prompt(`Temporary password for ${user.email}`);
    if (!password || password.length < 8) return;
    await mutate(`/api/users/${user.id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    window.alert('Password reset. User must change it on next login.');
  }

  return (
    <div className="stack">
      <div className="card stack">
        <h2 style={{ margin: 0 }}>User management</h2>
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
              <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'clinician')}>
                <option value="clinician">Clinician</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="field">
              <label>Temporary password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
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
                  <td>{user.role}</td>
                  <td>{user.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="row">
                      <button className="btn" type="button" onClick={() => toggleActive(user)}>
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn" type="button" onClick={() => resetPassword(user)}>
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
    </div>
  );
}
