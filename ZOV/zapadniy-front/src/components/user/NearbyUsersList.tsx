import React from 'react';
import { User } from '../../types';
import UserCard from './UserCard';

interface NearbyUsersListProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onRate: (userId: string, rating: number) => void;
}

const NearbyUsersList: React.FC<NearbyUsersListProps> = ({ 
  users, 
  loading,
  error,
  onRate
}) => {
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

  if (users.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No citizens detected nearby.</p>
        <p className="text-gray-400 text-sm mt-2">Move to a more populated area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Citizens Nearby</h2>
      <div className="divide-y divide-gray-100">
        {users.map(user => (
          <UserCard key={user.id} user={user} onRate={onRate} />
        ))}
      </div>
    </div>
  );
};

export default NearbyUsersList;
