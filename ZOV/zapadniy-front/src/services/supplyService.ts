import api from "./api";
import { SupplyDepot, SupplyRoute } from "../types";

export const supplyService = {
  // Depots
  getAllDepots: async (): Promise<SupplyDepot[]> => {
    const response = await api.get("/missile-supply/depots");
    return response.data;
  },

  getDepotById: async (depotId: string): Promise<SupplyDepot> => {
    const response = await api.get(`/missile-supply/depots/${depotId}`);
    return response.data;
  },

  addDepot: async (
    depot: Omit<SupplyDepot, "currentStock">
  ): Promise<SupplyDepot> => {
    const response = await api.post("/missile-supply/depots", null, {
      params: {
        depotId: depot.depotId,
        name: depot.name,
        latitude: depot.latitude,
        longitude: depot.longitude,
        capacity: depot.capacity,
      },
    });
    return response.data;
  },

  updateDepot: async (depot: SupplyDepot): Promise<SupplyDepot> => {
    const response = await api.put(`/missile-supply/depots/${depot.depotId}`, null, {
      params: {
        name: depot.name,
        capacity: depot.capacity,
        currentStock: depot.currentStock,
        type: depot.type,
        securityLevel: depot.securityLevel
      },
    });
    return response.data;
  },

  deleteDepot: async (depotId: string): Promise<void> => {
    await api.delete(`/missile-supply/depots/${depotId}`);
  },

  // Routes
  getAllRoutes: async (): Promise<SupplyRoute[]> => {
    const response = await api.get("/missile-supply/routes");
    return response.data;
  },

  getOptimalRoute: async (
    fromDepotId: string,
    toDepotId: string
  ): Promise<any[]> => {
    const response = await api.get("/missile-supply/routes/optimal", {
      params: { fromDepotId, toDepotId },
    });
    return response.data;
  },

  addSupplyRoute: async (
    route: Omit<SupplyRoute, "isActive">
  ): Promise<SupplyRoute> => {
    const response = await api.post("/missile-supply/routes", null, {
      params: {
        sourceDepotId: route.sourceDepotId,
        targetDepotId: route.targetDepotId,
        distance: route.distance,
        riskFactor: route.riskFactor,
      },
    });
    return response.data;
  },

  updateRouteStatus: async (
    sourceDepotId: string,
    targetDepotId: string,
    isActive: boolean
  ): Promise<SupplyRoute> => {
    const response = await api.put(
      `/missile-supply/routes/${sourceDepotId}/${targetDepotId}`,
      null,
      {
        params: { isActive },
      }
    );
    return response.data;
  },

  // Missiles in depots
  getDepotsWithMissileType: async (
    missileTypeId: string,
    minQuantity: number = 1
  ): Promise<any[]> => {
    const response = await api.get("/missile-supply/depots/missiles", {
      params: { missileTypeId, minQuantity },
    });
    return response.data;
  },

  addMissilesToDepot: async (
    depotId: string,
    missileTypeId: string,
    quantity: number
  ): Promise<void> => {
    await api.post(`/missile-supply/depots/${depotId}/missiles`, null, {
      params: { missileTypeId, quantity },
    });
  },

  // Admin operations
  resetSupplyChain: async (): Promise<void> => {
    await api.post("/missile-supply/admin/reset-supply-chain");
  },

  generateSampleSupplyChain: async (): Promise<string> => {
    const response = await api.post(
      "/missile-supply/admin/generate-supply-chain"
    );
    return response.data;
  },

  // Utility methods
  refreshSupplyChainData: async (): Promise<{
    depots: SupplyDepot[];
    routes: SupplyRoute[];
  }> => {
    const [depots, routes] = await Promise.all([
      supplyService.getAllDepots(),
      supplyService.getAllRoutes(),
    ]);
    return { depots, routes };
  },
};
