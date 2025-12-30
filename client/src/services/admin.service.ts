import api from './api';
import { Unit, Shift } from '@dialyflow/shared';

export const adminService = {
  // Units
  async getUnits(): Promise<Unit[]> {
    const { data } = await api.get('/units');
    return data.data;
  },

  async getUnit(id: string): Promise<Unit> {
    const { data } = await api.get(`/units/${id}`);
    return data.data;
  },

  // Shifts
  async getShifts(unitId?: string): Promise<Shift[]> {
    const params = unitId ? { unit: unitId } : {};
    const { data } = await api.get('/shifts', { params });
    return data.data;
  },

  async getShift(id: string): Promise<Shift> {
    const { data } = await api.get(`/shifts/${id}`);
    return data.data;
  },

  // Users
  async getUsers() {
    const { data } = await api.get('/admin/users');
    return data.data;
  },

  async getUser(id: string) {
    const { data } = await api.get(`/admin/users/${id}`);
    return data.data;
  },

  async createUser(user: any) {
    const { data } = await api.post('/admin/users', user);
    return data.data;
  },

  async updateUser(id: string, user: any) {
    const { data } = await api.put(`/admin/users/${id}`, user);
    return data.data;
  },

  async deleteUser(id: string) {
    await api.delete(`/admin/users/${id}`);
  },

  // Export
  async exportData(params: {
    startDate: string;
    endDate: string;
    format: 'excel' | 'csv';
    units?: string[];
    shifts?: string[];
  }) {
    const response = await api.post('/admin/export', params, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `dialyflow-export-${Date.now()}.${params.format === 'excel' ? 'xlsx' : 'csv'}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
