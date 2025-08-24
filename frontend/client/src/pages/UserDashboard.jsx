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
  Briefcase
} from 'lucide-react';

const UserDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="dashboard-welcome">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-400">Manage your digital identity and verifiable credentials</p>
      </div>

      {/* DID Display */}
      <Card className="credential-card mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Fingerprint className="mr-2 h-5 w-5 text-web3-purple" />
                Your Decentralized Identity (DID)
              </h3>
              <code className="text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded font-mono break-all" data-testid="user-did">
                {user.did}
              </code>
            </div>
            <Button
              onClick={copyDID}
              size="sm"
              className="glow-button text-white px-4 py-2 text-sm rounded-lg"
              data-testid="button-copy-did"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Credentials</p>
                <p className="text-3xl font-bold text-web3-purple" data-testid="stat-credentials">
                  {credentials.length}
                </p>
              </div>
              <Award className="h-8 w-8 text-web3-purple" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Pending Requests</p>
                <p className="text-3xl font-bold text-web3-blue" data-testid="stat-pending">
                  {verificationRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-web3-blue" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Verified Shares</p>
                <p className="text-3xl font-bold text-web3-cyan" data-testid="stat-shares">
                  {verificationRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-web3-cyan" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-web3-purple" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : verificationRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {verificationRequests.slice(0, 3).map((request, index) => (
                <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-b-0" data-testid={`activity-${index}`}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      request.status === 'approved' ? 'bg-green-500' :
                      request.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="text-white">
                        {request.status === 'approved' ? 'Shared' : 'Request for'} {request.credentialType} 
                        {request.verifier && ` with ${request.verifier.name}`}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {new Date(request.requestedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium capitalize ${
                    request.status === 'approved' ? 'text-green-500' :
                    request.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCredentials = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Credentials</h1>
          <p className="text-gray-400">Manage and share your verifiable credentials</p>
        </div>
        <Button
          onClick={() => setShowCredentialForm(true)}
          className="glow-button text-white px-6 py-3 rounded-xl font-semibold flex items-center"
          data-testid="button-add-credential"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Credential
        </Button>
      </div>

      {credentialsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : credentials.length === 0 ? (
        <div className="text-center py-16">
          <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Credentials Yet</h3>
          <p className="text-gray-400 mb-6">Start by adding your first verifiable credential</p>
          <Button 
            onClick={() => setShowCredentialForm(true)}
            className="glow-button text-white px-6 py-3 rounded-xl font-semibold"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add First Credential
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map(credential => (
            <CredentialCard key={credential.id} credential={credential} />
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

  const renderSettings = () => (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and privacy settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input 
                type="text" 
                defaultValue={user.name} 
                className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-web3-purple focus:border-transparent"
                data-testid="input-display-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input 
                type="email" 
                defaultValue={user.email} 
                className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-web3-purple focus:border-transparent"
                data-testid="input-email"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Connected Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 text-web3-purple mr-3">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">MetaMask</p>
                  <p className="text-gray-400 text-sm font-mono" data-testid="wallet-address">
                    {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
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
