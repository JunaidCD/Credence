import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import UserSidebar from '@/components/UserSidebar';
import CredentialCard from '@/components/CredentialCard';
import CredentialForm from '@/components/CredentialForm';
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
  Plus,
  Check,
  X,
  Building,
  Briefcase,
  User,
  Save,
  Wallet
} from 'lucide-react';

const UserDashboard = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    employeeId: ''
  });
  const [isFormChanged, setIsFormChanged] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  // Initialize profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: '',
        designation: '',
        department: '',
        employeeId: ''
      });
      setIsFormChanged(false);
    }
  }, [user]);

  // Queries
  const { data: credentials = [], isLoading: credentialsLoading } = useQuery({
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
                    {credentials.length}
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
        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer animate-slideInLeft">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Issue New Credential</h3>
                <p className="text-gray-300">Create and issue a new verifiable credential</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 animate-float">
                <Plus className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm border-blue-500/30 hover:border-blue-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer animate-slideInRight">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">View All Credentials</h3>
                <p className="text-gray-300">Browse and manage your credential collection</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 animate-float" style={{animationDelay: '0.5s'}}>
                <Award className="h-8 w-8 text-white" />
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
          <div className="flex justify-between items-center">
            <div className="animate-fadeInUp">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3 animate-shimmer">My Credentials ✨</h1>
              <p className="text-gray-300 text-lg">Manage and share your verifiable credentials</p>
              <div className="flex items-center mt-4 space-x-4">
                <div className="flex items-center text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-sm">Credential Vault</span>
                </div>
                <div className="text-gray-400 text-sm">
                  {credentials.length} {credentials.length === 1 ? 'Credential' : 'Credentials'} Stored
                </div>
              </div>
            </div>
            <div className="animate-bounceIn">
              <Button
                onClick={() => setShowCredentialForm(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg rounded-2xl font-bold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 flex items-center"
                data-testid="button-add-credential"
              >
                <Plus className="mr-3 h-6 w-6" />
                Add Credential
              </Button>
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
      ) : credentials.length === 0 ? (
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
          {credentials.map((credential, index) => (
            <div key={credential.id} className="animate-slideInUp" style={{animationDelay: `${index * 0.1}s`}}>
              <CredentialCard credential={credential} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRequests = () => (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Verification Requests</h1>
        <p className="text-gray-400">Review and respond to credential verification requests</p>
      </div>

      {requestsLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : verificationRequests.filter(r => r.status === 'pending').length === 0 ? (
        <div className="text-center py-16">
          <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Pending Requests</h3>
          <p className="text-gray-400">You're all caught up! New verification requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {verificationRequests
            .filter(request => request.status === 'pending')
            .map((request, index) => (
            <Card key={request.id} className="glass-effect">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-web3-blue to-web3-purple rounded-full flex items-center justify-center mr-3">
                        {request.verifier?.userType === 'verifier' ? 
                          <Building className="h-5 w-5 text-white" /> :
                          <Briefcase className="h-5 w-5 text-white" />
                        }
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white" data-testid={`request-verifier-${index}`}>
                          {request.verifier?.name || 'Unknown Verifier'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Verification Request • {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4" data-testid={`request-message-${index}`}>
                      {request.message || `Requesting verification of your ${request.credentialType}.`}
                    </p>
                    <div className="flex items-center text-sm text-gray-400">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Credential: {request.credentialType}</span>
                    </div>
                  </div>
                  <div className="flex space-x-3 ml-6">
                    <Button
                      onClick={() => handleRejectRequest(request.id)}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      data-testid={`button-reject-${index}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproveRequest(request.id)}
                      className="glow-button text-white"
                      data-testid={`button-approve-${index}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setIsFormChanged(true);
  };

  const validateForm = () => {
    const requiredFields = ['name', 'email', 'phone', 'designation', 'department', 'employeeId'];
    const emptyFields = requiredFields.filter(field => !profileData[field]?.trim());
    
    if (emptyFields.length > 0) {
      toast({
        title: "Validation Error",
        description: "All fields are required. Please fill in all information.",
        variant: "destructive"
      });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // Update user data in the context so it reflects throughout the app
    updateUser({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      designation: profileData.designation,
      department: profileData.department,
      employeeId: profileData.employeeId
    });

    toast({
      title: "Profile Updated!",
      description: "Your profile information has been saved successfully.",
    });
    setIsFormChanged(false);
  };

  const handleReset = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      designation: '',
      department: '',
      employeeId: ''
    });
    setIsFormChanged(false);
    toast({
      title: "Form Reset",
      description: "All fields have been reset to their original values.",
    });
  };

  const renderSettings = () => {

    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        {/* Enhanced Settings Header */}
        <div className="mb-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl"></div>
          <div className="relative bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="animate-fadeInUp">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3 animate-shimmer">Settings </h1>
                <p className="text-gray-300 text-lg">Manage your account and privacy settings</p>
                <div className="flex items-center mt-4 space-x-4">
                  <div className="flex items-center text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm">Account Active</span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    Profile Configuration
                  </div>
                </div>
              </div>
              <div className="hidden md:block animate-bounceIn">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-float">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl space-y-8">
          {/* Enhanced Profile Information */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 shadow-2xl animate-slideInUp">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center text-xl font-bold text-white">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-white" />
                </div>
                Profile Information
                <div className="ml-auto">
                  <div className="w-3 h-3 bg-purple-400 rounded-full opacity-75"></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="group/input">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Full Name *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-purple-500/30 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 hover:border-purple-400/50 group-hover/input:shadow-lg group-hover/input:shadow-purple-500/10"
                      data-testid="input-display-name"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-xl opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div className="group/input">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Email Address *</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-purple-500/30 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 hover:border-purple-400/50 group-hover/input:shadow-lg group-hover/input:shadow-purple-500/10"
                      data-testid="input-email"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-xl opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
              </div>
              <div className="group/input">
                <label className="block text-sm font-semibold text-gray-200 mb-3">Phone Number *</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    required
                    className="w-full bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-purple-500/30 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 hover:border-purple-400/50 group-hover/input:shadow-lg group-hover/input:shadow-purple-500/10"
                    data-testid="input-phone"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-xl opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Institutional Information */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm border-blue-500/30 hover:border-blue-400/50 transition-all duration-500 shadow-2xl animate-slideInUp" style={{animationDelay: '0.1s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center text-xl font-bold text-white">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Building className="h-5 w-5 text-white" />
                </div>
                Institutional Information
                <div className="ml-auto">
                  <div className="w-3 h-3 bg-blue-400 rounded-full opacity-75"></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="group/input">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Designation *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={profileData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      placeholder="e.g., Professor, Assistant Professor, Lecturer"
                      required
                      className="w-full bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-blue-500/30 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:border-blue-400/50 group-hover/input:shadow-lg group-hover/input:shadow-blue-500/10"
                      data-testid="input-designation"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 rounded-xl opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div className="group/input">
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Department *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={profileData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="e.g., Computer Science, Mathematics"
                      required
                      className="w-full bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-blue-500/30 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:border-blue-400/50 group-hover/input:shadow-lg group-hover/input:shadow-blue-500/10"
                      data-testid="input-department"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 rounded-xl opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
              </div>
              <div className="group/input">
                <label className="block text-sm font-semibold text-gray-200 mb-3">Employee ID *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={profileData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    placeholder="Enter your employee ID"
                    required
                    className="w-full bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-blue-500/30 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:border-blue-400/50 group-hover/input:shadow-lg group-hover/input:shadow-blue-500/10"
                    data-testid="input-employee-id"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 rounded-xl opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Action Buttons */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 shadow-2xl animate-slideInUp" style={{animationDelay: '0.2s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-blue-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-2 border-gray-600/50 text-gray-300 hover:bg-gray-800/80 hover:text-white hover:border-gray-500 px-8 py-3 flex items-center rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  data-testid="button-reset-form"
                >
                  <X className="mr-2 h-5 w-5" />
                  Reset Form
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!isFormChanged}
                  className={`px-10 py-3 font-bold flex items-center rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isFormChanged 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-purple-500/25' 
                      : 'bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
                  }`}
                  data-testid="button-save-profile"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Save Changes
                </Button>
              </div>
              {isFormChanged && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl">
                  <p className="text-yellow-400 text-sm font-medium flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 opacity-75"></div>
                    You have unsaved changes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Connected Wallet */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-cyan-900/40 to-cyan-800/40 backdrop-blur-sm border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-500 shadow-2xl animate-slideInUp" style={{animationDelay: '0.3s'}}>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center text-xl font-bold text-white">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                Connected Wallet
                <div className="ml-auto">
                  <div className="w-3 h-3 bg-green-400 rounded-full opacity-75"></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4 animate-float">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">MetaMask</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-300 text-sm font-mono bg-gray-800/50 px-3 py-1 rounded-lg border border-cyan-500/20" data-testid="wallet-address">
                        {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
                      </p>
                      <div className="flex items-center text-green-400 text-xs">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1 opacity-75"></div>
                        Connected
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/10"
                  data-testid="button-disconnect-wallet"
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen pt-16">
      <UserSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
      />
      
      <div className="flex-1 overflow-auto">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'credentials' && renderCredentials()}
        {activeSection === 'requests' && renderRequests()}
        {activeSection === 'settings' && renderSettings()}
      </div>

      <CredentialForm 
        isOpen={showCredentialForm}
        onClose={() => setShowCredentialForm(false)}
      />
    </div>
  );
};

export default UserDashboard;
