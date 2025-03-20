import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { User } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  currentTab, 
  onChangeTab,
  onLogout
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        currentUser={currentUser} 
        currentTab={currentTab} 
        onChangeTab={onChangeTab}
        onLogout={onLogout}
      />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout; 