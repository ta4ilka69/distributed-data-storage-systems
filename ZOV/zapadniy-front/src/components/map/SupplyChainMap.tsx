import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
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

// Component to handle map clicks for adding new depots
const AddDepotTool = ({ 
  isActive, 
  onLocationSelected 
}: { 
  isActive: boolean, 
  onLocationSelected: (latlng: [number, number]) => void 
}) => {
  const map = useMapEvents({
    click: (e) => {
      if (isActive) {
        const { lat, lng } = e.latlng;
        onLocationSelected([lat, lng]);
      }
    }
  });
  
  useEffect(() => {
    map.getContainer().style.cursor = isActive ? 'crosshair' : '';
  }, [isActive, map]);
  
  return null;
};

// Component to show a modal for creating a route
const RouteCreationModal = ({ 
  sourceDepot, 
  targetDepot, 
  onClose, 
  onSubmit 
}: { 
  sourceDepot: SupplyDepot, 
  targetDepot: SupplyDepot, 
  onClose: () => void, 
  onSubmit: (routeData: Omit<SupplyRoute, 'isActive'>) => void 
}) => {
  const [routeData, setRouteData] = useState<{
    riskFactor: number;
    transportType: string;
    securityLevel: string;
    capacity: number;
  }>({
    riskFactor: 1.0,
    transportType: 'Ground',
    securityLevel: 'Medium',
    capacity: 50
  });

  // Calculate distance between two points in km using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = calculateDistance(
    sourceDepot.latitude, 
    sourceDepot.longitude, 
    targetDepot.latitude, 
    targetDepot.longitude
  );

  const handleSubmit = () => {
    onSubmit({
      sourceDepotId: sourceDepot.depotId,
      targetDepotId: targetDepot.depotId,
      distance: distance,
      riskFactor: routeData.riskFactor,
      transportType: routeData.transportType,
      securityLevel: routeData.securityLevel,
      capacity: routeData.capacity
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white p-4 rounded-md w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">Create New Supply Route</h2>
        
        <div className="mb-3">
          <p className="font-medium">From: {sourceDepot.name}</p>
          <p className="font-medium">To: {targetDepot.name}</p>
          <p className="text-sm">Distance: {distance.toFixed(2)} km</p>
        </div>
        
        <div className="mb-2">
          <label className="block text-sm">Risk Factor (0.1-10):</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            className="w-full px-2 py-1 border rounded"
            value={routeData.riskFactor}
            onChange={(e) => setRouteData({...routeData, riskFactor: parseFloat(e.target.value) || 1.0})}
          />
        </div>
        
        <div className="mb-2">
          <label className="block text-sm">Transport Type:</label>
          <select
            className="w-full px-2 py-1 border rounded"
            value={routeData.transportType}
            onChange={(e) => setRouteData({...routeData, transportType: e.target.value})}
          >
            <option value="Ground">Ground</option>
            <option value="Air">Air</option>
            <option value="Rail">Rail</option>
            <option value="Sea">Sea</option>
          </select>
        </div>
        
        <div className="mb-2">
          <label className="block text-sm">Security Level:</label>
          <select
            className="w-full px-2 py-1 border rounded"
            value={routeData.securityLevel}
            onChange={(e) => setRouteData({...routeData, securityLevel: e.target.value})}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Maximum">Maximum</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm">Capacity:</label>
          <input
            type="number"
            className="w-full px-2 py-1 border rounded"
            value={routeData.capacity}
            onChange={(e) => setRouteData({...routeData, capacity: parseInt(e.target.value) || 0})}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            className="px-3 py-1 bg-gray-400 text-white rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded"
            onClick={handleSubmit}
          >
            Create Route
          </button>
        </div>
      </div>
    </div>
  );
};

// Component for editing depot details
const DepotEditModal = ({ 
  depot, 
  onClose, 
  onSubmit,
  onDelete
}: { 
  depot: SupplyDepot, 
  onClose: () => void, 
  onSubmit: (updatedDepot: SupplyDepot) => void,
  onDelete: (depotId: string) => void 
}) => {
  const [depotData, setDepotData] = useState<{
    name: string;
    capacity: number;
    type: string;
    securityLevel: string;
    currentStock: number;
  }>({
    name: depot.name,
    capacity: depot.capacity,
    type: depot.type || 'Standard',
    securityLevel: depot.securityLevel || 'Medium',
    currentStock: depot.currentStock
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = () => {
    onSubmit({
      ...depot,
      name: depotData.name,
      capacity: depotData.capacity,
      type: depotData.type,
      securityLevel: depotData.securityLevel,
      currentStock: depotData.currentStock
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white p-4 rounded-md w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">Edit Supply Depot</h2>
        
        <div className="mb-2">
          <label className="block text-sm">Name:</label>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded"
            value={depotData.name}
            onChange={(e) => setDepotData({...depotData, name: e.target.value})}
          />
        </div>
        
        <div className="mb-2">
          <label className="block text-sm">Capacity:</label>
          <input
            type="number"
            className="w-full px-2 py-1 border rounded"
            value={depotData.capacity}
            onChange={(e) => setDepotData({...depotData, capacity: parseInt(e.target.value) || depot.capacity})}
          />
        </div>
        
        <div className="mb-2">
          <label className="block text-sm">Current Stock:</label>
          <input
            type="number"
            className="w-full px-2 py-1 border rounded"
            value={depotData.currentStock}
            onChange={(e) => setDepotData({...depotData, currentStock: parseInt(e.target.value) || depot.currentStock})}
          />
        </div>
        
        <div className="mb-2">
          <label className="block text-sm">Type:</label>
          <select
            className="w-full px-2 py-1 border rounded"
            value={depotData.type}
            onChange={(e) => setDepotData({...depotData, type: e.target.value})}
          >
            <option value="Standard">Standard</option>
            <option value="Military">Military</option>
            <option value="Strategic">Strategic</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm">Security Level:</label>
          <select
            className="w-full px-2 py-1 border rounded"
            value={depotData.securityLevel}
            onChange={(e) => setDepotData({...depotData, securityLevel: e.target.value})}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Maximum">Maximum</option>
          </select>
        </div>
        
        <div className="flex justify-between mt-4">
          <button
            className="px-3 py-1 bg-red-500 text-white rounded"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Depot
          </button>
          
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 bg-gray-400 text-white rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded"
              onClick={handleSubmit}
            >
              Update Depot
            </button>
          </div>
        </div>
        
        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="bg-white p-4 rounded-md shadow-lg">
              <h3 className="font-bold">Confirm Deletion</h3>
              <p className="my-2">Are you sure you want to delete {depot.name}?</p>
              <p className="text-sm text-red-600 mb-4">
                This will also remove all routes connected to this depot.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-3 py-1 bg-gray-400 text-white rounded"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded"
                  onClick={() => {
                    onDelete(depot.depotId);
                    setShowDeleteConfirm(false);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  
  // New state for adding depot feature
  const [isAddingDepot, setIsAddingDepot] = useState<boolean>(false);
  const [newDepotLocation, setNewDepotLocation] = useState<[number, number] | null>(null);
  const [newDepotData, setNewDepotData] = useState({
    name: '',
    capacity: 100,
    type: 'Standard',
    securityLevel: 'Medium'
  });

  // New state for route creation
  const [isCreatingRoute, setIsCreatingRoute] = useState<boolean>(false);
  const [routeSourceDepot, setRouteSourceDepot] = useState<SupplyDepot | null>(null);
  const [routeTargetDepot, setRouteTargetDepot] = useState<SupplyDepot | null>(null);
  const [showRouteModal, setShowRouteModal] = useState<boolean>(false);

  // New state for depot editing
  const [selectedDepotForEdit, setSelectedDepotForEdit] = useState<SupplyDepot | null>(null);

  // Fetch depots and routes on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching supply chain data...');
        
        // First try to get depots
        const fetchedDepots = await supplyService.getAllDepots();
        console.log('Fetched depots:', fetchedDepots.length);
        setDepots(fetchedDepots);
        
        // Then try to get routes separately
        try {
          console.log('Fetching routes...');
          const fetchedRoutes = await supplyService.getAllRoutes();
          console.log('Fetched routes:', fetchedRoutes);
          
          if (fetchedRoutes && fetchedRoutes.length > 0) {
            console.log('Setting routes:', fetchedRoutes.length);
            setRoutes(fetchedRoutes);
          } else {
            console.warn('No routes returned from API');
            // Try to regenerate supply chain
            await supplyService.refreshSupplyChainData();
            const refreshedRoutes = await supplyService.getAllRoutes();
            console.log('After refresh, routes:', refreshedRoutes.length);
            setRoutes(refreshedRoutes);
          }
        } catch (routeError) {
          console.error('Error fetching routes:', routeError);
          setRoutes([]);
        }
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
    // If in route creation mode
    if (isCreatingRoute) {
      if (!routeSourceDepot) {
        setRouteSourceDepot(depot);
      } else if (routeSourceDepot.depotId !== depot.depotId) {
        setRouteTargetDepot(depot);
        setShowRouteModal(true);
      }
      return;
    }
    
    // Original depot selection logic for path finding
    if (!sourceDepotId) {
      setSourceDepotId(depot.depotId);
    } 
    else if (!targetDepotId) {
      setTargetDepotId(depot.depotId);
    } 
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
    if (!routes || routes.length === 0) return null;
    
    return routes.map(route => {
      if (!route || !route.sourceDepotId || !route.targetDepotId) return null;
      
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

  const handleLocationSelected = (latlng: [number, number]) => {
    setNewDepotLocation(latlng);
    setIsAddingDepot(false);
  };

  const handleAddDepot = async () => {
    if (!newDepotLocation) return;
    
    try {
      const newDepot: Omit<SupplyDepot, 'currentStock'> = {
        depotId: `depot-${Date.now()}`, // Generate a unique ID
        name: newDepotData.name,
        latitude: newDepotLocation[0],
        longitude: newDepotLocation[1],
        capacity: newDepotData.capacity,
        type: newDepotData.type,
        securityLevel: newDepotData.securityLevel
      };
      
      const addedDepot = await supplyService.addDepot(newDepot);
      
      // Update the local state with the new depot
      setDepots(prevDepots => [...prevDepots, addedDepot]);
      
      // Reset the new depot form
      setNewDepotLocation(null);
      setNewDepotData({
        name: '',
        capacity: 100,
        type: 'Standard',
        securityLevel: 'Medium'
      });
      
      // Show success message or notification here
    } catch (error) {
      console.error('Error adding new depot:', error);
      // Show error message or notification here
    }
  };

  const handleCreateRoute = async (routeData: Omit<SupplyRoute, 'isActive'>) => {
    try {
      const newRoute = await supplyService.addSupplyRoute(routeData);
      
      // Update the local state with the new route
      setRoutes(prevRoutes => [...prevRoutes, newRoute]);
      
      // Reset route creation state
      setRouteSourceDepot(null);
      setRouteTargetDepot(null);
      setShowRouteModal(false);
      setIsCreatingRoute(false);
      
      // Show success message or notification here
    } catch (error) {
      console.error('Error creating new route:', error);
      // Show error message or notification here
    }
  };

  const cancelRouteCreation = () => {
    setRouteSourceDepot(null);
    setRouteTargetDepot(null);
    setShowRouteModal(false);
  };

  // Add/update API functions
  const handleUpdateDepot = async (updatedDepot: SupplyDepot) => {
    try {
      // Call the updateDepot service method
      const updatedDepotResponse = await supplyService.updateDepot(updatedDepot);
      
      // Update the local state with the response from the server
      setDepots(prevDepots => 
        prevDepots.map(d => 
          d.depotId === updatedDepotResponse.depotId ? updatedDepotResponse : d
        )
      );
      
      setSelectedDepotForEdit(null);
      
      // Show success message or notification here
    } catch (error) {
      console.error('Error updating depot:', error);
      // Show error message or notification here
    }
  };

  // Add function to handle depot deletion
  const handleDeleteDepot = async (depotId: string) => {
    try {
      // Call the deleteDepot service method
      await supplyService.deleteDepot(depotId);
      
      // Update the local state by removing the depot
      setDepots(prevDepots => prevDepots.filter(d => d.depotId !== depotId));
      
      // Also remove any routes connected to this depot
      setRoutes(prevRoutes => 
        prevRoutes.filter(r => 
          r.sourceDepotId !== depotId && r.targetDepotId !== depotId
        )
      );
      
      // Clear selected depot for edit
      setSelectedDepotForEdit(null);
      
      // Reset path finding if this depot was selected
      if (sourceDepotId === depotId) {
        setSourceDepotId(null);
        setOptimalPath([]);
      }
      if (targetDepotId === depotId) {
        setTargetDepotId(null);
        setOptimalPath([]);
      }
      
      // Show success message or notification here
    } catch (error) {
      console.error('Error deleting depot:', error);
      // Show error message or notification here
    }
  };

  return (
    <div className="relative h-full w-full">
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
        
        {/* Add depot tool */}
        <AddDepotTool 
          isActive={isAddingDepot} 
          onLocationSelected={handleLocationSelected} 
        />
        
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
                
                {/* Add edit button */}
                <button
                  className="mt-2 w-full px-3 py-1 bg-yellow-500 text-white rounded text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDepotForEdit(depot);
                  }}
                >
                  Edit Depot
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Render new depot marker if location is selected */}
        {newDepotLocation && (
          <Marker 
            position={newDepotLocation}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">New Supply Depot</h3>
                <div className="mb-2">
                  <label className="block text-sm">Name:</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border rounded"
                    value={newDepotData.name}
                    onChange={(e) => setNewDepotData({...newDepotData, name: e.target.value})}
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm">Capacity:</label>
                  <input
                    type="number"
                    className="w-full px-2 py-1 border rounded"
                    value={newDepotData.capacity}
                    onChange={(e) => setNewDepotData({...newDepotData, capacity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm">Type:</label>
                  <select
                    className="w-full px-2 py-1 border rounded"
                    value={newDepotData.type}
                    onChange={(e) => setNewDepotData({...newDepotData, type: e.target.value})}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Military">Military</option>
                    <option value="Strategic">Strategic</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm">Security Level:</label>
                  <select
                    className="w-full px-2 py-1 border rounded"
                    value={newDepotData.securityLevel}
                    onChange={(e) => setNewDepotData({...newDepotData, securityLevel: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Maximum">Maximum</option>
                  </select>
                </div>
                <button
                  className="w-full mt-2 px-3 py-1 bg-blue-500 text-white rounded"
                  onClick={handleAddDepot}
                >
                  Add Depot
                </button>
              </div>
            </Popup>
          </Marker>
        )}
        
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
        
        {/* Highlight source depot for route creation */}
        {routeSourceDepot && isCreatingRoute && (
          <Marker 
            position={[routeSourceDepot.latitude, routeSourceDepot.longitude]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          />
        )}
      </MapContainer>
      
      {/* Controls for adding new depot or creating route */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded shadow">
        <div className="flex flex-col space-y-2">
          <button
            className={`px-3 py-1 rounded text-white text-sm ${isAddingDepot ? 'bg-red-500' : 'bg-blue-500'}`}
            onClick={() => {
              if (isCreatingRoute) setIsCreatingRoute(false);
              setIsAddingDepot(!isAddingDepot);
            }}
            disabled={isCreatingRoute}
          >
            {isAddingDepot ? 'Cancel' : 'Add New Depot'}
          </button>
          
          <button
            className={`px-3 py-1 rounded text-white text-sm ${isCreatingRoute ? 'bg-red-500' : 'bg-green-500'}`}
            onClick={() => {
              if (isAddingDepot) setIsAddingDepot(false);
              setIsCreatingRoute(!isCreatingRoute);
              if (!isCreatingRoute) {
                setRouteSourceDepot(null);
                setRouteTargetDepot(null);
              }
            }}
            disabled={isAddingDepot}
          >
            {isCreatingRoute ? 'Cancel Route' : 'Create New Route'}
          </button>
        </div>
        
        {isAddingDepot && (
          <p className="text-xs mt-1">Click on the map to place the new depot</p>
        )}
        
        {isCreatingRoute && (
          <p className="text-xs mt-1">
            {!routeSourceDepot 
              ? 'Click on a depot to set as source' 
              : 'Click on another depot to set as target'}
          </p>
        )}
      </div>
      
      {/* Route creation modal */}
      {showRouteModal && routeSourceDepot && routeTargetDepot && (
        <RouteCreationModal 
          sourceDepot={routeSourceDepot} 
          targetDepot={routeTargetDepot}
          onClose={cancelRouteCreation}
          onSubmit={handleCreateRoute}
        />
      )}
      
      {/* Depot edit modal */}
      {selectedDepotForEdit && (
        <DepotEditModal
          depot={selectedDepotForEdit}
          onClose={() => setSelectedDepotForEdit(null)}
          onSubmit={handleUpdateDepot}
          onDelete={handleDeleteDepot}
        />
      )}
    </div>
  );
};

export default SupplyChainMap; 