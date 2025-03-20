import { User } from '../types';

const AUTH_STORAGE_KEY = 'zov_auth_user';

export const authService = {
  setAuthenticatedUser: (user: User) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  },

  getAuthenticatedUser: (): User | null => {
    const userStr = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  clearAuthenticatedUser: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!authService.getAuthenticatedUser();
  }
}; 