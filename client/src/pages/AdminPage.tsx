import { ROLE_LABELS, USER_ROLES, type User, type UserRole } from '@dialyrounds/shared';

import { useState } from 'react';

import { ApiClientError, api } from '../api/client';

import { mutate, useFetch } from '../hooks/useApi';

import { useToast } from '../hooks/useToast';



function roleBadgeClass(role: UserRole): string {

  if (role === 'admin') return 'role-badge role-badge--admin';

  if (role === 'physician') return 'role-badge role-badge--physician';

  return 'role-badge role-badge--physician_assistant';

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

    if (!password || password.length < 8) return;

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

                  <td>

                    <span className={roleBadgeClass(user.role)}>{ROLE_LABELS[user.role] ?? user.role}</span>

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

    </div>

  );

}


