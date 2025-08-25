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
  Zap
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

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== 'verifier')) {
      setLocation('/');
    }
  }, [isAuthenticated, user, setLocation]);

  // Queries - Changed to fetch issued credentials instead of verification requests
  const { data: issuedCredentials = [], isLoading: credentialsLoading } = useQuery({
    queryKey: ['/api/credentials/issued', user?.id],
    enabled: !!user?.id,
  });

  // Search state for filtering credentials by DID
  const [searchDID, setSearchDID] = useState('');
  
  // Filter credentials based on search DID
  const filteredCredentials = issuedCredentials.filter(credential => 
    !searchDID || credential.holderDID?.toLowerCase().includes(searchDID.toLowerCase())
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
    total: issuedCredentials.length,
    active: issuedCredentials.filter(c => c.status === 'active').length,
    expired: issuedCredentials.filter(c => c.status === 'expired').length,
    revoked: issuedCredentials.filter(c => c.status === 'revoked').length,
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
            Recent Issued Credentials
            <div className="ml-auto flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live Updates</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credentialsLoading ? (
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
          ) : issuedCredentials.length === 0 ? (
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
              {issuedCredentials.slice(0, 5).map((credential, index) => (
                <div key={credential.id} className="glass-effect rounded-lg p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-transparent hover:border-l-blue-500" data-testid={`recent-credential-${index}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          credential.status === 'active' ? 'bg-green-500 bg-opacity-20 border-2 border-green-500 border-opacity-50' :
                          credential.status === 'revoked' ? 'bg-red-500 bg-opacity-20 border-2 border-red-500 border-opacity-50' :
                          'bg-yellow-500 bg-opacity-20 border-2 border-yellow-500 border-opacity-50'
                        }`}>
                          {credential.status === 'active' ? 
                            <CheckCircle className="h-6 w-6 text-green-400" /> :
                            credential.status === 'revoked' ? 
                            <XCircle className="h-6 w-6 text-red-400" /> :
                            <AlertCircle className="h-6 w-6 text-yellow-400" />
                          }
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-white">{credential.credentialType}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            credential.status === 'active' ? 'text-green-400 bg-green-500 bg-opacity-20' :
                            credential.status === 'revoked' ? 'text-red-400 bg-red-500 bg-opacity-20' :
                            'text-yellow-400 bg-yellow-500 bg-opacity-20'
                          }`}>
                            {credential.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm font-mono">
                          {credential.holderDID ? `${credential.holderDID.slice(0, 30)}...` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {new Date(credential.issuedAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {new Date(credential.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Search DID</h1>
        <p className="text-gray-400">Find and request verification from decentralized identities</p>
      </div>

      <div className="max-w-2xl">
        <Card className="glass-effect mb-6">
          <CardHeader>
            <CardTitle>New Verification Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Decentralized Identity (DID)
                </label>
                <Input
                  value={searchForm.did}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, did: e.target.value }))}
                  placeholder="did:ethr:0x..."
                  className="bg-gray-800 border-gray-700 text-white focus:ring-web3-blue"
                  data-testid="input-did"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Credential Type
                </label>
                <Select
                  value={searchForm.credentialType}
                  onValueChange={(value) => setSearchForm(prev => ({ ...prev, credentialType: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-web3-blue" data-testid="select-credential-type">
                    <SelectValue placeholder="Select credential type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="University Degree">University Degree</SelectItem>
                    <SelectItem value="PAN Card">PAN Card</SelectItem>
                    <SelectItem value="Driving License">Driving License</SelectItem>
                    <SelectItem value="Professional Certificate">Professional Certificate</SelectItem>
                    <SelectItem value="Employment Verification">Employment Verification</SelectItem>
                    <SelectItem value="Address Proof">Address Proof</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Request Message (Optional)
                </label>
                <Textarea
                  value={searchForm.message}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  placeholder="Describe why you need this verification..."
                  className="bg-gray-800 border-gray-700 text-white focus:ring-web3-blue"
                  data-testid="textarea-message"
                />
              </div>

              <Button
                type="submit"
                disabled={sendRequestMutation.isPending}
                className="glow-button text-white px-6 py-3 rounded-xl font-semibold w-full flex items-center justify-center"
                data-testid="button-send-request"
              >
                <Send className="mr-2 h-5 w-5" />
                {sendRequestMutation.isPending ? 'Sending...' : 'Send Verification Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick DID Lookup */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5 text-web3-blue" />
              Quick DID Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-3">
              <Input
                placeholder="Enter DID to lookup..."
                className="flex-1 bg-gray-800 border-gray-700 text-white focus:ring-web3-blue"
                data-testid="input-lookup-did"
              />
              <Button
                variant="outline"
                className="border-web3-blue text-web3-blue hover:bg-web3-blue hover:text-white"
                data-testid="button-lookup"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Verify if a DID exists and check its public credentials
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Issued Credentials</h1>
        <p className="text-gray-400">View and manage all issued credentials</p>
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
                  placeholder="Search credentials by DID..."
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
          All Credentials
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
          Active
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
          Expired
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
          Revoked
        </Button>
      </div>

      {/* Credentials Table */}
      <Card className="glass-effect">
        <CardContent className="p-0">
          {credentialsLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCredentials.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchDID ? 'No Matching Credentials' : 'No Credentials Issued Yet'}
              </h3>
              <p className="text-gray-400">
                {searchDID ? 'Try adjusting your search criteria' : 'Issued credentials will appear here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Credential ID</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Holder DID</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Credential Type</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Issue Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Expiry Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCredentials.map((credential, index) => (
                    <tr key={credential.id} className="border-b border-gray-800 hover:bg-gray-800 hover:bg-opacity-50" data-testid={`credential-row-${index}`}>
                      <td className="py-4 px-6 font-mono text-sm text-gray-300">
                        #{credential.id.slice(-6)}
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-gray-300">
                        {credential.holderDID ? `${credential.holderDID.slice(0, 20)}...` : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-white">{credential.credentialType}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                          credential.status === 'active' ? 'text-green-500 bg-green-500 bg-opacity-20' :
                          credential.status === 'revoked' ? 'text-red-500 bg-red-500 bg-opacity-20' :
                          'text-yellow-500 bg-yellow-500 bg-opacity-20'
                        }`}>
                          {credential.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {new Date(credential.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {credential.expiryDate ? new Date(credential.expiryDate).toLocaleDateString() : 'No expiry'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-web3-blue hover:text-web3-purple"
                            data-testid={`button-view-${index}`}
                          >
                            View
                          </Button>
                          {credential.status === 'active' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                              data-testid={`button-revoke-${index}`}
                            >
                              Revoke
                            </Button>
                          )}
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

  return (
    <div className="flex h-screen pt-16">
      <VerifierSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
      />
      
      <div className="flex-1 overflow-auto">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'search' && renderSearch()}
        {(activeSection === 'requests' || activeSection === 'issued-credentials') && renderRequests()}
        {activeSection === 'settings' && (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Configure your verifier settings</p>
            {/* Settings content would go here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifierDashboard;
