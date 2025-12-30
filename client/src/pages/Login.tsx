import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [error, setError] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [userId, setUserId] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError('');

      const result = await authService.login(data);

      if (result.data.requiresTwoFactor) {
        setUserId(result.data.userId);
        setShowTwoFactor(true);
      } else {
        setUser(result.data.user);
        setToken(result.data.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const result = await authService.verifyTwoFactor({
        userId,
        token: twoFactorCode,
      });

      setUser(result.data.user);
      setToken(result.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (showTwoFactor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full card">
          <h2 className="text-2xl font-bold text-center mb-6">Two-Factor Authentication</h2>
          
          <form onSubmit={handleTwoFactorSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Enter 6-digit code from Google Authenticator
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="input"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTwoFactor(false);
                setTwoFactorCode('');
                setError('');
              }}
              className="btn btn-secondary w-full mt-2"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">DialyFlow</h1>
          <p className="text-gray-600 mt-2">HIPAA-Compliant Dialysis Management</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="input"
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="input"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Default Admin Credentials:</p>
          <p className="font-mono">admin@dialyflow.com / Admin123!@#</p>
        </div>
      </div>
    </div>
  );
}
