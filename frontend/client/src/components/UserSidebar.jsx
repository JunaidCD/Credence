import { 
  LayoutDashboard, 
  Award, 
  Bell, 
  ShieldX, 
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLocation } from 'wouter';

const UserSidebar = ({ activeSection, onSectionChange }) => {
  const { user, disconnect } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    disconnect();
    setLocation('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'credentials', label: 'My Credentials', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'revoke-credentials', label: 'Revoke Credentials', icon: ShieldX },
  ];

  return (
    <div className="w-64 glass-effect border-r border-gray-800 flex-shrink-0 h-screen">
      <div className="p-6">
        {/* User Profile */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-web3-purple to-web3-blue rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-white font-semibold" data-testid="sidebar-user-name">
              {user?.name || 'User'}
            </p>
            <p className="text-gray-400 text-sm">User</p>
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
              {item.badge && (
                <span className="ml-auto bg-web3-purple text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-red-400 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors"
            data-testid="sidebar-nav-logout"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </nav>
      </div>
    </div>
  );
};

export default UserSidebar;
