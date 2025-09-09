import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileCheck, 
  Settings, 
  LogOut,
  Award
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLocation } from 'wouter';

const IssuerSidebar = ({ activeSection, onSectionChange }) => {
  const { user, disconnect } = useAuth();
  const [, setLocation] = useLocation();
  const [displayName, setDisplayName] = useState(user?.name || 'Issuer');

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('issuerUserSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.name) {
          setDisplayName(parsedSettings.name);
        }
      } catch (error) {
        console.error('Error parsing saved issuer settings:', error);
      }
    }
  }, []);

  // Listen for settings updates
  useEffect(() => {
    const handleCustomEvent = (e) => {
      if (e.detail?.name) {
        setDisplayName(e.detail.name);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'issuerUserSettings') {
        try {
          const newSettings = JSON.parse(e.newValue);
          if (newSettings?.name) {
            setDisplayName(newSettings.name);
          }
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('issuerSettingsUpdated', handleCustomEvent);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('issuerSettingsUpdated', handleCustomEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    disconnect();
    setLocation('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'issue', label: 'Issue Credential', icon: PlusCircle },
    { id: 'issued', label: 'Issued Credentials', icon: FileCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 glass-effect border-r border-gray-800 flex-shrink-0 h-screen">
      <div className="p-6">
        {/* User Profile */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-web3-purple to-web3-cyan rounded-full flex items-center justify-center">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-white font-semibold" data-testid="sidebar-user-name">
              {displayName}
            </p>
            <p className="text-gray-400 text-sm">Issuer</p>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'text-web3-purple bg-web3-purple bg-opacity-20'
                  : 'text-gray-300 hover:text-web3-purple hover:bg-gray-800'
              }`}
              data-testid={`sidebar-nav-${item.id}`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          ))}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-red-400 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors"
            data-testid={`sidebar-nav-logout`}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </nav>
      </div>
    </div>
  );
};

export default IssuerSidebar;
