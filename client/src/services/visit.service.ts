import api from './api';
import { Visit, VisitCreateDTO, VisitUpdateDTO } from '@dialyflow/shared';

export const visitService = {
  async getAll(params?: {
    patient?: string;
    unit?: string;
    shift?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Visit[]> {
    const { data } = await api.get('/visits', { params });
    return data.data;
  },

  async getById(id: string): Promise<Visit> {
    const { data } = await api.get(`/visits/${id}`);
    return data.data;
  },

  async getPatientVisits(patientId: string): Promise<Visit[]> {
    const { data } = await api.post('/visits/patient', { patientId });
    return data.data;
  },

  async create(visit: VisitCreateDTO): Promise<Visit> {
    const { data } = await api.post('/visits', visit);
    return data.data;
  },

  async update(id: string, visit: VisitUpdateDTO): Promise<Visit> {
    const { data } = await api.put(`/visits/${id}`, visit);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/visits/${id}`);
  },
};

export const commentService = {
  async getByVisit(visitId: string) {
    const { data } = await api.get(`/comments/visit/${visitId}`);
    return data.data;
  },

  async create(comment: { visit: string; patient: string; text: string }) {
    const { data } = await api.post('/comments', comment);
    return data.data;
  },

  async update(id: string, text: string) {
    const { data } = await api.put(`/comments/${id}`, { text });
    return data.data;
  },

  async delete(id: string) {
    await api.delete(`/comments/${id}`);
  },
};
