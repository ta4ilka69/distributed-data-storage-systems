import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { SupplyDepot, SupplyRoute } from '../../types';
import { supplyService } from '../../services/supplyService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix the marker icon issue in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom depot icon
const depotIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Adjust map center when center prop changes
const MapCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

interface SupplyChainMapProps {
  selectedDepotId?: string;
  onSelectDepot?: (depot: SupplyDepot) => void;
}

const SupplyChainMap: React.FC<SupplyChainMapProps> = ({ 
  selectedDepotId,
  onSelectDepot
}) => {
  const defaultCenter: [number, number] = [55.7558, 37.6173]; // Moscow coordinates as default
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [depots, setDepots] = useState<SupplyDepot[]>([]);
  const [routes, setRoutes] = useState<SupplyRoute[]>([]);
  const [optimalPath, setOptimalPath] = useState<any[]>([]);
  const [sourceDepotId, setSourceDepotId] = useState<string | null>(null);
  const [targetDepotId, setTargetDepotId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<SupplyRoute | null>(null);

  // Fetch depots and routes on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedDepots, fetchedRoutes] = await Promise.all([
          supplyService.getAllDepots(),
          supplyService.getAllRoutes()
        ]);
        setDepots(fetchedDepots);
        setRoutes(fetchedRoutes);
      } catch (error) {
        console.error('Error fetching supply chain data:', error);
      }
    };

    fetchData();
  }, []);

  // Handle selected depot changes
  useEffect(() => {
    if (selectedDepotId && depots.length > 0) {
      const selectedDepot = depots.find(d => d.depotId === selectedDepotId);
      if (selectedDepot) {
        setCenter([selectedDepot.latitude, selectedDepot.longitude]);
      }
    }
  }, [selectedDepotId, depots]);

  // Show optimal route when source and target depots are selected
  useEffect(() => {
    const fetchOptimalRoute = async () => {
      if (sourceDepotId && targetDepotId) {
        try {
          const path = await supplyService.getOptimalRoute(sourceDepotId, targetDepotId);
          setOptimalPath(path);
        } catch (error) {
          console.error('Error fetching optimal route:', error);
          setOptimalPath([]);
        }
      } else {
        setOptimalPath([]);
      }
    };

    fetchOptimalRoute();
  }, [sourceDepotId, targetDepotId]);

  const handleDepotClick = (depot: SupplyDepot) => {
    // If no source depot selected yet, set it
    if (!sourceDepotId) {
      setSourceDepotId(depot.depotId);
    } 
    // If source already selected but no target, set target
    else if (!targetDepotId) {
      setTargetDepotId(depot.depotId);
    } 
    // If both already set, reset and set new source
    else {
      setSourceDepotId(depot.depotId);
      setTargetDepotId(null);
      setOptimalPath([]);
    }

    if (onSelectDepot) {
      onSelectDepot(depot);
    }
  };

  const handleRouteClick = (route: SupplyRoute) => {
    setSelectedRoute(route);
  };

  const toggleRouteStatus = async (route: SupplyRoute) => {
    try {
      const updatedRoute = await supplyService.updateRouteStatus(
        route.sourceDepotId,
        route.targetDepotId,
        !route.isActive
      );
      
      // Update routes state with the updated route
      setRoutes(prevRoutes => 
        prevRoutes.map(r => 
          (r.sourceDepotId === route.sourceDepotId && r.targetDepotId === route.targetDepotId) 
            ? updatedRoute 
            : r
        )
      );
      
      setSelectedRoute(updatedRoute);
      
      // If this route is part of the optimal path, recalculate it
      if (sourceDepotId && targetDepotId) {
        const path = await supplyService.getOptimalRoute(sourceDepotId, targetDepotId);
        setOptimalPath(path);
      }
    } catch (error) {
      console.error('Error updating route status:', error);
    }
  };

  // Render the optimal path if available
  const renderOptimalPath = () => {
    if (!optimalPath || optimalPath.length === 0) return null;

    // Extract depot positions from the path
    const pathPositions: [number, number][] = [];
    
    for (let i = 0; i < optimalPath.length; i++) {
      const item = optimalPath[i];
      
      if (item.type === 'depot') {
        const depot = depots.find(d => d.depotId === item.id);
        if (depot) {
          pathPositions.push([depot.latitude, depot.longitude]);
        }
      }
    }

    return (
      <Polyline 
        positions={pathPositions}
        pathOptions={{ 
          color: 'green', 
          weight: 4,
          dashArray: '5, 10'
        }} 
      />
    );
  };

  // Render all supply routes
  const renderSupplyRoutes = () => {
    return routes.map(route => {
      const sourceDepot = depots.find(d => d.depotId === route.sourceDepotId);
      const targetDepot = depots.find(d => d.depotId === route.targetDepotId);
      
      if (!sourceDepot || !targetDepot) return null;
      
      const positions: [number, number][] = [
        [sourceDepot.latitude, sourceDepot.longitude],
        [targetDepot.latitude, targetDepot.longitude]
      ];
      
      return (
        <Polyline 
          key={`${route.sourceDepotId}-${route.targetDepotId}`}
          positions={positions}
          pathOptions={{ 
            color: route.isActive ? 'blue' : 'red',
            weight: 2,
            opacity: 0.7
          }}
          eventHandlers={{
            click: () => handleRouteClick(route)
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">Supply Route</h3>
              <p className="text-sm">From: {sourceDepot.name}</p>
              <p className="text-sm">To: {targetDepot.name}</p>
              <p className="text-sm">Distance: {route.distance.toFixed(2)} km</p>
              <p className="text-sm">Risk Factor: {route.riskFactor.toFixed(2)}</p>
              <p className="text-sm">Status: {route.isActive ? 'Active' : 'Inactive'}</p>
              {route.transportType && (
                <p className="text-sm">Transport: {route.transportType}</p>
              )}
              <button 
                className={`mt-2 px-3 py-1 rounded text-white text-xs ${route.isActive ? 'bg-red-500' : 'bg-green-500'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRouteStatus(route);
                }}
              >
                {route.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </Popup>
        </Polyline>
      );
    });
  };

  return (
    <MapContainer 
      center={center} 
      zoom={5} 
      style={{ height: '100%', width: '100%', minHeight: '500px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapCenter center={center} />
      
      {/* Render all supply routes */}
      {renderSupplyRoutes()}
      
      {/* Render optimal path if available */}
      {renderOptimalPath()}
      
      {/* Render depots */}
      {depots.map(depot => (
        <Marker 
          key={depot.depotId}
          position={[depot.latitude, depot.longitude]}
          icon={depotIcon}
          eventHandlers={{
            click: () => handleDepotClick(depot)
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">{depot.name}</h3>
              <p className="text-sm">Type: {depot.type || 'Standard'}</p>
              <p className="text-sm">Capacity: {depot.capacity}</p>
              <p className="text-sm">Current Stock: {depot.currentStock}</p>
              {depot.securityLevel && (
                <p className="text-sm">Security: {depot.securityLevel}</p>
              )}
              {sourceDepotId === depot.depotId && (
                <div className="mt-2 bg-blue-100 p-1 rounded-md">
                  <span className="text-blue-700 text-xs font-medium">Source Depot</span>
                </div>
              )}
              {targetDepotId === depot.depotId && (
                <div className="mt-2 bg-green-100 p-1 rounded-md">
                  <span className="text-green-700 text-xs font-medium">Target Depot</span>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Render message if no depots are found */}
      {depots.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}>No supply depots found</div>
      )}
    </MapContainer>
  );
};

export default SupplyChainMap; 