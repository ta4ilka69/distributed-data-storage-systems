import { useState, useEffect } from 'react';
import { MissileType, Region, RegionType } from '../types';
import { regionService, missileService, socketService } from '../services';

export function useRegions(regionType: RegionType = RegionType.COUNTRY) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetRegionId, setTargetRegionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const fetchedRegions = await regionService.getRegionsByType(regionType);
        console.log('Fetched regions:', fetchedRegions);
        setRegions(fetchedRegions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError('Failed to fetch regions');
        setLoading(false);
      }
    };

    fetchRegions();

    // Set up socket listener for real-time updates
    if (socketService.isConnected()) {
      socketService.onRegionStatusUpdate((updatedRegion) => {
        if (updatedRegion.type === regionType) {
          setRegions(prevRegions => 
            prevRegions.map(region => 
              region.id === updatedRegion.id ? updatedRegion : region
            )
          );
        }
      });
    }
  }, [regionType]);

  const getRegionColor = (region: Region): string => {
    if (region.underThreat) {
      return 'red';
    }
    
    if (region.averageSocialRating < 30) {
      return 'orange';
    }
    
    return 'green';
  };

  const fetchSubRegions = async (parentId: string): Promise<Region[]> => {
    try {
      return await regionService.getSubRegions(parentId);
    } catch (err) {
      setError('Failed to fetch sub-regions');
      return [];
    }
  };

  const updateRegionStatistics = async () => {
    try {
      await regionService.updateAllRegionsStatistics();
      // Refetch regions to get updated data
      const updatedRegions = await regionService.getRegionsByType(regionType);
      setRegions(updatedRegions);
    } catch (err) {
      setError('Failed to update region statistics');
    }
  };

  const launchMissile = async (regionId: string) => {
    try {
      await missileService.launchMissileAtRegion(regionId, MissileType.ORESHNIK);
      setTargetRegionId(regionId);
      
      // Update the region status
      const updatedRegion = await regionService.getRegionById(regionId);
      setRegions(prevRegions => 
        prevRegions.map(region => 
          region.id === regionId ? updatedRegion : region
        )
      );
    } catch (err) {
      setError('Failed to launch missile');
    }
  };

  return { 
    regions, 
    loading, 
    error, 
    targetRegionId,
    getRegionColor,
    fetchSubRegions,
    updateRegionStatistics,
    launchMissile,
    setTargetRegionId
  };
} 