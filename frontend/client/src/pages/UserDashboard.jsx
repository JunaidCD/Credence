import { useState, useEffect } from 'react';
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
  Archive
} from 'lucide-react';

const UserDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Revoke credentials state
  const [selectedCredentials, setSelectedCredentials] = useState([]);
  const [filter, setFilter] = useState('all'); // all, expired, old

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
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      {/* Enhanced Welcome Header */}
      <div className="mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="animate-fadeInUp">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3 animate-shimmer" data-testid="dashboard-welcome">
                Welcome back, {user.name}! ✨
              </h1>
              <p className="text-gray-300 text-lg">Manage your digital identity and verifiable credentials</p>
              <div className="flex items-center mt-4 space-x-4">
                <div className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm">Verified Identity</span>
                </div>
                <div className="text-gray-400 text-sm">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
            <div className="hidden md:block animate-bounceIn">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-float">
                  <Fingerprint className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced DID Display */}
      <Card className="credential-card mb-8 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-purple-500/30 shadow-2xl animate-slideInLeft">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-4 flex items-center text-white">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <Fingerprint className="h-5 w-5 text-white" />
                </div>
                Your Decentralized Identity (DID)
              </h3>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                <code className="relative block text-sm text-gray-100 bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 rounded-xl font-mono break-all border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300" data-testid="user-did">
                  {user.did}
                </code>
              </div>
            </div>
            <Button
              onClick={copyDID}
              size="sm"
              className="ml-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 text-sm rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              data-testid="button-copy-did"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy DID
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Quick Stats */}
      <div className="grid md:grid-cols-3 gap-8 mb-10">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 animate-slideInUp">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium mb-2">Total Credentials</p>
                <div className="flex items-center space-x-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent animate-countUp" data-testid="stat-credentials">
                    {myCredentials.length}
                  </p>
                  <div className="text-green-400 text-sm font-semibold bg-green-400/10 px-2 py-1 rounded-full">
                    +12%
                  </div>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2 mt-3">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full animate-progressBar" style={{width: '75%'}}></div>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 animate-float">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full opacity-75"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm border-blue-500/30 hover:border-blue-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 animate-slideInUp" style={{animationDelay: '0.1s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium mb-2">Pending Requests</p>
                <div className="flex items-center space-x-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent animate-countUp" data-testid="stat-pending">
                    {verificationRequests.filter(r => r.status === 'pending').length}
                  </p>
                  <div className="text-yellow-400 text-sm font-semibold bg-yellow-400/10 px-2 py-1 rounded-full">
                    +8%
                  </div>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2 mt-3">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-progressBar" style={{width: '60%', animationDelay: '0.2s'}}></div>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 animate-float" style={{animationDelay: '0.5s'}}>
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full opacity-75"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden bg-gradient-to-br from-cyan-900/40 to-cyan-800/40 backdrop-blur-sm border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 animate-slideInUp" style={{animationDelay: '0.2s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium mb-2">Verified Shares</p>
                <div className="flex items-center space-x-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent animate-countUp" data-testid="stat-shares">
                    {verificationRequests.filter(r => r.status === 'approved').length}
                  </p>
                  <div className="text-green-400 text-sm font-semibold bg-green-400/10 px-2 py-1 rounded-full">
                    +15%
                  </div>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2 mt-3">
                  <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full animate-progressBar" style={{width: '85%', animationDelay: '0.4s'}}></div>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 animate-float" style={{animationDelay: '1s'}}>
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full opacity-75"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recent Activity */}
      <Card className="group relative overflow-hidden bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 shadow-2xl animate-slideInUp" style={{animationDelay: '0.3s'}}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-blue-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center text-xl font-bold text-white">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Activity className="h-5 w-5 text-white" />
            </div>
            Recent Activity
            <div className="ml-auto">
              <div className="w-3 h-3 bg-green-400 rounded-full opacity-75"></div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
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
                <div key={request.id} className="group/item relative p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 transform hover:scale-[1.02] animate-slideInLeft" style={{animationDelay: `${index * 0.1}s`}} data-testid={`activity-${index}`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
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

      {/* Quick Actions */}
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <Card 
          className="group relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer animate-slideInLeft"
          onClick={() => setActiveSection('credentials')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">My Credentials</h3>
                <p className="text-gray-300">View and manage your digital credentials</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 animate-float">
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="group relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm border-blue-500/30 hover:border-blue-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer animate-slideInRight"
          onClick={() => setActiveSection('notifications')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Notifications</h3>
                <p className="text-gray-300">View verification requests and notifications</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 animate-float" style={{animationDelay: '0.5s'}}>
                <Bell className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCredentials = () => (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      {/* Enhanced Header */}
      <div className="mb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/30">
          <div className="animate-fadeInUp">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3 animate-shimmer">My Credentials ✨</h1>
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
            <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-cyan-500/10 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
          </div>
          
          {/* Enhanced Empty State */}
          <div className="relative text-center py-20 animate-fadeInUp">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-2xl animate-pulse"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm border border-purple-500/30 rounded-full flex items-center justify-center mx-auto animate-float">
                <Award className="h-16 w-16 text-purple-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center opacity-75">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4 animate-shimmer">
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
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-blue-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {credential.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokeCredential(credential.id)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400 rounded-xl font-semibold transition-all duration-300"
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
