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

  useEffect(() => {
    if (currentLocation) {
      setCenter([currentLocation.latitude, currentLocation.longitude]);
    }
  }, [currentLocation]);

  // Add effect to update center when a region is targeted
  useEffect(() => {
    if (targetRegionId && regions) {
      const targetRegion = regions.find(r => r.id === targetRegionId);
      if (targetRegion && targetRegion.boundaries && targetRegion.boundaries.length > 0) {
        const lat = targetRegion.boundaries.reduce((sum, point) => sum + point.latitude, 0) / targetRegion.boundaries.length;
        const lng = targetRegion.boundaries.reduce((sum, point) => sum + point.longitude, 0) / targetRegion.boundaries.length;
        setCenter([lat, lng]);
      }
    }
  }, [targetRegionId, regions]);

  // Fetch and display subregions
  useEffect(() => {
    const fetchSubRegions = async () => {
      if (targetRegionId) {
        const subRegions = await regionService.getSubRegions(targetRegionId);
        setSubRegions(subRegions);
      } else {
        setSubRegions([]);
      }
    };
    fetchSubRegions();
  }, [targetRegionId]);

  const [subRegions, setSubRegions] = useState<Region[]>([]);

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
    if (region.id === targetRegionId) {
      return 0.8; // More opaque for targeted region
    }
    return 0.3; // Default opacity
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
      
      {regions && regions.length > 0 ? (
        regions.map(region => {
          console.log('Processing region:', region.name, 'Boundaries:', region.boundaries);
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
                  fillOpacity: getRegionFillOpacity(region)
                }}
                eventHandlers={{
                  click: () => handleRegionClick(region)
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

      {subRegions.map(subRegion => (
        <Polygon 
          key={subRegion.id}
          positions={subRegion.boundaries.map(loc => [loc.latitude, loc.longitude])}
          pathOptions={{ 
            color: getRegionColor(subRegion),
            fillColor: getRegionColor(subRegion),
            fillOpacity: getRegionFillOpacity(subRegion)
          }}
          eventHandlers={{
            click: () => handleRegionClick(subRegion)
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">{subRegion.name}</h3>
              <p className="text-sm">Type: {subRegion.type}</p>
              <p className="text-sm">Population: {subRegion.populationCount.toLocaleString()}</p>
              <p className="text-sm">Avg Social Rating: {subRegion.averageSocialRating.toFixed(1)}</p>
              <p className="text-sm">Important Persons: {subRegion.importantPersonsCount}</p>
            </div>
          </Popup>
        </Polygon>
      ))}
    </MapContainer>
  );
};

export default RegionMap; 