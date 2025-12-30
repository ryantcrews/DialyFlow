import api from './api';
import { Patient, PatientCreateDTO, PatientUpdateDTO } from '@dialyflow/shared';

export const patientService = {
  async getAll(params?: {
    unit?: string;
    shift?: string;
    search?: string;
  }): Promise<Patient[]> {
    const { data } = await api.get('/patients', { params });
    return data.data;
  },

  async getById(id: string): Promise<Patient> {
    const { data } = await api.get(`/patients/${id}`);
    return data.data;
  },

  async create(patient: PatientCreateDTO): Promise<Patient> {
    const { data } = await api.post('/patients', patient);
    return data.data;
  },

  async update(id: string, patient: PatientUpdateDTO): Promise<Patient> {
    const { data } = await api.put(`/patients/${id}`, patient);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },
};
