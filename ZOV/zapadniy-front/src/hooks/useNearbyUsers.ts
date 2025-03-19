import { useState, useEffect } from 'react';
import { User, GeoLocation } from '../types';
import { userService, socketService } from '../services';

export function useNearbyUsers(currentLocation: GeoLocation | null, currentUserId: string | undefined, maxDistance: number = 5) {
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearbyUsers = async () => {
      if (!currentLocation) {
        setLoading(false);
        return;
      }

      try {
        const users = await userService.getUsersNearLocation(currentLocation, maxDistance);
        // Filter out the current user
        const filteredUsers = users.filter(user => user.id !== currentUserId);
        setNearbyUsers(filteredUsers);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch nearby users');
        setLoading(false);
      }
    };

    fetchNearbyUsers();

    // Set up socket listener for real-time updates
    if (socketService.isConnected()) {
      socketService.onUsersNearbyUpdate((users) => {
        const filteredUsers = users.filter(user => user.id !== currentUserId);
        setNearbyUsers(filteredUsers);
      });
    }

    // Update every 30 seconds as a fallback if socket doesn't work
    const interval = setInterval(fetchNearbyUsers, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [currentLocation, currentUserId, maxDistance]);

  const rateUser = async (userId: string, rating: number) => {
    try {
      // Pass the current user ID as the rater
      await userService.updateSocialRating(userId, rating, currentUserId);
      
      // Update the local state for the target user
      setNearbyUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, socialRating: user.socialRating + rating } 
            : user
        )
      );

      // Also update via socket for real-time
      if (socketService.isConnected() && currentUserId) {
        socketService.ratePerson(userId, rating);
      }
    } catch (err) {
      setError('Failed to rate user');
    }
  };

  return { nearbyUsers, loading, error, rateUser };
} 