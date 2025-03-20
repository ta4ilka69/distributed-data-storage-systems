import api from './api';

interface SupplyDepot {
  depotId: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentStock: number;
}

interface SupplyRoute {
  sourceDepotId: string;
  targetDepotId: string;
  distance: number;
  riskFactor: number;
}

interface SupplyChainData {
  depots: SupplyDepot[];
  routes: SupplyRoute[];
}

export const missileSupplyService = {
  getAllDepots: async (): Promise<SupplyDepot[]> => {
    const response = await api.get('/missile-supply/depots');
    return response.data;
  },
  
  getDepotById: async (depotId: string): Promise<SupplyDepot> => {
    const response = await api.get(`/missile-supply/depots/${depotId}`);
    return response.data;
  },
  
  createDepot: async (depot: Omit<SupplyDepot, 'currentStock'>): Promise<SupplyDepot> => {
    const response = await api.post('/missile-supply/depots', depot);
    return response.data;
  },
  
  addMissilesToDepot: async (depotId: string, missileTypeId: string, quantity: number): Promise<void> => {
    await api.post(`/missile-supply/depots/${depotId}/missiles`, {
      missileTypeId,
      quantity
    });
  },
  
  createSupplyRoute: async (route: Omit<SupplyRoute, 'id'>): Promise<SupplyRoute> => {
    const response = await api.post('/missile-supply/routes', route);
    return response.data;
  },
  
  findOptimalRoute: async (fromDepotId: string, toDepotId: string): Promise<SupplyRoute[]> => {
    const response = await api.get(`/missile-supply/routes/optimal?fromDepotId=${fromDepotId}&toDepotId=${toDepotId}`);
    return response.data;
  },
  
  getSupplyChainVisualization: async (): Promise<SupplyChainData> => {
    const response = await api.get('/missile-supply/chain/visualization');
    return response.data;
  },
  
  getDepotsInRegion: async (regionId: string): Promise<SupplyDepot[]> => {
    const response = await api.get(`/missile-supply/depots/region/${regionId}`);
    return response.data;
  }
}; 