import { 
  LayoutDashboard, 
  Search, 
  CheckCircle, 
  Settings, 
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLocation } from 'wouter';

const VerifierSidebar = ({ activeSection, setActiveSection }) => {
  const { user, disconnect } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    disconnect();
    setLocation('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'search', label: 'Search DID', icon: Search },
    { id: 'approved-requests', label: 'Approve Credential', icon: CheckCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 glass-effect border-r border-gray-800 flex-shrink-0 h-screen">
      <div className="p-6">
        {/* User Profile */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-web3-blue to-web3-cyan rounded-full flex items-center justify-center">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-white font-semibold" data-testid="sidebar-user-name">
              {user?.name || 'Verifier'}
            </p>
            <p className="text-gray-400 text-sm">Verifier</p>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'text-web3-blue bg-web3-blue bg-opacity-20'
                  : 'text-gray-300 hover:text-web3-blue hover:bg-gray-800'
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

export default VerifierSidebar;
