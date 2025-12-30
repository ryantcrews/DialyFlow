import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { patientService } from '../../services/patient.service';
import { adminService } from '../../services/admin.service';
import { Patient, Unit, Shift, PatientCreateDTO } from '@dialyflow/shared';

export default function AdminPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, watch } = useForm<PatientCreateDTO>();
  const selectedUnit = watch('unit');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      loadShifts(selectedUnit);
    }
  }, [selectedUnit]);

  const loadData = async () => {
    try {
      const [patientsData, unitsData] = await Promise.all([
        patientService.getAll(),
        adminService.getUnits(),
      ]);
      setPatients(patientsData);
      setUnits(unitsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async (unitId: string) => {
    try {
      const shiftsData = await adminService.getShifts(unitId);
      setShifts(shiftsData);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    }
  };

  const onSubmit = async (data: PatientCreateDTO) => {
    try {
      if (editingPatient) {
        await patientService.update(editingPatient._id, data);
      } else {
        await patientService.create(data);
      }
      setShowForm(false);
      setEditingPatient(null);
      reset();
      loadData();
    } catch (error) {
      console.error('Failed to save patient:', error);
      alert('Failed to save patient');
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    reset(patient);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this patient?')) return;
    
    try {
      await patientService.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete patient:', error);
      alert('Failed to delete patient');
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
              Patient Management
            </h1>
            <button onClick={() => navigate('/admin')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingPatient(null);
              reset({});
            }}
            className="btn btn-primary"
          >
            Add New Patient
          </button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h3 className="text-xl font-bold mb-4">
              {editingPatient ? 'Edit Patient' : 'Add New Patient'}
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
                  <label className="block font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    {...register('dateOfBirth', { required: true })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Medical Record Number</label>
                  <input {...register('medicalRecordNumber')} className="input" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Unit</label>
                  <select {...register('unit', { required: true })} className="input">
                    <option value="">Select Unit</option>
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Shift</label>
                  <select {...register('shift', { required: true })} className="input">
                    <option value="">Select Shift</option>
                    {shifts.map((shift) => (
                      <option key={shift._id} value={shift._id}>
                        {shift.name}
                      </option>
                    ))}
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
                    setEditingPatient(null);
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
          <h3 className="text-xl font-bold mb-4">All Patients</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">DOB</th>
                  <th className="text-left py-2">MRN</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient: any) => (
                  <tr key={patient._id} className="border-b">
                    <td className="py-2">
                      {patient.lastName}, {patient.firstName}
                    </td>
                    <td className="py-2">
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </td>
                    <td className="py-2">{patient.medicalRecordNumber || '-'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleEdit(patient)}
                        className="text-primary-600 hover:underline mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(patient._id)}
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
