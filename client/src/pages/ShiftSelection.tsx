import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import { Shift, Unit } from '@dialyflow/shared';

export default function ShiftSelection() {
  const navigate = useNavigate();
  const { unitId } = useParams<{ unitId: string }>();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (unitId) {
      loadData();
    }
  }, [unitId]);

  const loadData = async () => {
    try {
      const [shiftsData, unitData] = await Promise.all([
        adminService.getShifts(unitId),
        adminService.getUnit(unitId!),
      ]);
      setShifts(shiftsData);
      setUnit(unitData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectShift = (shiftId: string) => {
    navigate(`/patients/${unitId}/${shiftId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading shifts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">DialyFlow</h1>
            <button onClick={() => navigate('/unit-selection')} className="btn btn-secondary">
              Back to Units
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Select Shift</h2>
          <p className="text-gray-600">{unit?.name}</p>
        </div>

        <div className="space-y-4">
          {shifts.map((shift) => (
            <button
              key={shift._id}
              onClick={() => handleSelectShift(shift._id)}
              className="card hover:shadow-lg transition-shadow w-full text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{shift.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">{shift.code}</span>
                    {shift.days && shift.days.length > 0 && (
                      <span>{shift.days.join(', ')}</span>
                    )}
                    {shift.startTime && shift.endTime && (
                      <span>
                        {shift.startTime} - {shift.endTime}
                      </span>
                    )}
                  </div>
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
