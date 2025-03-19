import React from 'react';
import { User, SocialStatus } from '../../types';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';

interface UserCardProps {
  user: User;
  onRate: (userId: string, rating: number) => void;
}

const STATUS_COLORS = {
  [SocialStatus.LOW]: 'bg-red-100 text-red-800',
  [SocialStatus.REGULAR]: 'bg-blue-100 text-blue-800',
  [SocialStatus.IMPORTANT]: 'bg-purple-100 text-purple-800',
  [SocialStatus.VIP]: 'bg-yellow-100 text-yellow-800',
};

const UserCard: React.FC<UserCardProps> = ({ user, onRate }) => {
  const distanceAgo = Math.floor((Date.now() - user.lastLocationUpdateTimestamp) / 1000 / 60);
  const lastSeen = distanceAgo < 1 
    ? 'Just now' 
    : `${distanceAgo} ${distanceAgo === 1 ? 'minute' : 'minutes'} ago`;

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg">{user.fullName}</h3>
          <p className="text-gray-500 text-sm">@{user.username}</p>
        </div>
        <span 
          className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[user.status]}`}
        >
          {user.status}
        </span>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-gray-700 font-medium">Social Rating:</span>
            <span className={`ml-2 font-bold ${
              user.socialRating < 30 ? 'text-red-600' : 
              user.socialRating < 70 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {user.socialRating}
            </span>
          </div>
          <div className="text-sm text-gray-500">Last seen: {lastSeen}</div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between">
        <button 
          className="btn-secondary flex items-center gap-1 relative group"
          onClick={() => onRate(user.id || '', -1)}
        >
          <HandThumbDownIcon className="h-5 w-5 text-red-500" />
          <span>Dislike</span>
          <span className="absolute -top-10 left-0 bg-black text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Affects your own rating negatively
          </span>
        </button>
        <button 
          className="btn-primary flex items-center gap-1 relative group"
          onClick={() => onRate(user.id || '', 1)}
        >
          <HandThumbUpIcon className="h-5 w-5 text-white" />
          <span>Like</span>
          <span className="absolute -top-10 right-0 bg-black text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Boosts your own rating too
          </span>
        </button>
      </div>
    </div>
  );
};

export default UserCard; 