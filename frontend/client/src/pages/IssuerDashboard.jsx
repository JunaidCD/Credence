import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import IssuerSidebar from '@/components/IssuerSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Award, 
  TrendingUp, 
  Users, 
  Activity,
  PlusCircle,
  Send,
  GraduationCap,
  FileText,
  Car,
  Eye,
  Trash2
} from 'lucide-react';

const IssuerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [issueForm, setIssueForm] = useState({
    recipientName: '',
    recipientDID: '',
    credentialType: '',
    credentialTitle: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    grade: '',
    metadata: ''
  });

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== 'issuer')) {
      setLocation('/');
    }
  }, [isAuthenticated, user, setLocation]);

  // Queries
  const { data: issuedCredentials = [], isLoading: credentialsLoading } = useQuery({
    queryKey: ['/api/credentials/issuer', user?.id],
    enabled: !!user?.id,
  });

  // Mutations
  const issueCredentialMutation = useMutation({
    mutationFn: async (credentialData) => {
      // First, find user by DID
      const userResponse = await fetch(`/api/users/did/${credentialData.recipientDID}`);
      if (!userResponse.ok) {
        throw new Error('Recipient with this DID not found');
      }
      const recipient = await userResponse.json();

      // Parse metadata
      let parsedMetadata = {};
      if (credentialData.metadata) {
        try {
          parsedMetadata = JSON.parse(credentialData.metadata);
        } catch (e) {
          parsedMetadata = { description: credentialData.metadata };
        }
      }

      // Add issuer info to metadata
      parsedMetadata.issuer = user.name;
      if (credentialData.grade) {
        parsedMetadata.grade = credentialData.grade;
      }

      // Issue credential
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: recipient.id,
          issuerId: user.id,
          type: credentialData.credentialType,
          title: credentialData.credentialTitle,
          issueDate: new Date(credentialData.issueDate),
          expiryDate: credentialData.expiryDate ? new Date(credentialData.expiryDate) : null,
          metadata: parsedMetadata
        })
      });
      
      if (!response.ok) throw new Error('Failed to issue credential');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/issuer'] });
      setIssueForm({
        recipientName: '',
        recipientDID: '',
        credentialType: '',
        credentialTitle: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        grade: '',
        metadata: ''
      });
      toast({
        title: "Credential Issued",
        description: "Credential has been issued successfully!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Issuance Failed",
        description: error.message,
      });
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
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/issuer'] });
      toast({
        title: "Credential Revoked",
        description: "Credential has been revoked successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Revocation Failed",
        description: error.message,
      });
    }
  });

  const handleIssueCredential = (e) => {
    e.preventDefault();
    if (!issueForm.recipientDID || !issueForm.credentialType || !issueForm.credentialTitle) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    issueCredentialMutation.mutate(issueForm);
  };

  const handleRevokeCredential = (credentialId) => {
    if (window.confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
      revokeCredentialMutation.mutate(credentialId);
    }
  };

  const getCredentialIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'university degree':
      case 'degree':
        return GraduationCap;
      case 'professional certificate':
      case 'certificate':
        return Award;
      case 'training certificate':
        return Award;
      default:
        return FileText;
    }
  };

  const getCredentialGradient = (type) => {
    switch (type.toLowerCase()) {
      case 'university degree':
      case 'degree':
        return 'from-web3-purple to-web3-blue';
      case 'professional certificate':
      case 'certificate':
        return 'from-web3-blue to-web3-cyan';
      default:
        return 'from-web3-cyan to-web3-purple';
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const stats = {
    totalIssued: issuedCredentials.length,
    thisMonth: issuedCredentials.filter(c => {
      const issueDate = new Date(c.issueDate);
      const now = new Date();
      return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear();
    }).length,
    activeRecipients: new Set(issuedCredentials.filter(c => c.status === 'active').map(c => c.userId)).size,
  };

  const renderDashboard = () => (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Issuer Dashboard</h1>
        <p className="text-gray-400">Issue and manage verifiable credentials</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Issued</p>
                <p className="text-3xl font-bold text-web3-purple" data-testid="stat-total-issued">
                  {stats.totalIssued}
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
                <p className="text-gray-400">This Month</p>
                <p className="text-3xl font-bold text-web3-blue" data-testid="stat-this-month">
                  {stats.thisMonth}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-web3-blue" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Active Recipients</p>
                <p className="text-3xl font-bold text-web3-cyan" data-testid="stat-active-recipients">
                  {stats.activeRecipients}
                </p>
              </div>
              <Users className="h-8 w-8 text-web3-cyan" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Issuances */}
      <Card className="glass-effect mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-web3-purple" />
            Recent Issuances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credentialsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : issuedCredentials.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No credentials issued yet</p>
          ) : (
            <div className="space-y-4">
              {issuedCredentials.slice(0, 5).map((credential, index) => {
                const Icon = getCredentialIcon(credential.type);
                return (
                  <div key={credential.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-b-0" data-testid={`recent-issuance-${index}`}>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 bg-gradient-to-r ${getCredentialGradient(credential.type)} rounded-full flex items-center justify-center mr-3`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{credential.title}</p>
                        <p className="text-gray-400 text-sm">
                          Issued to {credential.metadata?.recipientName || 'Unknown'} • {new Date(credential.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${
                        credential.status === 'active' ? 'text-green-500' : 
                        credential.status === 'revoked' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {credential.status === 'active' ? 'Delivered' : credential.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Issue Button */}
      <div className="text-center">
        <Button 
          onClick={() => setActiveSection('issue')}
          className="glow-button text-white px-8 py-4 text-lg font-semibold rounded-xl flex items-center mx-auto"
          data-testid="button-quick-issue"
        >
          <PlusCircle className="mr-2 h-6 w-6" />
          Issue New Credential
        </Button>
      </div>
    </div>
  );

  const renderIssue = () => (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Issue Credential</h1>
        <p className="text-gray-400">Create and issue a new verifiable credential</p>
      </div>

      <div className="max-w-3xl">
        <Card className="glass-effect">
          <CardContent className="p-6">
            <form onSubmit={handleIssueCredential} className="space-y-6">
              {/* Recipient Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recipient Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <Input
                      value={issueForm.recipientName}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="John Doe"
                      className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple"
                      required
                      data-testid="input-recipient-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Recipient DID</label>
                    <Input
                      value={issueForm.recipientDID}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, recipientDID: e.target.value }))}
                      placeholder="did:ethr:0x..."
                      className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple"
                      required
                      data-testid="input-recipient-did"
                    />
                  </div>
                </div>
              </div>

              {/* Credential Details */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Credential Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Credential Type</label>
                    <Select
                      value={issueForm.credentialType}
                      onValueChange={(value) => setIssueForm(prev => ({ ...prev, credentialType: value }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple" data-testid="select-credential-type">
                        <SelectValue placeholder="Select credential type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="University Degree">University Degree</SelectItem>
                        <SelectItem value="Professional Certificate">Professional Certificate</SelectItem>
                        <SelectItem value="Employment Verification">Employment Verification</SelectItem>
                        <SelectItem value="Training Certificate">Training Certificate</SelectItem>
                        <SelectItem value="Achievement Award">Achievement Award</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Credential Title</label>
                      <Input
                        value={issueForm.credentialTitle}
                        onChange={(e) => setIssueForm(prev => ({ ...prev, credentialTitle: e.target.value }))}
                        placeholder="Bachelor of Science in Computer Science"
                        className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple"
                        required
                        data-testid="input-credential-title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Issue Date</label>
                      <Input
                        type="date"
                        value={issueForm.issueDate}
                        onChange={(e) => setIssueForm(prev => ({ ...prev, issueDate: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple"
                        required
                        data-testid="input-issue-date"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date (Optional)</label>
                      <Input
                        type="date"
                        value={issueForm.expiryDate}
                        onChange={(e) => setIssueForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple"
                        data-testid="input-expiry-date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Grade/Score (Optional)</label>
                      <Input
                        value={issueForm.grade}
                        onChange={(e) => setIssueForm(prev => ({ ...prev, grade: e.target.value }))}
                        placeholder="A+ or 95%"
                        className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple"
                        data-testid="input-grade"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Additional Metadata (JSON)</label>
                    <Textarea
                      value={issueForm.metadata}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, metadata: e.target.value }))}
                      rows={4}
                      placeholder='{"field_of_study": "Computer Science", "university": "Stanford University", "honors": ["Summa Cum Laude"]}'
                      className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple font-mono text-sm"
                      data-testid="textarea-metadata"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  data-testid="button-save-draft"
                >
                  Save as Draft
                </Button>
                <Button 
                  type="submit" 
                  disabled={issueCredentialMutation.isPending}
                  className="flex-1 glow-button text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center"
                  data-testid="button-issue-credential"
                >
                  <Send className="mr-2 h-5 w-5" />
                  {issueCredentialMutation.isPending ? 'Issuing...' : 'Issue Credential'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderIssued = () => (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Issued Credentials</h1>
        <p className="text-gray-400">View and manage all credentials you've issued</p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex space-x-4">
          <Button className="px-4 py-2 bg-web3-purple bg-opacity-20 text-web3-purple rounded-lg font-medium">
            All Credentials
          </Button>
          <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
            Degrees
          </Button>
          <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
            Certificates
          </Button>
          <Button variant="ghost" className="px-4 py-2 text-gray-400 hover:text-white">
            Other
          </Button>
        </div>
        <div className="flex space-x-3">
          <Input
            placeholder="Search credentials..."
            className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple"
            data-testid="input-search-credentials"
          />
          <Button
            variant="outline"
            className="border-web3-purple text-web3-purple hover:bg-web3-purple hover:text-white"
            data-testid="button-search"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
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
          ) : issuedCredentials.length === 0 ? (
            <div className="text-center py-16">
              <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Credentials Issued</h3>
              <p className="text-gray-400 mb-6">Start by issuing your first credential</p>
              <Button 
                onClick={() => setActiveSection('issue')}
                className="glow-button text-white px-6 py-3 rounded-xl font-semibold"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Issue First Credential
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Credential</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Recipient</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Issue Date</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedCredentials.map((credential, index) => {
                    const Icon = getCredentialIcon(credential.type);
                    return (
                      <tr key={credential.id} className="border-b border-gray-800 hover:bg-gray-800 hover:bg-opacity-50" data-testid={`credential-row-${index}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 bg-gradient-to-r ${getCredentialGradient(credential.type)} rounded-lg flex items-center justify-center mr-3`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{credential.title}</p>
                              <p className="text-gray-400 text-sm">{credential.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-white">{credential.metadata?.recipientName || 'Unknown'}</p>
                          <p className="text-gray-400 text-sm font-mono">
                            {credential.userId ? `User ID: ${credential.userId.slice(-6)}` : 'N/A'}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-gray-400">
                          {new Date(credential.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                            credential.status === 'active' ? 'text-green-500 bg-green-500 bg-opacity-20' :
                            credential.status === 'revoked' ? 'text-red-500 bg-red-500 bg-opacity-20' :
                            'text-yellow-500 bg-yellow-500 bg-opacity-20'
                          }`}>
                            {credential.status === 'active' ? 'Delivered' : credential.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-web3-purple hover:text-web3-blue"
                              data-testid={`button-view-${index}`}
                            >
                              View
                            </Button>
                            {credential.status === 'active' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRevokeCredential(credential.id)}
                                className="text-red-400 hover:text-red-300"
                                data-testid={`button-revoke-${index}`}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure your issuer settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Institution Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Institution Name</label>
              <Input 
                defaultValue={user.name} 
                className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple"
                data-testid="input-institution-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
              <Input 
                type="email" 
                defaultValue={user.email} 
                className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple"
                data-testid="input-contact-email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Institution Type</label>
              <Select defaultValue="university">
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-web3-purple" data-testid="select-institution-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="government">Government Agency</SelectItem>
                  <SelectItem value="certification-body">Certification Body</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Credential Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Create and manage templates for commonly issued credentials
            </p>
            <Button 
              variant="outline"
              className="border-web3-purple text-web3-purple hover:bg-web3-purple hover:text-white"
              data-testid="button-manage-templates"
            >
              Manage Templates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen pt-16">
      <IssuerSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
      />
      
      <div className="flex-1 overflow-auto">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'issue' && renderIssue()}
        {activeSection === 'issued' && renderIssued()}
        {activeSection === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default IssuerDashboard;
