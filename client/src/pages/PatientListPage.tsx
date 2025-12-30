import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientService } from '../services/patient.service';
import { Patient } from '@dialyflow/shared';

export default function PatientListPage() {
  const navigate = useNavigate();
  const { unitId, shiftId } = useParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [unitId, shiftId]);

  const loadPatients = async () => {
    try {
      const data = await patientService.getAll({
        unit: unitId,
        shift: shiftId,
      });
      setPatients(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(search.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(search.toLowerCase()) ||
      patient.medicalRecordNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">DialyFlow</h1>
            <button
              onClick={() => navigate(`/shift-selection/${unitId}`)}
              className="btn btn-secondary"
            >
              Back to Shifts
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Patient List</h2>
          <input
            type="text"
            placeholder="Search by name or MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input max-w-md"
          />
        </div>

        {filteredPatients.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No patients found for this shift.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <button
                key={patient._id}
                onClick={() => navigate(`/patient/${patient._id}`)}
                className="card hover:shadow-lg transition-shadow text-left cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {patient.lastName}, {patient.firstName}
                    </h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>
                        DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </span>
                      {patient.medicalRecordNumber && (
                        <span>MRN: {patient.medicalRecordNumber}</span>
                      )}
                      {patient.isManualEntry && (
                        <span className="text-orange-600 font-medium">
                          (Manual Entry)
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
        )}
      </div>
    </div>
  );
}
