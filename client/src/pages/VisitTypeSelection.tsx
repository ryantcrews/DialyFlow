import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function VisitTypeSelection() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [selectedType, setSelectedType] = useState<'in-person' | 'telemedicine' | null>(null);

  const handleSelect = (type: 'in-person' | 'telemedicine') => {
    setSelectedType(type);
    localStorage.setItem('visitType', type);
    navigate('/unit-selection');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">DialyFlow</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName} ({user?.role})
              </span>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="btn btn-secondary"
                >
                  Admin Dashboard
                </button>
              )}
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Select Visit Type</h2>
          <p className="text-gray-600">Choose the type of visit for today's session</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => handleSelect('in-person')}
            className={`card hover:shadow-lg transition-shadow cursor-pointer ${
              selectedType === 'in-person' ? 'ring-4 ring-primary-500' : ''
            }`}
          >
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">In-Person Visit</h3>
              <p className="text-gray-600">
                Face-to-face patient consultations at the dialysis center
              </p>
            </div>
          </button>

          <button
            onClick={() => handleSelect('telemedicine')}
            className={`card hover:shadow-lg transition-shadow cursor-pointer ${
              selectedType === 'telemedicine' ? 'ring-4 ring-primary-500' : ''
            }`}
          >
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Telemedicine</h3>
              <p className="text-gray-600">
                Remote patient consultations via video or phone
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
