import { 
  LayoutDashboard, 
  Award, 
  Share2, 
  Bell, 
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

const UserSidebar = ({ activeSection, onSectionChange, userDID }) => {
  const { user, disconnect } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch notifications to get unread count
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'user', userDID],
    queryFn: async () => {
      if (!userDID) return [];
      try {
        // First get user by DID to get user ID
        const userResponse = await fetch(`/api/users/did/${encodeURIComponent(userDID)}`);
        if (!userResponse.ok) return [];
        const userData = await userResponse.json();
        
        // Then fetch notifications for this user
        const notificationsResponse = await fetch(`/api/notifications/user/${userData.id}`);
        if (!notificationsResponse.ok) return [];
        return notificationsResponse.json();
      } catch (error) {
        console.error('Failed to fetch notifications for sidebar:', error);
        return [];
      }
    },
    enabled: !!userDID,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    disconnect();
    setLocation('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'credentials', label: 'My Credentials', icon: Award },
    { id: 'share-credential', label: 'Share Credential', icon: Share2 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
  ];

  return (
    <div className="w-64 glass-effect border-r border-gray-800 flex-shrink-0 h-screen fixed left-0 top-0 overflow-y-auto">
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
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
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
