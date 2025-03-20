import { useState, useEffect } from 'react';
import { User, SocialStatus } from '../types';
import { userService } from '../services';

// Mock user for development
const MOCK_USER: User = {
  id: '1',
  username: 'citizen123',
  fullName: 'Ivan Ivanov',
  socialRating: 75,
  status: SocialStatus.REGULAR,
  currentLocation: {
    latitude: 55.7558,
    longitude: 37.6173
  },
  regionId: 'moscow-region',
  districtId: 'central-district',
  countryId: 'russia',
  active: true,
  lastLocationUpdateTimestamp: Date.now()
};

export function useCurrentUser(userId?: string) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (userId) {
          // If we have a userId, fetch the user from the API
          const user = await userService.getUserById(userId);
          setCurrentUser(user);
        } else {
          // For development/testing without login
          setCurrentUser(MOCK_USER);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch current user');
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [userId]);

  const updateLocation = async (latitude: number, longitude: number) => {
    if (!currentUser || !currentUser.id) return;
    
    try {
      const updatedUser = await userService.updateUserLocation(
        currentUser.id,
        { latitude, longitude },
        currentUser.regionId,
        currentUser.districtId,
        currentUser.countryId
      );
      
      setCurrentUser(updatedUser);
    } catch (err) {
      setError('Failed to update location');
    }
  };

  return { currentUser, loading, error, updateLocation, setCurrentUser };
} 