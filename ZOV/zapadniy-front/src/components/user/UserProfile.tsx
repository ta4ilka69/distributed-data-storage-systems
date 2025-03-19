import React from 'react';
import { User, SocialStatus } from '../../types';
import { IdentificationIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

interface UserProfileProps {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const STATUS_DESCRIPTIONS = {
  [SocialStatus.LOW]: 'Your social rating is concerning. Immediate improvement required.',
  [SocialStatus.REGULAR]: 'Your social rating is acceptable. Continue being a good citizen.',
  [SocialStatus.IMPORTANT]: 'You are an important member of society. Special privileges granted.',
  [SocialStatus.VIP]: 'You are a VIP citizen. Maximum privileges and government protection.'
};

const STATUS_COLORS = {
  [SocialStatus.LOW]: 'bg-red-100 text-red-800 border-red-300',
  [SocialStatus.REGULAR]: 'bg-blue-100 text-blue-800 border-blue-300',
  [SocialStatus.IMPORTANT]: 'bg-purple-100 text-purple-800 border-purple-300',
  [SocialStatus.VIP]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const UserProfile: React.FC<UserProfileProps> = ({ user, loading, error }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">User profile not available.</p>
      </div>
    );
  }

  const lastUpdateTime = new Date(user.lastLocationUpdateTimestamp).toLocaleTimeString();

  return (
    <div className="card p-6">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-4">
          <IdentificationIcon className="w-12 h-12 text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-bold">{user.fullName}</h2>
        <p className="text-gray-500">@{user.username}</p>
        
        <div className={`mt-4 px-4 py-2 rounded-full text-sm font-semibold border ${STATUS_COLORS[user.status]}`}>
          {user.status}
        </div>
        
        <div className="mt-6 w-full">
          <div className="relative pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-200 text-gray-600">
                  Social Rating
                </span>
              </div>
              <div>
                <span 
                  className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                    user.socialRating < 30 ? 'bg-red-200 text-red-600' : 
                    user.socialRating < 70 ? 'bg-yellow-200 text-yellow-600' : 
                    'bg-green-200 text-green-600'
                  }`}
                >
                  {user.socialRating}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 mt-1">
              <div 
                style={{ width: `${user.socialRating}%` }} 
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  user.socialRating < 30 ? 'bg-red-500' : 
                  user.socialRating < 70 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
              ></div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-2 text-center">
          {STATUS_DESCRIPTIONS[user.status]}
        </p>
        
        <div className="mt-6 w-full bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">
              Current Location: ({user.currentLocation.latitude.toFixed(4)}, {user.currentLocation.longitude.toFixed(4)})
            </span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Last Updated: {lastUpdateTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 