import React from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white shadow-inner">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Social Rating System - All rights reserved
          </p>
          <p className="text-gray-400 text-xs flex items-center mt-1">
            Made with <HeartIcon className="h-3 w-3 text-red-500 mx-1" /> for the State
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Version 1.0.0 | Remember: Your social rating determines your future
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 