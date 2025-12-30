import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { adminService } from '../../services/admin.service';
import { Unit, Shift } from '@dialyflow/shared';

interface ExportForm {
  startDate: string;
  endDate: string;
  format: 'excel' | 'csv';
  units: string[];
  shifts: string[];
}

export default function AdminExport() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm<ExportForm>({
    defaultValues: {
      format: 'excel',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [unitsData, shiftsData] = await Promise.all([
        adminService.getUnits(),
        adminService.getShifts(),
      ]);
      setUnits(unitsData);
      setShifts(shiftsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onSubmit = async (data: ExportForm) => {
    try {
      setLoading(true);
      await adminService.exportData({
        startDate: data.startDate,
        endDate: data.endDate,
        format: data.format,
        units: data.units?.filter(Boolean),
        shifts: data.shifts?.filter(Boolean),
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">
              Export Data
            </h1>
            <button onClick={() => navigate('/admin')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Export Visit Data</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  {...register('startDate', { required: true })}
                  className="input"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">End Date</label>
                <input
                  type="date"
                  {...register('endDate', { required: true })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Export Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="excel"
                    {...register('format')}
                    className="w-4 h-4"
                  />
                  <span>Excel (.xlsx)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="csv"
                    {...register('format')}
                    className="w-4 h-4"
                  />
                  <span>CSV</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">
                Filter by Units (optional)
              </label>
              <div className="space-y-2">
                {units.map((unit) => (
                  <label key={unit._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={unit._id}
                      {...register('units')}
                      className="w-4 h-4"
                    />
                    <span>{unit.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">
                Filter by Shifts (optional)
              </label>
              <div className="space-y-2">
                {shifts.map((shift) => (
                  <label key={shift._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={shift._id}
                      {...register('shifts')}
                      className="w-4 h-4"
                    />
                    <span>{shift.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-medium mb-2">Export Information</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Export includes patient visit data for the selected date range</li>
                <li>• Comments are excluded from exports for privacy</li>
                <li>• File will download automatically when ready</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Exporting...' : 'Export Data'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
