import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, Polyline } from 'react-leaflet';
import { Region, GeoLocation } from '../../types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { regionService } from '../../services/regionService';
import { missileSupplyService } from '../../services/missileSupplyService';

// Fix the marker icon issue in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icon for missile target
const missileIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Custom icon for supply depots
const depotIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4668/4668814.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface RegionMapProps {
  regions: Region[];
  currentLocation?: GeoLocation;
  targetRegionId: string | null;
  onSelectRegion?: (region: Region) => void;
}

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

const MapCenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const RegionMap: React.FC<RegionMapProps> = ({ 
  regions, 
  currentLocation, 
  targetRegionId,
  onSelectRegion 
}) => {
  console.log('RegionMap received regions:', regions);
  console.log('Target region ID:', targetRegionId);
  
  const defaultCenter: [number, number] = [55.7558, 37.6173]; // Moscow coordinates as default
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [subRegions, setSubRegions] = useState<Region[]>([]);
  const [displayRegions, setDisplayRegions] = useState<Region[]>(regions);
  const [parentRegion, setParentRegion] = useState<Region | null>(null);
  const [supplyDepots, setSupplyDepots] = useState<SupplyDepot[]>([]);
  const [supplyRoutes, setSupplyRoutes] = useState<SupplyRoute[]>([]);
  const [showSupplyChain, setShowSupplyChain] = useState<boolean>(true);

  useEffect(() => {
    if (currentLocation) {
      setCenter([currentLocation.latitude, currentLocation.longitude]);
    }
  }, [currentLocation]);

  // Initialize display regions with the top-level regions
  useEffect(() => {
    setDisplayRegions(regions);
  }, [regions]);

  // Add effect to update center when a region is targeted
  useEffect(() => {
    if (targetRegionId && regions) {
      const targetRegion = regions.find(r => r.id === targetRegionId);
      
      if (targetRegion) {
        // Set the target region as the parent region
        setParentRegion(targetRegion);
        
        // If found in main regions, this is a top-level region
        if (targetRegion.boundaries && targetRegion.boundaries.length > 0) {
          const lat = targetRegion.boundaries.reduce((sum, point) => sum + point.latitude, 0) / targetRegion.boundaries.length;
          const lng = targetRegion.boundaries.reduce((sum, point) => sum + point.longitude, 0) / targetRegion.boundaries.length;
          setCenter([lat, lng]);
        }
      } else {
        // Check if target is in subregions
        const subTarget = subRegions.find(r => r.id === targetRegionId);
        if (subTarget && subTarget.boundaries && subTarget.boundaries.length > 0) {
          const lat = subTarget.boundaries.reduce((sum, point) => sum + point.latitude, 0) / subTarget.boundaries.length;
          const lng = subTarget.boundaries.reduce((sum, point) => sum + point.longitude, 0) / subTarget.boundaries.length;
          setCenter([lat, lng]);
          setParentRegion(subTarget);
        }
      }
    }
  }, [targetRegionId, regions, subRegions]);

  // Fetch and display subregions
  useEffect(() => {
    const fetchSubRegions = async () => {
      if (targetRegionId) {
        const fetchedSubRegions = await regionService.getSubRegions(targetRegionId);
        setSubRegions(fetchedSubRegions);
        
        // Update display regions to include parent and its subregions
        if (parentRegion) {
          setDisplayRegions([parentRegion, ...fetchedSubRegions]);
        } else {
          const targetRegion = regions.find(r => r.id === targetRegionId);
          if (targetRegion) {
            setDisplayRegions([targetRegion, ...fetchedSubRegions]);
          }
        }
      } else {
        setSubRegions([]);
        setDisplayRegions(regions); // Reset to show all top-level regions
      }
    };
    
    fetchSubRegions();
  }, [targetRegionId, regions, parentRegion]);

  // Fetch supply chain data
  useEffect(() => {
    const fetchSupplyChain = async () => {
      try {
        const chainData = await missileSupplyService.getSupplyChainVisualization();
        setSupplyDepots(chainData.depots);
        setSupplyRoutes(chainData.routes);
      } catch (error) {
        console.error('Failed to fetch supply chain data:', error);
      }
    };
    
    fetchSupplyChain();
    
    // Set up WebSocket connection for supply chain updates
    const websocket = new WebSocket(`ws://${window.location.host}/websocket`);
    
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'SUPPLY_CHAIN_UPDATE') {
        setSupplyDepots(message.depots);
        setSupplyRoutes(message.routes);
      }
    };
    
    return () => {
      websocket.close();
    };
  }, []);

  // Find depot by ID
  const findDepot = (depotId: string): SupplyDepot | undefined => {
    return supplyDepots.find(depot => depot.depotId === depotId);
  };

  const getRegionColor = (region: Region): string => {
    // Check if this region contains any supply depots
    const hasSupplyDepot = supplyDepots.some(depot => {
      // This is a simplistic check - in a real app, we'd use a proper geospatial check
      // to see if the depot is within the region's boundaries
      if (region.boundaries && region.boundaries.length > 0) {
        const regionCenter = {
          latitude: region.boundaries.reduce((sum, point) => sum + point.latitude, 0) / region.boundaries.length,
          longitude: region.boundaries.reduce((sum, point) => sum + point.longitude, 0) / region.boundaries.length
        };
        
        // Check if depot is near the region center (within ~50km)
        const latDiff = Math.abs(depot.latitude - regionCenter.latitude);
        const lngDiff = Math.abs(depot.longitude - regionCenter.longitude);
        return latDiff < 0.5 && lngDiff < 0.5; // Rough approximation
      }
      return false;
    });
    
    if (hasSupplyDepot) {
      return '#0066ff'; // Blue for regions with supply depots
    }
    
    if (region.id === targetRegionId) {
      return '#ff0000'; // Target region (red)
    }
    
    if (region.underThreat) {
      return '#ff3333'; // Under threat (lighter red)
    }
    
    if (region.averageSocialRating < 30) {
      return '#ff9900'; // Low rating (orange)
    }
    
    return '#00cc00'; // Good rating (green)
  };

  const getRegionFillOpacity = (region: Region): number => {
    // If this is the parent region and we have subregions
    if (region.id === targetRegionId && subRegions.length > 0) {
      return 0.1; // Make parent very transparent when showing subregions
    }
    
    if (region.id === targetRegionId) {
      return 0.8; // More opaque for targeted region
    }
    
    // If this is a subregion, make it more opaque
    if (subRegions.includes(region)) {
      return 0.7;
    }
    
    return 0.3; // Default opacity
  };

  // Helper to determine if a region is a subregion
  const isSubRegion = (region: Region): boolean => {
    // First check if it's in our subRegions array
    const foundInSubRegions = subRegions.some(sr => sr.id === region.id);
    if (foundInSubRegions) return true;
    
    // Also check by parentRegionId if available
    if (targetRegionId && region.parentRegionId === targetRegionId) {
      return true;
    }
    
    return false;
  };

  const handleRegionClick = (region: Region) => {
    if (onSelectRegion) {
      onSelectRegion(region);
    }
  };

  return (
    <div className="relative h-full">
      <div className="absolute top-2 right-2 z-10 bg-white p-2 rounded shadow">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showSupplyChain"
            checked={showSupplyChain}
            onChange={(e) => setShowSupplyChain(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="showSupplyChain">Show Supply Chain</label>
        </div>
      </div>
      
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapCenter center={center} />
        
        {/* Display regions */}
        {displayRegions.map((region) => {
          if (!region.boundaries || region.boundaries.length < 3) {
            return null;
          }
          
          const polygonPositions = region.boundaries.map(point => [point.latitude, point.longitude] as [number, number]);
          
          return (
            <Polygon
              key={region.id}
              positions={polygonPositions}
              pathOptions={{
                color: getRegionColor(region),
                fillOpacity: getRegionFillOpacity(region),
                weight: region.id === targetRegionId ? 3 : 1,
              }}
              eventHandlers={{
                click: () => handleRegionClick(region),
              }}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{region.name}</h3>
                  <p>Type: {region.type}</p>
                  <p>Population: {region.populationCount}</p>
                  <p>Avg. Rating: {region.averageSocialRating.toFixed(1)}</p>
                  <p>Important Persons: {region.importantPersonsCount}</p>
                  {region.underThreat && (
                    <p className="text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      Under Threat
                    </p>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}
        
        {/* Display missile target marker */}
        {targetRegionId && (
          <Marker 
            position={center} 
            icon={missileIcon}
          >
            <Popup>
              <div>
                <h3 className="font-bold">Targeted Region</h3>
                <p>ID: {targetRegionId}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Display supply depots and routes if enabled */}
        {showSupplyChain && (
          <>
            {/* Supply Routes */}
            {supplyRoutes.map((route, index) => {
              const sourceDepot = findDepot(route.sourceDepotId);
              const targetDepot = findDepot(route.targetDepotId);
              
              if (!sourceDepot || !targetDepot) return null;
              
              return (
                <Polyline
                  key={`route-${index}`}
                  positions={[
                    [sourceDepot.latitude, sourceDepot.longitude],
                    [targetDepot.latitude, targetDepot.longitude]
                  ]}
                  pathOptions={{
                    color: '#0066cc',
                    weight: 3,
                    opacity: 0.7,
                    dashArray: '5, 5'
                  }}
                >
                  <Popup>
                    <div>
                      <h3 className="font-bold">Supply Route</h3>
                      <p>From: {sourceDepot.name}</p>
                      <p>To: {targetDepot.name}</p>
                      <p>Distance: {route.distance.toFixed(1)} km</p>
                      <p>Risk Factor: {route.riskFactor.toFixed(2)}</p>
                    </div>
                  </Popup>
                </Polyline>
              );
            })}
            
            {/* Supply Depots */}
            {supplyDepots.map((depot) => (
              <Marker
                key={depot.depotId}
                position={[depot.latitude, depot.longitude]}
                icon={depotIcon}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">{depot.name}</h3>
                    <p>ID: {depot.depotId}</p>
                    <p>Capacity: {depot.capacity}</p>
                    <p>Current Stock: {depot.currentStock}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
        
        {/* Display user location if available */}
        {currentLocation && (
          <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default RegionMap; 