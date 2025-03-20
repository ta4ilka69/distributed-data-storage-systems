import api from './api';
import { Missile, MissileType, MissileStatus, GeoLocation } from '../types';

export const missileService = {
  getAllMissiles: async (): Promise<Missile[]> => {
    const response = await api.get('/missiles');
    return response.data;
  },
  
  getMissileById: async (id: string): Promise<Missile> => {
    const response = await api.get(`/missiles/${id}`);
    return response.data;
  },
  
  createMissile: async (missile: Missile): Promise<Missile> => {
    const response = await api.post('/missiles', missile);
    return response.data;
  },
  
  updateMissile: async (id: string, missile: Missile): Promise<Missile> => {
    const response = await api.put(`/missiles/${id}`, missile);
    return response.data;
  },
  
  deleteMissile: async (id: string): Promise<void> => {
    await api.delete(`/missiles/${id}`);
  },
  
  getMissilesByType: async (type: MissileType): Promise<Missile[]> => {
    const response = await api.get(`/missiles/type/${type}`);
    return response.data;
  },
  
  getMissilesByStatus: async (status: MissileStatus): Promise<Missile[]> => {
    const response = await api.get(`/missiles/status/${status}`);
    return response.data;
  },
  
  getMissilesInSupplyDepot: async (depotId: string): Promise<Missile[]> => {
    const response = await api.get(`/missiles/depot/${depotId}`);
    return response.data;
  },
  
  deployMissile: async (id: string, targetLocation: GeoLocation): Promise<Missile> => {
    const response = await api.post(`/missiles/${id}/deploy`, {
      latitude: targetLocation.latitude,
      longitude: targetLocation.longitude
    });
    return response.data;
  },
  
  launchMissileAtRegion: async (regionId: string, missileType: MissileType): Promise<void> => {
    console.log(`Launching ${missileType} missile at region ${regionId}`);
    try {
      // Use the correct endpoint as defined in GovernmentController
      await api.post(`/government/deploy-oreshnik/${regionId}`);
    } catch (error) {
      console.error('Error launching missile:', error);
      throw error;
    }
  }
}; 