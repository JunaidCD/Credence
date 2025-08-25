import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import VerifierSidebar from '@/components/VerifierSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Activity,
  Search,
  TrendingUp,
  Users,
  ClipboardList,
  Shield,
  Eye,
  AlertCircle,
  Zap,
  User,
  Bell,
  Lock,
  Globe,
  Smartphone,
  Mail,
  Key,
  Database,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Save
} from 'lucide-react';

// Advanced CSS styles for modern UI effects
const styles = `
  .glass-effect {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  .glass-effect:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
  }
  
  .stat-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .stat-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
  
  .floating-icon {
    animation: float 3s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .welcome-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  
  .form-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08));
    border: 1px solid rgba(59, 130, 246, 0.2);
    position: relative;
    overflow: hidden;
  }
  
  .form-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    transition: left 0.8s;
  }
  
  .form-card:hover::before {
    left: 100%;
  }
  
  .form-input {
    background: rgba(30, 41, 59, 0.8);
    border: 2px solid rgba(59, 130, 246, 0.2);
    transition: all 0.3s ease;
    position: relative;
  }
  
  .form-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: rgba(30, 41, 59, 0.9);
  }
  
  .form-input:hover {
    border-color: rgba(59, 130, 246, 0.4);
  }
  
  .form-label {
    position: relative;
    display: inline-block;
  }
  
  .form-label::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.3s ease;
  }
  
  .form-label:hover::after {
    width: 100%;
  }
  
  .enhanced-button {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border: none;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .enhanced-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  .enhanced-button:hover::before {
    width: 300px;
    height: 300px;
  }
  
  .enhanced-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
  }
  
  .form-section {
    animation: slideInUp 0.6s ease-out;
  }
  
  @keyframes slideInUp {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .lookup-card {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.08));
    border: 1px solid rgba(6, 182, 212, 0.2);
    transition: all 0.3s ease;
  }
  
  .lookup-card:hover {
    border-color: rgba(6, 182, 212, 0.4);
    box-shadow: 0 8px 25px rgba(6, 182, 212, 0.15);
  }
`;

const VerifierDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Add current time state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Add styles to document head
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Form states
  const [searchForm, setSearchForm] = useState({
    did: '',
    credentialType: '',
    message: ''
  });
  
  // Settings state
  const [settings, setSettings] = useState({
    profile: {
      name: user?.name || '',
      email: user?.email || '',
      organization: user?.organization || '',
      bio: user?.bio || ''
    },
    verification: {
      autoApprove: false,
      requireMessage: true,
      allowedCredentialTypes: ['University Degree', 'PAN Card', 'Driving License'],
      maxRequestsPerDay: 50
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      requirePasswordChange: false,
      allowRemoteAccess: true
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      requestAlerts: true,
      weeklyReports: false
    }
  });

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== 'verifier')) {
      setLocation('/');
    }
  }, [isAuthenticated, user, setLocation]);

  // Queries - Fetch approved verification requests
  const { data: approvedRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/verification-requests/approved', user?.id],
    enabled: !!user?.id,
  });

  // Search state for filtering requests by DID
  const [searchDID, setSearchDID] = useState('');
  
  // Filter requests based on search DID
  const filteredRequests = approvedRequests.filter(request => 
    !searchDID || request.userDID?.toLowerCase().includes(searchDID.toLowerCase())
  );

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: async (requestData) => {
      // First, find user by DID
      const userResponse = await fetch(`/api/users/did/${requestData.did}`);
      if (!userResponse.ok) {
        throw new Error('User with this DID not found');
      }
      const targetUser = await userResponse.json();

      // Send verification request
      const response = await fetch('/api/verification-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifierId: user.id,
          userId: targetUser.id,
          credentialType: requestData.credentialType,
          message: requestData.message
        })
      });
      
      if (!response.ok) throw new Error('Failed to send verification request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/verification-requests/verifier'] });
      setSearchForm({ did: '', credentialType: '', message: '' });
      toast({
        title: "Request Sent",
        description: "Verification request has been sent successfully!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: error.message,
      });
    }
  });

  const handleSendRequest = (e) => {
    e.preventDefault();
    if (!searchForm.did || !searchForm.credentialType) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in both DID and credential type.",
      });
      return;
    }

    sendRequestMutation.mutate(searchForm);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const stats = {
    total: approvedRequests.length,
    active: approvedRequests.filter(r => r.status === 'approved').length,
    expired: approvedRequests.filter(r => r.status === 'expired').length,
    revoked: approvedRequests.filter(r => r.status === 'rejected').length,
  };

  const renderDashboard = () => (
    <div className="p-6">
      {/* Enhanced Welcome Header */}
      <div className="welcome-card rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Shield className="h-12 w-12 text-blue-400 floating-icon" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Welcome back, {user?.name || 'Verifier'}! 🛡️
              </h1>
              <p className="text-gray-300 text-lg mb-2">
                Ready to verify credentials and manage identity requests
              </p>
              {user?.did && (
                <div className="flex items-center space-x-2 mt-3">
                  <div className="bg-blue-500 bg-opacity-20 px-3 py-1 rounded-full border border-blue-500 border-opacity-30">
                    <span className="text-blue-300 text-sm font-medium">DID:</span>
                    <span className="text-white text-sm font-mono ml-2">
                      {user.did.length > 40 ? `${user.did.slice(0, 20)}...${user.did.slice(-15)}` : user.did}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(user.did)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Copy DID"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white mb-1">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-gray-400">
              {currentTime.toLocaleDateString([], { 
                weekday: 'long',
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex items-center mt-2 text-green-400">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Verified Verifier</span>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 border border-blue-500 border-opacity-30">
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-blue-400 mr-2" />
              <span className="text-blue-300 font-medium">Active Verifications</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">{stats.active}</div>
          </div>
          <div className="bg-green-500 bg-opacity-20 rounded-lg p-4 border border-green-500 border-opacity-30">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-300 font-medium">Total Verified</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          </div>
          <div className="bg-purple-500 bg-opacity-20 rounded-lg p-4 border border-purple-500 border-opacity-30">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-purple-300 font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">98.5%</div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Credentials</p>
                <p className="text-3xl font-bold text-web3-blue" data-testid="stat-total">
                  {stats.total}
                </p>
                <div className="flex items-center mt-2 text-green-400 text-sm">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12%
                </div>
              </div>
              <div className="relative">
                <Send className="h-8 w-8 text-web3-blue floating-icon" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stat-card glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold text-green-500" data-testid="stat-active">
                  {stats.active}
                </p>
                <div className="flex items-center mt-2 text-green-400 text-sm">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8%
                </div>
              </div>
              <div className="relative">
                <CheckCircle className="h-8 w-8 text-green-500 floating-icon" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stat-card glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm font-medium">Expired</p>
                <p className="text-3xl font-bold text-yellow-500" data-testid="stat-expired">
                  {stats.expired}
                </p>
                <div className="flex items-center mt-2 text-yellow-400 text-sm">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {stats.expired > 0 ? 'Monitor' : 'Good'}
                </div>
              </div>
              <div className="relative">
                <Clock className="h-8 w-8 text-yellow-500 floating-icon" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stat-card glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm font-medium">Revoked</p>
                <p className="text-3xl font-bold text-red-500" data-testid="stat-revoked">
                  {stats.revoked}
                </p>
                <div className="flex items-center mt-2 text-red-400 text-sm">
                  <XCircle className="h-3 w-3 mr-1" />
                  {stats.revoked === 0 ? 'Excellent' : 'Review'}
                </div>
              </div>
              <div className="relative">
                <XCircle className="h-8 w-8 text-red-500 floating-icon" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recent Issued Credentials */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <div className="relative mr-3">
              <Activity className="h-6 w-6 text-web3-blue floating-icon" />
            </div>
            Recent Approved Requests
            <div className="ml-auto flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live Updates</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-effect rounded-lg p-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : approvedRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <Shield className="h-20 w-20 text-gray-600 mx-auto floating-icon" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Credentials Yet</h3>
              <p className="text-gray-400 mb-6">Start verifying credentials to see them here</p>
              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-blue-500 bg-opacity-10 rounded-lg p-4 border border-blue-500 border-opacity-20">
                  <Eye className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-300 font-medium">Verify Identity</p>
                  <p className="text-gray-400 text-sm mt-1">Authenticate user credentials</p>
                </div>
                <div className="bg-green-500 bg-opacity-10 rounded-lg p-4 border border-green-500 border-opacity-20">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-300 font-medium">Approve Requests</p>
                  <p className="text-gray-400 text-sm mt-1">Process verification requests</p>
                </div>
                <div className="bg-purple-500 bg-opacity-10 rounded-lg p-4 border border-purple-500 border-opacity-20">
                  <Shield className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-300 font-medium">Secure Network</p>
                  <p className="text-gray-400 text-sm mt-1">Maintain trust ecosystem</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedRequests.slice(0, 5).map((request, index) => (
                <div key={request.id} className="glass-effect rounded-lg p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-transparent hover:border-l-blue-500" data-testid={`recent-request-${index}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          request.status === 'approved' ? 'bg-green-500 bg-opacity-20 border-2 border-green-500 border-opacity-50' :
                          request.status === 'rejected' ? 'bg-red-500 bg-opacity-20 border-2 border-red-500 border-opacity-50' :
                          'bg-yellow-500 bg-opacity-20 border-2 border-yellow-500 border-opacity-50'
                        }`}>
                          {request.status === 'approved' ? 
                            <CheckCircle className="h-6 w-6 text-green-400" /> :
                            request.status === 'rejected' ? 
                            <XCircle className="h-6 w-6 text-red-400" /> :
                            <AlertCircle className="h-6 w-6 text-yellow-400" />
                          }
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-white">{request.credentialType}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'approved' ? 'text-green-400 bg-green-500 bg-opacity-20' :
                            request.status === 'rejected' ? 'text-red-400 bg-red-500 bg-opacity-20' :
                            'text-yellow-400 bg-yellow-500 bg-opacity-20'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm font-mono">
                          {request.userDID ? `${request.userDID.slice(0, 30)}...` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {new Date(request.approvedAt || request.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {new Date(request.approvedAt || request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSearch = () => (
    <div className="p-6">
      {/* Enhanced Header */}
      <div className="mb-8 form-section">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <Search className="h-8 w-8 text-blue-400 floating-icon" />
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Search DID</h1>
            <p className="text-gray-300 text-lg">Find and request verification from decentralized identities</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="flex items-center space-x-1">
            <div className="h-2 w-8 bg-blue-500 rounded-full"></div>
            <span className="text-blue-400 text-sm font-medium">Step 1: Identity Search</span>
          </div>
          <div className="h-px bg-gray-600 flex-1 mx-3"></div>
          <div className="flex items-center space-x-1">
            <div className="h-2 w-8 bg-gray-600 rounded-full"></div>
            <span className="text-gray-500 text-sm">Step 2: Verification</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card className="form-card mb-8 form-section">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center text-2xl">
              <div className="relative mr-3">
                <Send className="h-6 w-6 text-blue-400" />
                <div className="absolute inset-0 bg-blue-500 rounded blur-md opacity-30"></div>
              </div>
              New Verification Request
              <div className="ml-auto">
                <div className="bg-green-500 bg-opacity-20 px-3 py-1 rounded-full border border-green-500 border-opacity-30">
                  <span className="text-green-400 text-sm font-medium flex items-center">
                    <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Secure Request
                  </span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSendRequest} className="space-y-6">
              {/* DID Input */}
              <div className="form-section">
                <label className="form-label block text-sm font-semibold text-blue-300 mb-3">
                  🔐 Decentralized Identity (DID)
                </label>
                <div className="relative">
                  <Input
                    value={searchForm.did}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, did: e.target.value }))}
                    placeholder="did:ethr:0x1234567890abcdef..."
                    className="form-input text-white placeholder-gray-400 pl-12 h-12 text-lg"
                    data-testid="input-did"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Enter the complete DID of the identity holder
                </p>
              </div>
              
              {/* Credential Type */}
              <div className="form-section">
                <label className="form-label block text-sm font-semibold text-purple-300 mb-3">
                  📋 Credential Type
                </label>
                <div className="relative">
                  <Select
                    value={searchForm.credentialType}
                    onValueChange={(value) => setSearchForm(prev => ({ ...prev, credentialType: value }))}
                  >
                    <SelectTrigger className="form-input text-white h-12 text-lg pl-12" data-testid="select-credential-type">
                      <SelectValue placeholder="Choose the type of credential to verify..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="University Degree" className="text-white hover:bg-gray-700">
                        🎓 University Degree
                      </SelectItem>
                      <SelectItem value="PAN Card" className="text-white hover:bg-gray-700">
                        🆔 PAN Card
                      </SelectItem>
                      <SelectItem value="Driving License" className="text-white hover:bg-gray-700">
                        🚗 Driving License
                      </SelectItem>
                      <SelectItem value="Professional Certificate" className="text-white hover:bg-gray-700">
                        🏆 Professional Certificate
                      </SelectItem>
                      <SelectItem value="Employment Verification" className="text-white hover:bg-gray-700">
                        💼 Employment Verification
                      </SelectItem>
                      <SelectItem value="Address Proof" className="text-white hover:bg-gray-700">
                        🏠 Address Proof
                      </SelectItem>
                      <SelectItem value="Other" className="text-white hover:bg-gray-700">
                        📄 Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <ClipboardList className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Request Message */}
              <div className="form-section">
                <label className="form-label block text-sm font-semibold text-green-300 mb-3">
                  💬 Request Message (Optional)
                </label>
                <div className="relative">
                  <Textarea
                    value={searchForm.message}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    placeholder="Describe why you need this verification and provide any additional context..."
                    className="form-input text-white placeholder-gray-400 pl-12 pt-4 text-lg resize-none"
                    data-testid="textarea-message"
                  />
                  <div className="absolute left-3 top-4">
                    <Users className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-gray-400 text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    This message will be visible to the credential holder
                  </p>
                  <span className="text-gray-500 text-sm">
                    {searchForm.message.length}/500
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={sendRequestMutation.isPending}
                  className="enhanced-button text-white px-8 py-4 rounded-2xl font-bold w-full h-14 text-lg flex items-center justify-center relative z-10"
                  data-testid="button-send-request"
                >
                  <div className="flex items-center space-x-3">
                    {sendRequestMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-6 w-6" />
                        <span>Send Verification Request</span>
                        <Zap className="h-5 w-5" />
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Quick DID Lookup */}
        <Card className="lookup-card form-section">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="relative mr-3">
                <Search className="h-6 w-6 text-cyan-400 floating-icon" />
                <div className="absolute inset-0 bg-cyan-500 rounded blur-md opacity-30"></div>
              </div>
              Quick DID Lookup
              <div className="ml-auto flex items-center space-x-2">
                <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-400 text-sm font-medium">Instant Search</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Enter DID to lookup instantly..."
                    className="form-input text-white placeholder-gray-400 pl-12 h-12 text-lg"
                    data-testid="input-lookup-did"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Eye className="h-5 w-5 text-cyan-400" />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="enhanced-button border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900 h-12 px-6 rounded-xl font-semibold"
                  data-testid="button-lookup"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Lookup
                </Button>
              </div>
              
              <div className="bg-cyan-500 bg-opacity-10 rounded-lg p-4 border border-cyan-500 border-opacity-20">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <span className="text-cyan-300 font-medium">Instant Verification</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Quickly verify if a DID exists and check its public credentials without sending a formal request
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="p-6">
      <div className="mb-8 form-section">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <CheckCircle className="h-8 w-8 text-green-400 floating-icon" />
            <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Approved Requests</h1>
            <p className="text-gray-300 text-lg">View all verification requests approved by users</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  value={searchDID}
                  onChange={(e) => setSearchDID(e.target.value)}
                  placeholder="Search approved requests by DID..."
                  className="bg-gray-800 border-gray-700 text-white focus:ring-web3-blue"
                  data-testid="search-did-input"
                />
              </div>
              <Button
                variant="outline"
                className="border-web3-blue text-web3-blue hover:bg-web3-blue hover:text-white"
                data-testid="search-button"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6">
        <Button className="px-4 py-2 bg-web3-blue bg-opacity-20 text-web3-blue rounded-lg font-medium">
          All Requests
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
          Approved
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
          Pending
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
          Rejected
        </Button>
      </div>

      {/* Approved Requests Table */}
      <Card className="glass-effect">
        <CardContent className="p-0">
          {requestsLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <CheckCircle className="h-20 w-20 text-gray-600 mx-auto floating-icon" />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchDID ? 'No Matching Requests' : 'No Approved Requests Yet'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchDID ? 'Try adjusting your search criteria' : 'Approved verification requests will appear here'}
              </p>
              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-green-500 bg-opacity-10 rounded-lg p-4 border border-green-500 border-opacity-20">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-300 font-medium">User Approvals</p>
                  <p className="text-gray-400 text-sm mt-1">Track approved verification requests</p>
                </div>
                <div className="bg-blue-500 bg-opacity-10 rounded-lg p-4 border border-blue-500 border-opacity-20">
                  <Eye className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-300 font-medium">Monitor Status</p>
                  <p className="text-gray-400 text-sm mt-1">View request approval status</p>
                </div>
                <div className="bg-purple-500 bg-opacity-10 rounded-lg p-4 border border-purple-500 border-opacity-20">
                  <Shield className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-300 font-medium">Verification Network</p>
                  <p className="text-gray-400 text-sm mt-1">Build trusted connections</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Request ID</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">User DID</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Credential Type</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Approved Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Message</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request, index) => (
                    <tr key={request.id} className="border-b border-gray-800 hover:bg-gray-800 hover:bg-opacity-50" data-testid={`request-row-${index}`}>
                      <td className="py-4 px-6 font-mono text-sm text-gray-300">
                        #{request.id.toString().slice(-6)}
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-gray-300">
                        {request.userDID ? `${request.userDID.slice(0, 20)}...` : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-white">{request.credentialType}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                          request.status === 'approved' ? 'text-green-500 bg-green-500 bg-opacity-20' :
                          request.status === 'rejected' ? 'text-red-500 bg-red-500 bg-opacity-20' :
                          'text-yellow-500 bg-yellow-500 bg-opacity-20'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {new Date(request.approvedAt || request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-400 max-w-xs truncate">
                        {request.message || 'No message'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-web3-blue hover:text-web3-purple"
                            data-testid={`button-view-${index}`}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-green-400 hover:text-green-300"
                            data-testid={`button-contact-${index}`}
                          >
                            Contact User
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6">
      {/* Enhanced Header */}
      <div className="mb-8 form-section">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <User className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
            <p className="text-gray-300 text-lg">Configure your verifier preferences and account settings</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Settings */}
        <Card className="form-card form-section">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="relative mr-3">
                <User className="h-6 w-6 text-blue-400" />
              </div>
              Profile Settings
              <div className="ml-auto">
                <div className="bg-blue-500 bg-opacity-20 px-3 py-1 rounded-full border border-blue-500 border-opacity-30">
                  <span className="text-blue-400 text-sm font-medium">Personal Info</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="form-section">
                <label className="form-label block text-sm font-semibold text-blue-300 mb-3">
                  👤 Full Name
                </label>
                <Input
                  value={settings.profile.name}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    profile: { ...prev.profile, name: e.target.value }
                  }))}
                  className="form-input text-white h-12"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-section">
                <label className="form-label block text-sm font-semibold text-green-300 mb-3">
                  📧 Email Address
                </label>
                <Input
                  value={settings.profile.email}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    profile: { ...prev.profile, email: e.target.value }
                  }))}
                  className="form-input text-white h-12"
                  placeholder="Enter your email"
                  type="email"
                />
              </div>
            </div>
            <div className="form-section">
              <label className="form-label block text-sm font-semibold text-purple-300 mb-3">
                🏢 Organization
              </label>
              <Input
                value={settings.profile.organization}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, organization: e.target.value }
                }))}
                className="form-input text-white h-12"
                placeholder="Enter your organization name"
              />
            </div>
            <div className="form-section">
              <label className="form-label block text-sm font-semibold text-cyan-300 mb-3">
                📝 Bio
              </label>
              <Textarea
                value={settings.profile.bio}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, bio: e.target.value }
                }))}
                className="form-input text-white resize-none"
                rows={3}
                placeholder="Tell us about yourself and your verification expertise..."
              />
            </div>
            
            {/* DID Information */}
            <div className="bg-blue-500 bg-opacity-10 rounded-lg p-4 border border-blue-500 border-opacity-20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-blue-300 font-semibold mb-1">🔐 Your DID</h4>
                  <p className="text-gray-400 text-sm font-mono">
                    {user?.did ? `${user.did.slice(0, 30)}...${user.did.slice(-20)}` : 'Not available'}
                  </p>
                </div>
                <Button
                  onClick={() => user?.did && navigator.clipboard.writeText(user.did)}
                  variant="outline"
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-gray-900"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Copy DID
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Preferences */}
        <Card className="form-card form-section">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="relative mr-3">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              Verification Preferences
              <div className="ml-auto">
                <div className="bg-green-500 bg-opacity-20 px-3 py-1 rounded-full border border-green-500 border-opacity-30">
                  <span className="text-green-400 text-sm font-medium">Verification Rules</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Auto-approve requests</h4>
                    <p className="text-gray-400 text-sm">Automatically approve trusted requests</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      verification: { ...prev.verification, autoApprove: !prev.verification.autoApprove }
                    }))}
                    className={`w-12 h-6 rounded-full ${
                      settings.verification.autoApprove ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full ${
                      settings.verification.autoApprove ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Require message</h4>
                    <p className="text-gray-400 text-sm">Users must provide a reason</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      verification: { ...prev.verification, requireMessage: !prev.verification.requireMessage }
                    }))}
                    className={`w-12 h-6 rounded-full ${
                      settings.verification.requireMessage ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full ${
                      settings.verification.requireMessage ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
              
              <div className="form-section">
                <label className="form-label block text-sm font-semibold text-orange-300 mb-3">
                  📊 Max Requests Per Day
                </label>
                <Input
                  type="number"
                  value={settings.verification.maxRequestsPerDay}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    verification: { ...prev.verification, maxRequestsPerDay: parseInt(e.target.value) }
                  }))}
                  className="form-input text-white h-12"
                  min="1"
                  max="1000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="form-card form-section">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="relative mr-3">
                <Lock className="h-6 w-6 text-red-400" />
              </div>
              Security Settings
              <div className="ml-auto">
                <div className="bg-red-500 bg-opacity-20 px-3 py-1 rounded-full border border-red-500 border-opacity-30">
                  <span className="text-red-400 text-sm font-medium">Account Security</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium flex items-center">
                      <Smartphone className="h-4 w-4 mr-2 text-blue-400" />
                      Two-Factor Authentication
                    </h4>
                    <p className="text-gray-400 text-sm">Add extra security to your account</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, twoFactorEnabled: !prev.security.twoFactorEnabled }
                    }))}
                    className={`w-12 h-6 rounded-full ${
                      settings.security.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full ${
                      settings.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-green-400" />
                      Allow Remote Access
                    </h4>
                    <p className="text-gray-400 text-sm">Access from different locations</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, allowRemoteAccess: !prev.security.allowRemoteAccess }
                    }))}
                    className={`w-12 h-6 rounded-full ${
                      settings.security.allowRemoteAccess ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full ${
                      settings.security.allowRemoteAccess ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
              
              <div className="form-section">
                <label className="form-label block text-sm font-semibold text-yellow-300 mb-3">
                  ⏱️ Session Timeout (minutes)
                </label>
                <Input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                  }))}
                  className="form-input text-white h-12"
                  min="5"
                  max="480"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="form-card form-section">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="relative mr-3">
                <Bell className="h-6 w-6 text-yellow-400" />
              </div>
              Notification Settings
              <div className="ml-auto">
                <div className="bg-yellow-500 bg-opacity-20 px-3 py-1 rounded-full border border-yellow-500 border-opacity-30">
                  <span className="text-yellow-400 text-sm font-medium">Alerts & Updates</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                <div>
                  <h4 className="text-white font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-blue-400" />
                    Email Notifications
                  </h4>
                  <p className="text-gray-400 text-sm">Receive updates via email</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, emailNotifications: !prev.notifications.emailNotifications }
                  }))}
                  className={`w-12 h-6 rounded-full ${
                    settings.notifications.emailNotifications ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full ${
                    settings.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                <div>
                  <h4 className="text-white font-medium flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-green-400" />
                    Push Notifications
                  </h4>
                  <p className="text-gray-400 text-sm">Browser push notifications</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, pushNotifications: !prev.notifications.pushNotifications }
                  }))}
                  className={`w-12 h-6 rounded-full ${
                    settings.notifications.pushNotifications ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full ${
                    settings.notifications.pushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                <div>
                  <h4 className="text-white font-medium flex items-center">
                    <Bell className="h-4 w-4 mr-2 text-orange-400" />
                    Request Alerts
                  </h4>
                  <p className="text-gray-400 text-sm">New verification requests</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, requestAlerts: !prev.notifications.requestAlerts }
                  }))}
                  className={`w-12 h-6 rounded-full ${
                    settings.notifications.requestAlerts ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full ${
                    settings.notifications.requestAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                <div>
                  <h4 className="text-white font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-purple-400" />
                    Weekly Reports
                  </h4>
                  <p className="text-gray-400 text-sm">Activity summary emails</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, weeklyReports: !prev.notifications.weeklyReports }
                  }))}
                  className={`w-12 h-6 rounded-full ${
                    settings.notifications.weeklyReports ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full ${
                    settings.notifications.weeklyReports ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card className="form-card form-section">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="relative mr-3">
                <Database className="h-6 w-6 text-cyan-400" />
              </div>
              Account Management
              <div className="ml-auto">
                <div className="bg-cyan-500 bg-opacity-20 px-3 py-1 rounded-full border border-cyan-500 border-opacity-30">
                  <span className="text-cyan-400 text-sm font-medium">Data & Account</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-gray-900 h-12"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export Account Data
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 h-12"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Import Settings
                </Button>
              </div>
              
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-gray-900 h-12"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Reset to Defaults
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full border-red-400 text-red-400 hover:bg-red-400 hover:text-white h-12"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings Button */}
        <div className="flex justify-center pt-6">
          <Button
            className="enhanced-button text-white px-12 py-4 rounded-2xl font-bold h-14 text-lg flex items-center justify-center relative z-10"
          >
            <Save className="h-6 w-6 mr-3" />
            Save All Settings
            <CheckCircle className="h-5 w-5 ml-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen pt-16">
      <VerifierSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
      />
      
      <div className="flex-1 overflow-auto">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'search' && renderSearch()}
        {(activeSection === 'requests' || activeSection === 'issued-credentials' || activeSection === 'approved-requests') && renderRequests()}
        {activeSection === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default VerifierDashboard;
