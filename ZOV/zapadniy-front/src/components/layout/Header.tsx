import React from 'react';
import { User, SocialStatus } from '../../types';
import { 
  MapIcon, 
  UserGroupIcon, 
  RocketLaunchIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  currentUser: User | null;
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  currentTab, 
  onChangeTab,
  onLogout 
}) => {
  const isGovernmentUser = currentUser?.status === SocialStatus.VIP || 
                          currentUser?.status === SocialStatus.IMPORTANT;

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">Social Rating System</h1>
          </div>
          
          {currentUser && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="font-medium">{currentUser.fullName}</span>
                <span 
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    currentUser.status === SocialStatus.LOW ? 'bg-red-100 text-red-800' : 
                    currentUser.status === SocialStatus.REGULAR ? 'bg-blue-100 text-blue-800' : 
                    currentUser.status === SocialStatus.IMPORTANT ? 'bg-purple-100 text-purple-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {currentUser.status}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
        
        <nav className="mt-4">
          <div className="flex space-x-4">
            <button
              onClick={() => onChangeTab('profile')}
              className={`${
                currentTab === 'profile'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
            >
              <UserGroupIcon className="h-5 w-5 mr-1" />
              <span>My Profile</span>
            </button>
            
            <button
              onClick={() => onChangeTab('nearby')}
              className={`${
                currentTab === 'nearby'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
            >
              <UserGroupIcon className="h-5 w-5 mr-1" />
              <span>Citizens Nearby</span>
            </button>
            
            {isGovernmentUser && (
              <button
                onClick={() => onChangeTab('worldmap')}
                className={`${
                  currentTab === 'worldmap'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
              >
                <MapIcon className="h-5 w-5 mr-1" />
                <span>World Map</span>
              </button>
            )}
            
            {isGovernmentUser && (
              <button
                onClick={() => onChangeTab('missiles')}
                className={`${
                  currentTab === 'missiles'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
              >
                <RocketLaunchIcon className="h-5 w-5 mr-1" />
                <span>Missile Control</span>
              </button>
            )}

            {isGovernmentUser && (
              <button
                onClick={() => onChangeTab('supply')}
                className={`${
                  currentTab === 'supply'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
              >
                <TruckIcon className="h-5 w-5 mr-1" />
                <span>Supply Chain</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header; 