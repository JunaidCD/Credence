import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import UserSidebar from '@/components/UserSidebar';
import CredentialCard from '@/components/CredentialCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Fingerprint, 
  Award, 
  Clock, 
  CheckCircle, 
  Activity, 
  Copy,
  Check,
  X,
  Bell,
  Shield,
  Trash2,
  Eye,
  User,
  Wallet,
  Plus,
  ShieldX,
  Archive,
  Sparkles,
  TrendingUp,
  Zap,
  Star,
  Globe,
  Layers,
  Calendar
} from 'lucide-react';

// Advanced CSS styles for modern UI effects
const styles = `
  .glass-effect {
    background: rgba(17, 25, 40, 0.75);
    backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.125);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  .credential-card {
    background: linear-gradient(135deg, rgba(17, 25, 40, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(139, 92, 246, 0.3);
    box-shadow: 0 20px 40px rgba(139, 92, 246, 0.1);
  }
  
  .advanced-card {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(17, 25, 40, 0.9) 100%);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(139, 92, 246, 0.2);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .advanced-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 35px 70px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: rgba(139, 92, 246, 0.4);
  }
  
  .neon-glow {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1);
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #8B5CF6, #06B6D4, #10B981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .floating-element {
    position: relative;
    z-index: 1;
  }
  
  .floating-element::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #8B5CF6, #06B6D4, #10B981, #F59E0B);
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .floating-element:hover::before {
    opacity: 0.7;
  }
  
  .mesh-gradient {
    background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
  }
`;

const UserDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Revoke credentials state
  const [selectedCredentials, setSelectedCredentials] = useState([]);
  const [filter, setFilter] = useState('all'); // all, expired, old

  
  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Inject CSS styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== 'user')) {
      setLocation('/');
    }
  }, [isAuthenticated, user, setLocation]);

  // Queries - User-specific data
  const { data: myCredentials = [], isLoading: credentialsLoading } = useQuery({
    queryKey: ['/api/credentials/user', user?.id],
    enabled: !!user?.id,
  });

  const { data: verificationRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/verification-requests/user', user?.id],
    enabled: !!user?.id,
  });

  // Mutations
  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }) => {
      const response = await fetch(`/api/verification-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/verification-requests/user'] });
    }
  });

  const revokeCredentialMutation = useMutation({
    mutationFn: async (credentialId) => {
      const response = await fetch(`/api/credentials/${credentialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revoked' })
      });
      if (!response.ok) throw new Error('Failed to revoke credential');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['credentials', user?.id]);
      toast({
        title: "Success",
        description: "Credential revoked successfully",
      });
      setSelectedCredentials([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleApproveRequest = (requestId) => {
    updateRequestMutation.mutate({ requestId, status: 'approved' });
    toast({
      title: "Request Approved",
      description: "Verification request has been approved successfully!",
    });
  };

  const handleRejectRequest = (requestId) => {
    updateRequestMutation.mutate({ requestId, status: 'rejected' });
    toast({
      title: "Request Rejected", 
      description: "Verification request has been rejected.",
    });
  };

  const handleRevokeCredential = (credentialId) => {
    revokeCredentialMutation.mutate(credentialId);
  };

  const copyDID = () => {
    if (user?.did) {
      navigator.clipboard.writeText(user.did);
      toast({
        title: "DID Copied",
        description: "Your DID has been copied to clipboard!",
      });
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const renderDashboard = () => (
    <div className="p-6 space-y-8">
      {/* Enhanced Header with Welcome Message */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 p-8 border border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2" data-testid="dashboard-welcome">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-300 text-lg">Manage your digital identity and verifiable credentials</p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-yellow-400" />
              <div className="text-right">
                <p className="text-sm text-gray-400">Current Time</p>
                <p className="text-white font-semibold">{currentTime.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Verified Identity</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced DID Display */}
      <Card className="credential-card mb-8 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-purple-500/30 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Your User DID</h3>
                <p className="text-gray-400 text-sm mb-3">Your unique decentralized identifier</p>
                <div className="flex items-center space-x-3">
                  <code className="bg-gray-800/80 text-purple-300 px-4 py-2 rounded-lg font-mono text-sm border border-purple-500/20">
                    {user?.did || `did:ethr:0x${user?.id ? user.id.slice(-8) : '...'}`}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-200"
                    onClick={() => {
                      const didToCopy = user?.did || `did:ethr:0x${user?.id ? user.id.slice(-8) : '...'}`;
                      navigator.clipboard.writeText(didToCopy);
                      toast({
                        title: "DID Copied",
                        description: "Your DID has been copied to clipboard",
                      });
                    }}
                  >
                    Copy DID
                  </Button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2 text-green-400 text-sm mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified User</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-400 text-sm">
                  <Activity className="h-4 w-4" />
                  <span>Active Status</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Quick Stats with Animations */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass-effect group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-purple-800/10 opacity-0 group-hover:opacity-100"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-purple-600/20 group-hover:bg-purple-600/30">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Credentials</p>
                  <p className="text-3xl font-bold text-white group-hover:text-purple-300" data-testid="stat-total-credentials">
                    {myCredentials.length}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-green-400 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+12%</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full" style={{width: '75%'}}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-800/10 opacity-0 group-hover:opacity-100"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-blue-600/20 group-hover:bg-blue-600/30">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Pending Requests</p>
                  <p className="text-3xl font-bold text-white group-hover:text-blue-300" data-testid="stat-pending-requests">
                    {verificationRequests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-green-400 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+8%</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full" style={{width: '60%'}}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-cyan-800/10 opacity-0 group-hover:opacity-100"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-cyan-600/20 group-hover:bg-cyan-600/30">
                  <CheckCircle className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Verified Shares</p>
                  <p className="text-3xl font-bold text-white group-hover:text-cyan-300" data-testid="stat-verified-shares">
                    {verificationRequests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-green-400 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+15%</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-2 rounded-full" style={{width: '85%'}}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recent Activity */}
      <Card className="glass-effect group">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <div className="p-2 rounded-lg bg-purple-600/20 mr-3">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              Recent Activity
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Last 30 days</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : verificationRequests.length === 0 ? (
            <div className="text-center py-12 animate-fadeIn">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg font-medium">No recent activity</p>
              <p className="text-gray-500 text-sm mt-2">Your credential activities will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verificationRequests.slice(0, 3).map((request, index) => (
                <div key={request.id} className="group/item relative p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-purple-500/30" data-testid={`activity-${index}`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-xl opacity-0 group-hover/item:opacity-100"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-4 ${
                        request.status === 'approved' ? 'bg-green-500 shadow-lg shadow-green-500/50' :
                        request.status === 'rejected' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                      }`}></div>
                      <div>
                        <p className="text-white font-medium">
                          {request.status === 'approved' ? '✅ Shared' : '📋 Request for'} {request.credentialType} 
                          {request.verifier && ` with ${request.verifier.name}`}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          🕒 {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-bold capitalize px-3 py-1 rounded-full ${
                        request.status === 'approved' ? 'text-green-400 bg-green-400/10 border border-green-400/30' :
                        request.status === 'rejected' ? 'text-red-400 bg-red-400/10 border border-red-400/30' : 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Quick Actions */}
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <div 
          className="advanced-card rounded-3xl p-10 floating-element group cursor-pointer relative overflow-hidden"
          onClick={() => setActiveSection('credentials')}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl"></div>
          <div className="relative z-10 text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 flex items-center justify-center shadow-2xl neon-glow">
                <Award className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-300">My Credentials</h3>
            <p className="text-gray-400 text-lg group-hover:text-gray-300">Manage your digital identity assets</p>
          </div>
        </div>

        <div 
          className="advanced-card rounded-3xl p-10 floating-element group cursor-pointer relative overflow-hidden"
          onClick={() => setActiveSection('notifications')}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-xl"></div>
          <div className="relative z-10 text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 flex items-center justify-center shadow-2xl neon-glow">
                <Bell className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300">Notifications</h3>
            <p className="text-gray-400 text-lg group-hover:text-gray-300">Stay updated with activities</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCredentials = () => (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      {/* Enhanced Header */}
      <div className="mb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/30">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">My Credentials ✨</h1>
            <p className="text-gray-300 text-lg">View and manage your verifiable credentials</p>
            <div className="flex items-center mt-4 space-x-4">
              <div className="flex items-center text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span className="text-sm">Credential Vault</span>
              </div>
              <div className="text-gray-400 text-sm">
                {myCredentials.length} {myCredentials.length === 1 ? 'Credential' : 'Credentials'} Stored
              </div>
            </div>
          </div>
        </div>
      </div>

      {credentialsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 h-80">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-gray-700 rounded-2xl"></div>
                  <div className="w-20 h-6 bg-gray-700 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                </div>
                <div className="mt-8 space-y-2">
                  <div className="h-3 bg-gray-800 rounded w-full"></div>
                  <div className="h-3 bg-gray-800 rounded w-4/5"></div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <div className="w-20 h-8 bg-gray-700 rounded-lg"></div>
                  <div className="w-16 h-8 bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : myCredentials.length === 0 ? (
        <div className="relative">
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-cyan-500/10 rounded-full blur-xl"></div>
          </div>
          
          {/* Enhanced Empty State */}
          <div className="relative text-center py-20">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-2xl animate-pulse"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm border border-purple-500/30 rounded-full flex items-center justify-center mx-auto">
                <Award className="h-16 w-16 text-purple-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center opacity-75">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              No Credentials Yet
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Your credential vault is empty. Start building your digital identity by adding your first verifiable credential.
            </p>
            
            {/* Feature Highlights */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 animate-slideInUp">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-float">
                  <Fingerprint className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Secure Storage</h4>
                <p className="text-gray-400 text-sm">Your credentials are encrypted and stored securely on the blockchain</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 animate-slideInUp" style={{animationDelay: '0.1s'}}>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-float" style={{animationDelay: '0.5s'}}>
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Instant Verification</h4>
                <p className="text-gray-400 text-sm">Share and verify your credentials instantly with trusted parties</p>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 animate-slideInUp" style={{animationDelay: '0.2s'}}>
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-float" style={{animationDelay: '1s'}}>
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Full Control</h4>
                <p className="text-gray-400 text-sm">You own and control your credentials - no third-party dependencies</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowCredentialForm(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-4 text-lg rounded-2xl font-bold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="mr-3 h-6 w-6" />
              Add Your First Credential
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myCredentials.map((credential, index) => (
            <Card key={credential.id} className="group relative overflow-hidden bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 animate-slideInUp" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-blue-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center group-hover:rotate-12">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <span className={`text-sm font-bold capitalize px-3 py-1 rounded-full ${
                    credential.status === 'active' ? 'text-green-400 bg-green-400/10 border border-green-400/30' :
                    credential.status === 'expired' ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30' :
                    credential.status === 'revoked' ? 'text-red-400 bg-red-400/10 border border-red-400/30' : 'text-blue-400 bg-blue-400/10 border border-blue-400/30'
                  }`}>
                    {credential.status || 'Active'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{credential.type || 'Digital Certificate'}</h3>
                    <p className="text-gray-300 text-sm">Issued by: <span className="font-semibold">{credential.issuerName || 'Unknown Issuer'}</span></p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Credential ID:</span>
                      <span className="text-gray-300 font-mono">{credential.id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Issue Date:</span>
                      <span className="text-gray-300">{new Date(credential.issuedAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Expiry Date:</span>
                      <span className="text-gray-300">{credential.expiryDate ? new Date(credential.expiryDate).toLocaleDateString() : 'No Expiry'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex space-x-3">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {credential.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokeCredential(credential.id)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400 rounded-xl font-semibold"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderNotifications = () => {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Notifications
          </h1>
          <p className="text-gray-300 text-lg">
            Stay updated with your credential activities
          </p>
        </div>

        <div className="space-y-4">
          <Card className="glass-effect border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Notifications</h3>
                  <p className="text-gray-400">You're all caught up! No new notifications at this time.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderRevokeCredentials = () => {

    const handleBulkRevoke = async () => {
      if (selectedCredentials.length === 0) return;
      
      try {
        await Promise.all(
          selectedCredentials.map(id => revokeCredentialMutation.mutateAsync(id))
        );
      } catch (error) {
        console.error('Bulk revoke failed:', error);
      }
    };

    const toggleCredentialSelection = (credentialId) => {
      setSelectedCredentials(prev => 
        prev.includes(credentialId) 
          ? prev.filter(id => id !== credentialId)
          : [...prev, credentialId]
      );
    };

    const getFilteredCredentials = () => {
      if (!myCredentials) return [];
      
      const now = new Date();
      return myCredentials.filter(cred => {
        if (cred.status === 'revoked') return false;
        
        switch (filter) {
          case 'expired':
            return new Date(cred.expiryDate) < now;
          case 'old':
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return new Date(cred.issuedAt) < sixMonthsAgo;
          default:
            return true;
        }
      });
    };

    const filteredCredentials = getFilteredCredentials();
    const expiredCount = myCredentials?.filter(c => c.status !== 'revoked' && new Date(c.expiryDate) < new Date()).length || 0;
    const oldCount = myCredentials?.filter(c => {
      if (c.status === 'revoked') return false;
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return new Date(c.issuedAt) < sixMonthsAgo;
    }).length || 0;

    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
            Revoke Credentials
          </h1>
          <p className="text-gray-300 text-lg">
            Manage and invalidate old or expired credentials
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect border-red-500/20 hover:border-red-400/40 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-sm font-medium">Expired Credentials</p>
                  <p className="text-3xl font-bold text-white">{expiredCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-orange-500/20 hover:border-orange-400/40 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-400 text-sm font-medium">Old Credentials (6+ months)</p>
                  <p className="text-3xl font-bold text-white">{oldCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Archive className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium">Selected for Revocation</p>
                  <p className="text-3xl font-bold text-white">{selectedCredentials.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg w-fit">
          {[
            { id: 'all', label: 'All Credentials', count: filteredCredentials.length },
            { id: 'expired', label: 'Expired', count: expiredCount },
            { id: 'old', label: 'Old (6+ months)', count: oldCount }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === tab.id
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedCredentials.length > 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-red-400" />
                <span className="text-red-400 font-medium">
                  {selectedCredentials.length} credential(s) selected for revocation
                </span>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCredentials([])}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkRevoke}
                  disabled={revokeCredentialMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {revokeCredentialMutation.isPending ? 'Revoking...' : 'Revoke Selected'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Credentials List */}
        {credentialsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-effect border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-6 h-6 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="w-20 h-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCredentials.length === 0 ? (
          <Card className="glass-effect border-gray-700/50">
            <CardContent className="p-12">
              <div className="text-center">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {filter === 'all' ? 'No Credentials to Revoke' : 
                   filter === 'expired' ? 'No Expired Credentials' : 
                   'No Old Credentials'}
                </h3>
                <p className="text-gray-400">
                  {filter === 'all' ? 'All your credentials are active and valid.' :
                   filter === 'expired' ? 'All your credentials are still valid.' :
                   'All your credentials are recent.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCredentials.map((credential) => {
              const isExpired = new Date(credential.expiryDate) < new Date();
              const isOld = (() => {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return new Date(credential.issuedAt) < sixMonthsAgo;
              })();
              const isSelected = selectedCredentials.includes(credential.id);

              return (
                <Card key={credential.id} className={`glass-effect transition-all duration-300 ${
                  isSelected ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700/50 hover:border-gray-600/50'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCredentialSelection(credential.id)}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500 focus:ring-offset-gray-800"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{credential.type}</h3>
                          <div className="flex space-x-2">
                            {isExpired && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                                Expired
                              </span>
                            )}
                            {isOld && (
                              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                                Old
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Issued</p>
                            <p className="text-gray-200">{new Date(credential.issuedAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Expires</p>
                            <p className={`${isExpired ? 'text-red-400' : 'text-gray-200'}`}>
                              {new Date(credential.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Issuer</p>
                            <p className="text-gray-200">{credential.issuer?.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Status</p>
                            <p className="text-green-400">{credential.status}</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeCredentialMutation.mutate(credential.id)}
                        disabled={revokeCredentialMutation.isPending}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      <UserSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'credentials' && renderCredentials()}
        {activeSection === 'notifications' && renderNotifications()}
        {activeSection === 'revoke-credentials' && renderRevokeCredentials()}
      </div>
    </div>
  );
};

export default UserDashboard;
