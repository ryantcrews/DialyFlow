import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import { Unit } from '@dialyflow/shared';

export default function UnitSelection() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const data = await adminService.getUnits();
      setUnits(data);
    } catch (error) {
      console.error('Failed to load units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUnit = (unitId: string) => {
    navigate(`/shift-selection/${unitId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading units...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">DialyFlow</h1>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Select Dialysis Unit</h2>
          <p className="text-gray-600">Choose the facility you'll be working at today</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <button
              key={unit._id}
              onClick={() => handleSelectUnit(unit._id)}
              className="card hover:shadow-xl transition-all cursor-pointer text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{unit.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">Code: {unit.code}</p>
                  {unit.address && (
                    <p className="text-sm text-gray-600">{unit.address}</p>
                  )}
                  {unit.phone && (
                    <p className="text-sm text-gray-600">{unit.phone}</p>
                  )}
                </div>
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
