import api from './api';
import { LoginCredentials, TwoFactorVerify, AuthUser } from '@dialyflow/shared';

export const authService = {
  async login(credentials: LoginCredentials) {
    const { data } = await api.post('/auth/login', credentials);
    if (data.data.token) {
      localStorage.setItem('token', data.data.token);
    }
    return data;
  },

  async verifyTwoFactor(verify: TwoFactorVerify) {
    const { data } = await api.post('/auth/verify-2fa', verify);
    if (data.data.token) {
      localStorage.setItem('token', data.data.token);
    }
    return data;
  },

  async setupTwoFactor() {
    const { data } = await api.post('/auth/setup-2fa');
    return data;
  },

  async enableTwoFactor(token: string) {
    const { data } = await api.post('/auth/enable-2fa', { token });
    return data;
  },

  async disableTwoFactor() {
    const { data } = await api.post('/auth/disable-2fa');
    return data;
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get('/auth/me');
    return data.data;
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },
};
