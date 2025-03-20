import api from './api';
import { Region, RegionType, GeoLocation } from '../types';

// Transform GeoJsonPolygon from backend to GeoLocation[] for frontend
const transformRegionBoundaries = (region: any): Region => {
  const transformedRegion = { ...region };
  
  if (region.boundaries && region.boundaries.type) {
    const { type, coordinates } = region.boundaries;

    if (type === 'Polygon' && Array.isArray(coordinates)) {
      const exteriorRing = coordinates[0]?.coordinates || [];
      if (Array.isArray(exteriorRing)) {
        transformedRegion.boundaries = exteriorRing.map((point: any) => ({
          longitude: point.coordinates[0],
          latitude: point.coordinates[1]
        }));
      } else {
        transformedRegion.boundaries = [];
        console.warn(`Region ${region.name} has invalid Polygon coordinates:`, exteriorRing);
      }
    } else if (type === 'LineString' && Array.isArray(coordinates)) {
      transformedRegion.boundaries = coordinates.map((point: any) => ({
        longitude: point.coordinates?.[0] || point.x || 0,
        latitude: point.coordinates?.[1] || point.y || 0
      }));
    } else if (type === 'MultiPolygon' && Array.isArray(coordinates)) {
      const firstPolygon = coordinates[0];
      if (Array.isArray(firstPolygon) && Array.isArray(firstPolygon[0])) {
        const exteriorRing = firstPolygon[0];
        transformedRegion.boundaries = exteriorRing.map((coord: number[]) => ({
          longitude: coord[0],
          latitude: coord[1]
        }));
      } else {
        transformedRegion.boundaries = [];
        console.warn(`Region ${region.name} has invalid MultiPolygon coordinates:`, coordinates);
      }
    } else {
      transformedRegion.boundaries = [];
      console.warn(`Region ${region.name} has unsupported boundary type or malformed coordinates:`, region.boundaries);
    }
  } else if (Array.isArray(region.boundaries)) {
    // Assume boundaries is already a GeoLocation[] array
    transformedRegion.boundaries = region.boundaries;
  } else {
    // If boundaries format is unrecognized
    transformedRegion.boundaries = [];
    console.warn(`Region ${region.name} has invalid boundary format:`, region.boundaries);
  }
  
  return transformedRegion as Region;
};

export const regionService = {
  getAllRegions: async (): Promise<Region[]> => {
    const response = await api.get('/regions');
    console.warn('Raw response data:', response.data);
    
    // Transform all regions
    return response.data.map(transformRegionBoundaries);
  },
  
  getRegionById: async (id: string): Promise<Region> => {
    const response = await api.get(`/regions/${id}`);
    return transformRegionBoundaries(response.data);
  },
  
  createRegion: async (region: Region): Promise<Region> => {
    const response = await api.post('/regions', region);
    return transformRegionBoundaries(response.data);
  },
  
  updateRegion: async (id: string, region: Region): Promise<Region> => {
    const response = await api.put(`/regions/${id}`, region);
    return transformRegionBoundaries(response.data);
  },
  
  deleteRegion: async (id: string): Promise<void> => {
    await api.delete(`/regions/${id}`);
  },
  
  getRegionsByType: async (type: RegionType): Promise<Region[]> => {
    const response = await api.get(`/regions/type/${type}`);
    console.log('Raw regions by type:', response.data);
    return response.data.map(transformRegionBoundaries);
  },
  
  getSubRegions: async (parentId: string): Promise<Region[]> => {
    const response = await api.get(`/regions/parent/${parentId}`);
    return response.data.map(transformRegionBoundaries);
  },
  
  getRegionsContainingPoint: async (location: GeoLocation): Promise<Region[]> => {
    const response = await api.get('/regions/containing', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    });
    return response.data.map(transformRegionBoundaries);
  },
  
  getLowRatedRegionsWithoutImportantPersons: async (threshold: number): Promise<Region[]> => {
    const response = await api.get('/regions/low-rated', {
      params: { threshold }
    });
    return response.data.map(transformRegionBoundaries);
  },
  
  updateRegionStatistics: async (id: string): Promise<Region> => {
    const response = await api.put(`/regions/${id}/statistics`);
    return transformRegionBoundaries(response.data);
  },
  
  updateAllRegionsStatistics: async (): Promise<void> => {
    await api.put('/regions/statistics/all');
  },
  
  getRegionsUnderThreat: async (type: RegionType): Promise<Region[]> => {
    const response = await api.get(`/regions/under-threat/${type}`);
    return response.data.map(transformRegionBoundaries);
  }
}; 