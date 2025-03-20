import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import { Region , GeoLocation } from '../../types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { regionService } from '../../services/regionService';

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

interface RegionMapProps {
  regions: Region[];
  currentLocation?: GeoLocation;
  targetRegionId: string | null;
  onSelectRegion?: (region: Region) => void;
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

  const getRegionColor = (region: Region): string => {
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
    <MapContainer 
      center={center} 
      zoom={6} 
      style={{ height: '100%', width: '100%', minHeight: '500px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapCenter center={center} />
      
      {displayRegions && displayRegions.length > 0 ? (
        // First render the parent region (if we have one)
        displayRegions
          .filter(region => !isSubRegion(region))
          .map(region => {
            console.log('Processing parent region:', region.name, 'Boundaries:', region.boundaries);
            if (!Array.isArray(region.boundaries) || region.boundaries.length < 3) {
              console.warn(`Region ${region.name} has invalid boundaries:`, region.boundaries);
              return null;
            }

            return (
              <React.Fragment key={region.id || Math.random().toString()}>
                <Polygon 
                  positions={region.boundaries.map(loc => [loc.latitude, loc.longitude])}
                  pathOptions={{ 
                    color: getRegionColor(region),
                    fillColor: getRegionColor(region),
                    fillOpacity: getRegionFillOpacity(region),
                    weight: 2,
                    bubblingMouseEvents: subRegions.length > 0 && region.id === targetRegionId,
                    interactive: true
                  }}
                  eventHandlers={{
                    click: (e) => {
                      // If we have subregions and the click is on the parent region,
                      // only handle the click if we're not clicking directly on a subregion
                      if (subRegions.length > 0 && region.id === targetRegionId) {
                        // Let event propagate to potentially hit subregions
                        return;
                      }
                      handleRegionClick(region);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold">{region.name}</h3>
                      <p className="text-sm">Type: {region.type}</p>
                      <p className="text-sm">Population: {region.populationCount.toLocaleString()}</p>
                      <p className="text-sm">Avg Social Rating: {region.averageSocialRating.toFixed(1)}</p>
                      <p className="text-sm">Important Persons: {region.importantPersonsCount}</p>
                      
                      {region.underThreat && (
                        <div className="mt-2 bg-red-100 p-2 rounded-md flex items-center">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-1" />
                          <span className="text-red-700 text-sm font-medium">Under Threat</span>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Polygon>

                {region.id === targetRegionId && (
                  <Marker 
                    position={[
                      // Use the center of the region (average of all boundary points)
                      region.boundaries.reduce((sum, point) => sum + point.latitude, 0) / region.boundaries.length,
                      region.boundaries.reduce((sum, point) => sum + point.longitude, 0) / region.boundaries.length
                    ]}
                    icon={missileIcon}
                  >
                    <Popup>
                      <div className="p-2 text-center">
                        <p className="font-bold text-red-600">ORESHNIK MISSILE TARGET</p>
                        <p className="text-sm">Region: {region.name}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          })
      ) : (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}>No regions found</div>
      )}
      
      {/* Then render the subregions on top */}
      {displayRegions && displayRegions.filter(region => isSubRegion(region)).map(region => {
        console.log('Processing subregion:', region.name, 'Boundaries:', region.boundaries);
        if (!Array.isArray(region.boundaries) || region.boundaries.length < 3) {
          console.warn(`Region ${region.name} has invalid boundaries:`, region.boundaries);
          return null;
        }

        return (
          <React.Fragment key={region.id || Math.random().toString()}>
            <Polygon 
              positions={region.boundaries.map(loc => [loc.latitude, loc.longitude])}
              pathOptions={{ 
                color: getRegionColor(region),
                fillColor: getRegionColor(region),
                fillOpacity: getRegionFillOpacity(region),
                weight: 3,
                bubblingMouseEvents: false,
                interactive: true,
                pane: 'markerPane' // Use markerPane which has a higher z-index than overlayPane
              }}
              eventHandlers={{
                click: (e) => {
                  // Always stop propagation for subregion clicks
                  L.DomEvent.stopPropagation(e);
                  handleRegionClick(region);
                }
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{region.name}</h3>
                  <p className="text-sm">Type: {region.type}</p>
                  <p className="text-sm">Population: {region.populationCount.toLocaleString()}</p>
                  <p className="text-sm">Avg Social Rating: {region.averageSocialRating.toFixed(1)}</p>
                  <p className="text-sm">Important Persons: {region.importantPersonsCount}</p>
                  
                  {region.underThreat && (
                    <div className="mt-2 bg-red-100 p-2 rounded-md flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-1" />
                      <span className="text-red-700 text-sm font-medium">Under Threat</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>

            {region.id === targetRegionId && (
              <Marker 
                position={[
                  // Use the center of the region (average of all boundary points)
                  region.boundaries.reduce((sum, point) => sum + point.latitude, 0) / region.boundaries.length,
                  region.boundaries.reduce((sum, point) => sum + point.longitude, 0) / region.boundaries.length
                ]}
                icon={missileIcon}
              >
                <Popup>
                  <div className="p-2 text-center">
                    <p className="font-bold text-red-600">ORESHNIK MISSILE TARGET</p>
                    <p className="text-sm">Region: {region.name}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
      
      {currentLocation && (
        <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
          <Popup>
            <div className="p-2">
              <p className="font-bold">Your current location</p>
              <p className="text-sm">
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default RegionMap; 