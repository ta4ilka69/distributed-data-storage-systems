import { useState, useEffect } from 'react';
import { Layout, UserProfile, NearbyUsersList, RegionMap, RegionDetails, LoginForm } from './components';
import { useCurrentUser, useNearbyUsers, useRegions } from './hooks';
import { Region, RegionType, SocialStatus, User } from './types';
import { socketService } from './services';
import { authService } from './services/authService';

function App() {
  const [currentTab, setCurrentTab] = useState('profile');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  
  const { 
    currentUser, 
    loading: userLoading, 
    error: userError, 
    updateLocation, 
    setCurrentUser 
  } = useCurrentUser(loggedInUser?.id);
  
  const { 
    nearbyUsers, 
    loading: nearbyLoading, 
    error: nearbyError, 
    rateUser 
  } = useNearbyUsers(
    currentUser?.currentLocation || null,
    currentUser?.id,
    5 // 5km radius
  );
  
  const {
    regions,
    loading: regionsLoading,
    error: regionsError,
    targetRegionId,
    launchMissile,
    setTargetRegionId
  } = useRegions(RegionType.COUNTRY);

  // Add a notification system
  const [notification, setNotification] = useState<{message: string, type: 'positive' | 'negative'} | null>(null);

  // Wrap the rateUser function to add notifications
  const handleRateUser = async (userId: string, rating: number) => {
    const targetUser = nearbyUsers.find(user => user.id === userId);
    const actionType = rating > 0 ? 'positive' : 'negative';
    const previousRating = currentUser?.socialRating || 0;
    
    await rateUser(userId, rating);
    
    // Check if our rating changed after a short delay
    setTimeout(() => {
      if (currentUser && previousRating !== currentUser.socialRating) {
        const ratingChange = currentUser.socialRating - previousRating;
        const message = ratingChange > 0 
          ? `Your rating increased by ${ratingChange.toFixed(1)} for being kind to ${targetUser?.fullName}`
          : `Your rating decreased by ${Math.abs(ratingChange).toFixed(1)} for being negative to ${targetUser?.fullName}`;
        
        setNotification({
          message,
          type: ratingChange > 0 ? 'positive' : 'negative'
        });
        
        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      }
    }, 1000);
  };

  // Connect to socket when user is loaded
  useEffect(() => {
    if (currentUser?.id) {
      socketService.connect(currentUser.id);
      
      // Set up event handlers
      socketService.onUserLocationUpdate((updatedUser) => {
        if (updatedUser.id === currentUser.id) {
          // Update the current user if it's us
          setCurrentUser(updatedUser);
        }
      });
      
      socketService.onSocialRatingUpdate((updatedUser) => {
        if (updatedUser.id === currentUser.id) {
          // Update our social rating
          setCurrentUser(updatedUser);
        }
      });
    }
    
    return () => {
      socketService.disconnect();
    };
  }, [currentUser?.id]);

  // Mock geolocation updates
  useEffect(() => {
    if (!currentUser) return;
    
    // Simulate location changes for demo purposes
    const interval = setInterval(() => {
      const lat = currentUser.currentLocation.latitude + (Math.random() * 0.01 - 0.005);
      const lng = currentUser.currentLocation.longitude + (Math.random() * 0.01 - 0.005);
      
      updateLocation(lat, lng);
      
      if (socketService.isConnected()) {
        socketService.updateLocation(lat, lng);
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [currentUser, updateLocation]);

  // Add useEffect for initial auth state restoration
  useEffect(() => {
    const savedUser = authService.getAuthenticatedUser();
    if (savedUser) {
      setLoggedInUser(savedUser);
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const isGovernmentUser = currentUser?.status === SocialStatus.VIP || 
                         currentUser?.status === SocialStatus.IMPORTANT;

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    if (region && region.id) {
      setTargetRegionId(region.id);
    }
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    
    // Reset selected region when navigating away from world map
    if (tab !== 'worldmap') {
      setSelectedRegion(null);
    }
  };

  const handleLogin = (user: User) => {
    setLoggedInUser(user);
    setCurrentUser(user);
    setIsLoggedIn(true);
    authService.setAuthenticatedUser(user);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    authService.clearAuthenticatedUser();
    socketService.disconnect();
  };

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={handleLogin} />;
  }

  return (
    <Layout 
      currentUser={currentUser} 
      currentTab={currentTab} 
      onChangeTab={handleTabChange}
      onLogout={handleLogout}
    >
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg ${
          notification.type === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}
      
      {currentTab === 'profile' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <UserProfile 
            user={currentUser} 
            loading={userLoading} 
            error={userError} 
          />
        </div>
      )}
      
      {currentTab === 'nearby' && (
        <div className="bg-white rounded-lg shadow overflow-hidden p-6">
          <NearbyUsersList 
            users={nearbyUsers} 
            loading={nearbyLoading} 
            error={nearbyError} 
            onRate={handleRateUser} 
          />
        </div>
      )}
      
      {currentTab === 'worldmap' && isGovernmentUser && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[600px]">
              <RegionMap 
                regions={regions}
                currentLocation={currentUser?.currentLocation}
                targetRegionId={targetRegionId}
                onSelectRegion={handleRegionSelect}
              />
            </div>
            <div>
              <RegionDetails 
                region={selectedRegion}
                isGovernmentUser={isGovernmentUser}
                onLaunchMissile={launchMissile}
              />
            </div>
          </div>
        </div>
      )}
      
      {currentTab === 'missiles' && isGovernmentUser && (
        <div className="bg-white rounded-lg shadow overflow-hidden p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Missile Control Center</h2>
          <p className="text-gray-700">
            This feature allows government officials to manage missile deployments.
            Please use the World Map to select regions for targeting.
          </p>
          
          <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-700 font-medium">Important Notice</p>
            <p className="text-yellow-600 text-sm mt-1">
              ORESHNIK missiles can only target regions with low social ratings and no important persons.
              Use the World Map to identify suitable regions.
            </p>
          </div>
        </div>
      )}
      
      {((currentTab === 'worldmap' || currentTab === 'missiles') && !isGovernmentUser) && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
          <p className="text-red-600">
            You do not have the required privileges to access this section.
            Only users with IMPORTANT or VIP status can access government controls.
          </p>
        </div>
      )}
    </Layout>
  );
}

export default App;
