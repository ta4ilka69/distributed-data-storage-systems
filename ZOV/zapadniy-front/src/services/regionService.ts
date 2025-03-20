import api from './api';
import { Region, RegionType, GeoLocation } from '../types';

export const regionService = {
  getAllRegions: async (): Promise<Region[]> => {
    const response = await api.get('/regions');
    console.warn(response.data);
    return response.data;
  },
  
  getRegionById: async (id: string): Promise<Region> => {
    const response = await api.get(`/regions/${id}`);
    return response.data;
  },
  
  createRegion: async (region: Region): Promise<Region> => {
    const response = await api.post('/regions', region);
    return response.data;
  },
  
  updateRegion: async (id: string, region: Region): Promise<Region> => {
    const response = await api.put(`/regions/${id}`, region);
    return response.data;
  },
  
  deleteRegion: async (id: string): Promise<void> => {
    await api.delete(`/regions/${id}`);
  },
  
  getRegionsByType: async (type: RegionType): Promise<Region[]> => {
    const response = await api.get(`/regions/type/${type}`);
    return response.data;
  },
  
  getSubRegions: async (parentId: string): Promise<Region[]> => {
    const response = await api.get(`/regions/parent/${parentId}`);
    return response.data;
  },
  
  getRegionsContainingPoint: async (location: GeoLocation): Promise<Region[]> => {
    const response = await api.get('/regions/containing', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    });
    return response.data;
  },
  
  getLowRatedRegionsWithoutImportantPersons: async (threshold: number): Promise<Region[]> => {
    const response = await api.get('/regions/low-rated', {
      params: { threshold }
    });
    return response.data;
  },
  
  updateRegionStatistics: async (id: string): Promise<Region> => {
    const response = await api.put(`/regions/${id}/statistics`);
    return response.data;
  },
  
  updateAllRegionsStatistics: async (): Promise<void> => {
    await api.put('/regions/statistics/all');
  },
  
  getRegionsUnderThreat: async (type: RegionType): Promise<Region[]> => {
    const response = await api.get(`/regions/under-threat/${type}`);
    return response.data;
  }
}; 