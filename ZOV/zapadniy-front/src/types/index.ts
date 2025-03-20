export enum SocialStatus {
  LOW = 'LOW',
  REGULAR = 'REGULAR',
  IMPORTANT = 'IMPORTANT',
  VIP = 'VIP'
}

export enum RegionType {
  DISTRICT = 'DISTRICT',
  CITY = 'CITY',
  REGION = 'REGION',
  COUNTRY = 'COUNTRY'
}

export enum MissileType {
  ORESHNIK = 'ORESHNIK',
  KINZHAL = 'KINZHAL',
  SARMAT = 'SARMAT'
}

export enum MissileStatus {
  READY = 'READY',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  DEPLOYED = 'DEPLOYED',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface User {
  id?: string;
  username: string;
  password?: string;
  fullName: string;
  socialRating: number;
  status: SocialStatus;
  currentLocation: GeoLocation;
  regionId: string;
  districtId: string;
  countryId: string;
  active: boolean;
  lastLocationUpdateTimestamp: number;
}

export interface Region {
  id?: string;
  name: string;
  type: RegionType;
  parentRegionId?: string;
  boundaries: GeoLocation[];
  averageSocialRating: number;
  populationCount: number;
  importantPersonsCount: number;
  underThreat: boolean;
}

export interface Missile {
  id?: string;
  name: string;
  type: MissileType;
  status: MissileStatus;
  range: number;
  effectRadius: number;
  lastMaintenanceDate: string;
  supplyDepotId: string;
  currentLocation: GeoLocation;
}

export interface SupplyDepot {
  depotId: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentStock: number;
  type?: string;
  securityLevel?: string;
}

export interface SupplyRoute {
  sourceDepotId: string;
  targetDepotId: string;
  distance: number;
  riskFactor: number;
  isActive: boolean;
  transportType?: string;
  securityLevel?: string;
  capacity?: number;
} 