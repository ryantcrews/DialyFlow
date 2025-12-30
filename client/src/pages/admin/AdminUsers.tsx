import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { adminService } from '../../services/admin.service';

interface UserForm {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor' | 'billing';
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset } = useForm<UserForm>();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserForm) => {
    try {
      if (editingUser) {
        await adminService.updateUser(editingUser._id, data);
      } else {
        await adminService.createUser(data);
      }
      setShowForm(false);
      setEditingUser(null);
      reset();
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    reset({ ...user, password: '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await adminService.deleteUser(id);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">
              User Management
            </h1>
            <button onClick={() => navigate('/admin')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingUser(null);
              reset({});
            }}
            className="btn btn-primary"
          >
            Add New User
          </button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h3 className="text-xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">First Name</label>
                  <input
                    {...register('firstName', { required: true })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Last Name</label>
                  <input
                    {...register('lastName', { required: true })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    type="email"
                    {...register('email', { required: true })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Password {editingUser && '(leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    {...register('password', { required: !editingUser })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Role</label>
                  <select {...register('role', { required: true })} className="input">
                    <option value="doctor">Doctor/PA</option>
                    <option value="billing">Billing</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    reset({});
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h3 className="text-xl font-bold mb-4">All Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b">
                    <td className="py-2">
                      {user.lastName}, {user.firstName}
                    </td>
                    <td className="py-2">{user.email}</td>
                    <td className="py-2 capitalize">{user.role}</td>
                    <td className="py-2">
                      {user.isActive ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:underline mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
