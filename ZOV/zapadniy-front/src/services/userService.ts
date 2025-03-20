import api from './api';
import { User, GeoLocation } from '../types';

export const userService = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await api.post('/users/login', null, {
      params: { username, password }
    });
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  createUser: async (user: User): Promise<User> => {
    const response = await api.post('/users', user);
    return response.data;
  },
  
  updateUser: async (id: string, user: User): Promise<User> => {
    const response = await api.put(`/users/${id}`, user);
    return response.data;
  },
  
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  
  updateUserLocation: async (
    id: string, 
    location: GeoLocation, 
    regionId: string, 
    districtId: string, 
    countryId: string
  ): Promise<User> => {
    const response = await api.put(`/users/${id}/location`, null, {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        regionId,
        districtId,
        countryId
      }
    });
    return response.data;
  },
  
  updateSocialRating: async (id: string, rating: number, raterId?: string): Promise<User> => {
    const params: any = { rating };
    if (raterId) {
      params.raterId = raterId;
    }
    
    const response = await api.put(`/users/${id}/social-rating`, null, {
      params
    });
    return response.data;
  },
  
  getUsersInRegion: async (regionId: string): Promise<User[]> => {
    const response = await api.get(`/users/region/${regionId}`);
    return response.data;
  },
  
  getImportantPersonsInRegion: async (regionId: string): Promise<User[]> => {
    const response = await api.get(`/users/region/${regionId}/important`);
    return response.data;
  },
  
  getUsersNearLocation: async (location: GeoLocation, maxDistanceKm: number): Promise<User[]> => {
    const response = await api.get('/users/near', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        maxDistanceKm
      }
    });
    return response.data;
  },
  
  getUsersBelowRating: async (threshold: number): Promise<User[]> => {
    const response = await api.get(`/users/below-rating/${threshold}`);
    return response.data;
  }
}; 