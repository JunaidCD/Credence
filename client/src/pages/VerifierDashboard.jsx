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
  Users
} from 'lucide-react';

const VerifierDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Queries
  const { data: verificationRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/verification-requests/verifier', user?.id],
    enabled: !!user?.id,
  });

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
    total: verificationRequests.length,
    approved: verificationRequests.filter(r => r.status === 'approved').length,
    pending: verificationRequests.filter(r => r.status === 'pending').length,
    rejected: verificationRequests.filter(r => r.status === 'rejected').length,
  };

  const renderDashboard = () => (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Verifier Dashboard</h1>
        <p className="text-gray-400">Manage identity verifications and credential requests</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Requests</p>
                <p className="text-3xl font-bold text-web3-blue" data-testid="stat-total">
                  {stats.total}
                </p>
              </div>
              <Send className="h-8 w-8 text-web3-blue" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Approved</p>
                <p className="text-3xl font-bold text-green-500" data-testid="stat-approved">
                  {stats.approved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-yellow-500" data-testid="stat-pending">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Rejected</p>
                <p className="text-3xl font-bold text-red-500" data-testid="stat-rejected">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Verifications */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-web3-blue" />
            Recent Verifications
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
            <p className="text-gray-400 text-center py-8">No verification requests yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 text-gray-400 font-medium">User DID</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Credential Type</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationRequests.slice(0, 5).map((request, index) => (
                    <tr key={request.id} className="border-b border-gray-800 last:border-b-0" data-testid={`recent-request-${index}`}>
                      <td className="py-3 font-mono text-sm text-gray-300">
                        {request.user?.did ? `${request.user.did.slice(0, 20)}...` : 'N/A'}
                      </td>
                      <td className="py-3 text-white">{request.credentialType}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-sm capitalize ${
                          request.status === 'approved' ? 'text-green-500 bg-green-500 bg-opacity-20' :
                          request.status === 'rejected' ? 'text-red-500 bg-red-500 bg-opacity-20' :
                          'text-yellow-500 bg-yellow-500 bg-opacity-20'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(request.requestedAt).toLocaleDateString()}
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
        <h1 className="text-3xl font-bold text-white mb-2">Verification Requests</h1>
        <p className="text-gray-400">Track the status of your verification requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6">
        <Button className="px-4 py-2 bg-web3-blue bg-opacity-20 text-web3-blue rounded-lg font-medium">
          All Requests
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
          Pending
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
          Approved
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
          Rejected
        </Button>
      </div>

      {/* Requests Table */}
      <Card className="glass-effect">
        <CardContent className="p-0">
          {requestsLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : verificationRequests.length === 0 ? (
            <div className="text-center py-16">
              <Send className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Requests Yet</h3>
              <p className="text-gray-400">Start by sending your first verification request</p>
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
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Date Sent</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationRequests.map((request, index) => (
                    <tr key={request.id} className="border-b border-gray-800 hover:bg-gray-800 hover:bg-opacity-50" data-testid={`request-row-${index}`}>
                      <td className="py-4 px-6 font-mono text-sm text-gray-300">
                        #{request.id.slice(-6)}
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-gray-300">
                        {request.user?.did ? `${request.user.did.slice(0, 20)}...` : 'N/A'}
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
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-web3-blue hover:text-web3-purple"
                          data-testid={`button-view-${index}`}
                        >
                          View Details
                        </Button>
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
        {activeSection === 'requests' && renderRequests()}
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
