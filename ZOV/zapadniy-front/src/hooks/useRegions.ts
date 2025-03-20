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
        // First update all region statistics to evaluate threat status
        await regionService.updateAllRegionsStatistics();
        
        // Then fetch the regions with updated data
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
      setError(null);
      await missileService.launchMissileAtRegion(regionId, MissileType.ORESHNIK);
      setTargetRegionId(regionId);
      
      // Wait a bit longer for the server to process eliminations and parent region updates
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Retrieve updated region data
      const updatedRegion = await regionService.getRegionById(regionId);
      console.log('Updated region after missile strike:', updatedRegion);
      
      // Also retrieve parent region if it exists
      if (updatedRegion.parentRegionId) {
        const updatedParent = await regionService.getRegionById(updatedRegion.parentRegionId);
        console.log('Updated parent region after missile strike:', updatedParent);
      }
      
      // Refresh all regions to update statistics
      await updateRegionStatistics();
      
      // Specifically update the display regions
      const updatedRegions = await regionService.getRegionsByType(regionType);
      setRegions(updatedRegions);
    } catch (err) {
      console.error('Failed to launch missile:', err);
      setError('Failed to launch missile. Check server logs for details.');
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