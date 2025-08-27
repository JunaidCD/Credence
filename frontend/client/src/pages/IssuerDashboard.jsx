import React, { useState, useEffect } from 'react';
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
  Trash2,
  Sparkles,
  Calendar,
  Shield,
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Star
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
    <div className="p-6 space-y-8">
      {/* Enhanced Header with Welcome Message */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 p-8 border border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Welcome back, {user.name}
              </h1>
              <p className="text-gray-300 text-lg">Ready to issue some amazing credentials today?</p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
              <div className="text-right">
                <p className="text-sm text-gray-400">Current Time</p>
                <p className="text-white font-semibold">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Verified Issuer</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced DID Display */}
      <Card className="credential-card mb-8 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-purple-500/30 shadow-2xl animate-slideInLeft">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Your Issuer DID</h3>
                <p className="text-gray-400 text-sm mb-3">Your unique decentralized identifier for credential issuance</p>
                <div className="flex items-center space-x-3">
                  <code className="bg-gray-800/80 text-purple-300 px-4 py-2 rounded-lg font-mono text-sm border border-purple-500/20">
                    {user?.did || 'did:ethr:0x' + (user?.id ? user.id.slice(-8) : '...')}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-200"
                    onClick={() => {
                      navigator.clipboard.writeText(user?.did || 'did:ethr:0x' + (user?.id ? user.id.slice(-8) : '...'));
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
                  <span>Verified Issuer</span>
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
        <Card className="glass-effect hover:scale-105 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-purple-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-purple-600/20 group-hover:bg-purple-600/30 transition-colors duration-300">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Issued</p>
                  <p className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300" data-testid="stat-total-issued">
                    {stats.totalIssued}
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
        
        <Card className="glass-effect hover:scale-105 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-300">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">This Month</p>
                  <p className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300" data-testid="stat-this-month">
                    {stats.thisMonth}
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
        
        <Card className="glass-effect hover:scale-105 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-cyan-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-cyan-600/20 group-hover:bg-cyan-600/30 transition-colors duration-300">
                  <Users className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Recipients</p>
                  <p className="text-3xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300" data-testid="stat-active-recipients">
                    {stats.activeRecipients}
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

      {/* Enhanced Recent Issuances */}
      <Card className="glass-effect hover:shadow-2xl transition-all duration-300 group">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <div className="p-2 rounded-lg bg-purple-600/20 mr-3">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              Recent Issuances
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Last 30 days</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {credentialsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : issuedCredentials.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                  <Award className="h-12 w-12 text-gray-600" />
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-purple-600/10 animate-ping"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No credentials issued yet</h3>
              <p className="text-gray-400 mb-6">Start your journey by issuing your first credential</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issuedCredentials.slice(0, 5).map((credential, index) => {
                const Icon = getCredentialIcon(credential.type);
                return (
                  <div key={credential.id} className="group/item hover:bg-gray-800/30 rounded-xl p-4 transition-all duration-200 border border-transparent hover:border-purple-500/20" data-testid={`recent-issuance-${index}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${getCredentialGradient(credential.type)} rounded-xl flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-200`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold group-hover/item:text-purple-300 transition-colors duration-200">{credential.title}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>Issued to {credential.metadata?.recipientName || 'Unknown'}</span>
                            <span>•</span>
                            <span>{new Date(credential.issueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                            credential.status === 'active' ? 'text-green-400 bg-green-500/20' : 
                            credential.status === 'revoked' ? 'text-red-400 bg-red-500/20' : 'text-yellow-400 bg-yellow-500/20'
                          }`}>
                            {credential.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            <span>{credential.status === 'active' ? 'Delivered' : credential.status}</span>
                          </div>
                        </div>
                        <Star className="h-4 w-4 text-gray-600 group-hover/item:text-yellow-400 transition-colors duration-200 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Quick Action Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-effect hover:scale-105 transition-all duration-300 group cursor-pointer" onClick={() => setActiveSection('issue')}>
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl group-hover:shadow-purple-500/50 transition-all duration-300">
                <PlusCircle className="h-8 w-8 text-white" />
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-purple-600/20 animate-ping group-hover:animate-none"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">Issue New Credential</h3>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Create and issue a new verifiable credential</p>
          </CardContent>
        </Card>

        <Card className="glass-effect hover:scale-105 transition-all duration-300 group cursor-pointer" onClick={() => setActiveSection('issued')}>
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-2xl group-hover:shadow-cyan-500/50 transition-all duration-300">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-cyan-600/20 animate-ping group-hover:animate-none"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">View All Credentials</h3>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Manage and track all issued credentials</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderIssue = () => (
    <div className="p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 p-8 border border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Issue New Credential
              </h1>
              <p className="text-gray-300 text-lg">Create and issue a verifiable credential with ease</p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="p-3 rounded-full bg-purple-600/20">
                <Send className="h-8 w-8 text-purple-400 floating-icon" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Secure Issuance</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Instant Delivery</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Enhanced Form */}
        <div className="lg:col-span-2">
          <Card className="glass-effect hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <form onSubmit={handleIssueCredential} className="space-y-8">
                {/* Enhanced Recipient Information Section */}
                <div className="relative">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-blue-600/20 mr-3">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Recipient Information</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <span>Full Name</span>
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          value={issueForm.recipientName}
                          onChange={(e) => setIssueForm(prev => ({ ...prev, recipientName: e.target.value }))}
                          placeholder="Enter recipient's full name"
                          className="bg-gray-800/50 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 pl-4 pr-4 py-3 rounded-xl transition-all duration-200 group-hover:border-purple-400"
                          required
                          data-testid="input-recipient-name"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <span>Recipient DID</span>
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          value={issueForm.recipientDID}
                          onChange={(e) => setIssueForm(prev => ({ ...prev, recipientDID: e.target.value }))}
                          placeholder="did:ethr:0x..."
                          className="bg-gray-800/50 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 pl-4 pr-4 py-3 rounded-xl transition-all duration-200 group-hover:border-purple-400 font-mono text-sm"
                          required
                          data-testid="input-recipient-did"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Credential Details Section */}
                <div className="relative">
                  <div className="flex items-center mb-6">
                    <div className="p-2 rounded-lg bg-purple-600/20 mr-3">
                      <Award className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Credential Details</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <span>Credential Type</span>
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <Select
                          value={issueForm.credentialType}
                          onValueChange={(value) => setIssueForm(prev => ({ ...prev, credentialType: value }))}
                        >
                          <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 h-12 rounded-xl transition-all duration-200 group-hover:border-purple-400" data-testid="select-credential-type">
                            <SelectValue placeholder="Select credential type..." />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="University Degree" className="text-white hover:bg-purple-600/20">🎓 University Degree</SelectItem>
                            <SelectItem value="Professional Certificate" className="text-white hover:bg-purple-600/20">📜 Professional Certificate</SelectItem>
                            <SelectItem value="Employment Verification" className="text-white hover:bg-purple-600/20">💼 Employment Verification</SelectItem>
                            <SelectItem value="Training Certificate" className="text-white hover:bg-purple-600/20">🏆 Training Certificate</SelectItem>
                            <SelectItem value="Achievement Award" className="text-white hover:bg-purple-600/20">🏅 Achievement Award</SelectItem>
                            <SelectItem value="Other" className="text-white hover:bg-purple-600/20">📋 Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                          <span>Credential Title</span>
                          <span className="text-red-400 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            value={issueForm.credentialTitle}
                            onChange={(e) => setIssueForm(prev => ({ ...prev, credentialTitle: e.target.value }))}
                            placeholder="Bachelor of Science in Computer Science"
                            className="bg-gray-800/50 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 pl-4 pr-4 py-3 rounded-xl transition-all duration-200 group-hover:border-purple-400"
                            required
                            data-testid="input-credential-title"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>
                      
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                          <span>Issue Date</span>
                          <span className="text-red-400 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={issueForm.issueDate}
                            onChange={(e) => setIssueForm(prev => ({ ...prev, issueDate: e.target.value }))}
                            className="bg-gray-800/50 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 pl-4 pr-4 py-3 rounded-xl transition-all duration-200 group-hover:border-purple-400"
                            required
                            data-testid="input-issue-date"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-300 mb-3">Expiry Date (Optional)</label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={issueForm.expiryDate}
                            onChange={(e) => setIssueForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                            className="bg-gray-800/50 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 pl-4 pr-4 py-3 rounded-xl transition-all duration-200 group-hover:border-purple-400"
                            data-testid="input-expiry-date"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>
                      
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-300 mb-3">Grade/Score (Optional)</label>
                        <div className="relative">
                          <Input
                            value={issueForm.grade}
                            onChange={(e) => setIssueForm(prev => ({ ...prev, grade: e.target.value }))}
                            placeholder="A+ or 95%"
                            className="bg-gray-800/50 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 pl-4 pr-4 py-3 rounded-xl transition-all duration-200 group-hover:border-purple-400"
                            data-testid="input-grade"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 py-3 rounded-xl transition-all duration-200"
                    data-testid="button-save-draft"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Save as Draft
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={issueCredentialMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50"
                    data-testid="button-issue-credential"
                  >
                    {issueCredentialMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Issuing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Issue Credential
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-1">
          <Card className="glass-effect sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <div className="p-2 rounded-lg bg-cyan-600/20 mr-3">
                  <Eye className="h-4 w-4 text-cyan-400" />
                </div>
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="credential-card rounded-xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {issueForm.credentialType && (
                      <div className={`w-8 h-8 bg-gradient-to-r ${getCredentialGradient(issueForm.credentialType)} rounded-lg flex items-center justify-center`}>
                        {React.createElement(getCredentialIcon(issueForm.credentialType), { className: "h-4 w-4 text-white" })}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">CREDENTIAL</p>
                      <p className="text-sm font-semibold text-white">{issueForm.credentialType || 'Select Type'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">STATUS</p>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400">Ready to Issue</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Title</p>
                    <p className="text-white font-medium">{issueForm.credentialTitle || 'Enter credential title...'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Recipient</p>
                      <p className="text-white text-sm">{issueForm.recipientName || 'Enter name...'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Issue Date</p>
                      <p className="text-white text-sm">{issueForm.issueDate ? new Date(issueForm.issueDate).toLocaleDateString() : 'Select date...'}</p>
                    </div>
                  </div>
                  
                  {issueForm.grade && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Grade</p>
                      <p className="text-white font-medium">{issueForm.grade}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400">Issued by {user.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
        <div className="relative flex-1 max-w-md">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative flex items-center">
              <div className="absolute left-4 z-10">
                <div className="p-1 rounded-lg bg-purple-600/20 group-hover:bg-purple-600/30 transition-colors duration-200">
                  <Eye className="h-4 w-4 text-purple-400 group-hover:text-purple-300" />
                </div>
              </div>
              <Input
                placeholder="Search by credential ID, holder name, or type..."
                className="bg-gray-800/80 backdrop-blur-sm border-purple-500/30 text-white pl-14 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 hover:border-purple-400/50 transition-all duration-200 placeholder:text-gray-500 group-hover:bg-gray-800/90"
                data-testid="input-search-credentials"
              />
              <div className="absolute right-3 flex items-center space-x-2">
                <div className="text-xs text-gray-500 hidden md:block">
                  <kbd className="px-2 py-1 bg-gray-700/50 rounded text-xs border border-gray-600/50">⌘K</kbd>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200"
                >
                  <Zap className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Advanced Search Filters */}
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-gray-800/95 backdrop-blur-sm border border-purple-500/20 rounded-xl shadow-2xl opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-300 z-50">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-gray-400 font-medium">Quick Filters:</span>
              <button className="px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded-md hover:bg-purple-600/30 transition-colors">
                Active
              </button>
              <button className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded-md hover:bg-blue-600/30 transition-colors">
                This Month
              </button>
              <button className="px-2 py-1 text-xs bg-cyan-600/20 text-cyan-300 rounded-md hover:bg-cyan-600/30 transition-colors">
                Degrees
              </button>
              <button className="px-2 py-1 text-xs bg-green-600/20 text-green-300 rounded-md hover:bg-green-600/30 transition-colors">
                Certificates
              </button>
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-medium">Tips:</span> Use quotes for exact matches, type "status:active" for status filtering
            </div>
          </div>
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
    <div className="p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 p-8 border border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Settings & Configuration
              </h1>
              <p className="text-gray-300 text-lg">Customize your issuer profile and preferences</p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="p-3 rounded-full bg-purple-600/20">
                <Shield className="h-8 w-8 text-purple-400 floating-icon" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Auto-save enabled</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Real-time sync</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Institution Information */}
          <Card className="glass-effect hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 rounded-lg bg-purple-600/20 mr-3 group-hover:bg-purple-600/30 transition-colors duration-300">
                    <Activity className="h-5 w-5 text-purple-400" />
                  </div>
                  Institution Information
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Live</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="group/field">
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <span>Institution Name</span>
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Input 
                      defaultValue={user.name} 
                      className="bg-gray-800/50 border-purple-500/30 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 hover:border-purple-400/50 transition-all duration-200 pl-4 pr-4 py-3 rounded-xl group-hover/field:bg-gray-800/70"
                      data-testid="input-institution-name"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover/field:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="group/field">
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <span>Contact Email</span>
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Input 
                      type="email" 
                      defaultValue={user.email} 
                      className="bg-gray-800/50 border-purple-500/30 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 hover:border-purple-400/50 transition-all duration-200 pl-4 pr-4 py-3 rounded-xl group-hover/field:bg-gray-800/70"
                      data-testid="input-contact-email"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover/field:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>
              </div>
              
              <div className="group/field">
                <label className="block text-sm font-medium text-gray-300 mb-3">Institution Type</label>
                <Select defaultValue="university">
                  <SelectTrigger className="bg-gray-800/50 border-purple-500/30 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 h-12 rounded-xl transition-all duration-200 group-hover/field:border-purple-400/50" data-testid="select-institution-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="university" className="text-white hover:bg-purple-600/20">🎓 University</SelectItem>
                    <SelectItem value="company" className="text-white hover:bg-purple-600/20">🏢 Company</SelectItem>
                    <SelectItem value="government" className="text-white hover:bg-purple-600/20">🏛️ Government Agency</SelectItem>
                    <SelectItem value="certification-body" className="text-white hover:bg-purple-600/20">📜 Certification Body</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-purple-600/20">🔧 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="glass-effect hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl">
                <div className="p-2 rounded-lg bg-green-600/20 mr-3 group-hover:bg-green-600/30 transition-colors duration-300">
                  <Shield className="h-5 w-5 text-green-400" />
                </div>
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-green-500/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-green-600/20">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                    <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <Button variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                  Enable
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-blue-500/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-600/20">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Activity Monitoring</h4>
                    <p className="text-gray-400 text-sm">Track credential issuance and access logs</p>
                  </div>
                </div>
                <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Credential Templates */}
          <Card className="glass-effect hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl">
                <div className="p-2 rounded-lg bg-cyan-600/20 mr-3 group-hover:bg-cyan-600/30 transition-colors duration-300">
                  <FileText className="h-5 w-5 text-cyan-400" />
                </div>
                Credential Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-6">
                Create and manage templates for commonly issued credentials to streamline your workflow
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-800/30 rounded-xl border border-cyan-500/20 hover:border-cyan-400/40 transition-colors duration-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <GraduationCap className="h-5 w-5 text-cyan-400" />
                    <h4 className="text-white font-medium">Degree Templates</h4>
                  </div>
                  <p className="text-gray-400 text-sm">3 active templates</p>
                </div>
                
                <div className="p-4 bg-gray-800/30 rounded-xl border border-purple-500/20 hover:border-purple-400/40 transition-colors duration-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Award className="h-5 w-5 text-purple-400" />
                    <h4 className="text-white font-medium">Certificate Templates</h4>
                  </div>
                  <p className="text-gray-400 text-sm">5 active templates</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
                  data-testid="button-manage-templates"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
                <Button 
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-6 py-2 rounded-xl"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Manage All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-lg">Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Account Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Credentials Issued</span>
                <span className="text-white font-semibold">{stats.totalIssued}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">This Month</span>
                <span className="text-white font-semibold">{stats.thisMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Active Recipients</span>
                <span className="text-white font-semibold">{stats.activeRecipients}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                onClick={() => setActiveSection('issue')}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Issue Credential
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                onClick={() => setActiveSection('issued')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All Credentials
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
              >
                <Activity className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>

          {/* Enhanced Support Section */}
          <Card className="glass-effect hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <div className="p-2 rounded-lg bg-indigo-600/20 mr-3 group-hover:bg-indigo-600/30 transition-colors duration-300">
                    <Activity className="h-5 w-5 text-indigo-400" />
                  </div>
                  Need Help?
                </CardTitle>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-gray-400 text-sm">Get assistance and resources</p>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="p-4 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-200 group/item cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-600/20 group-hover/item:bg-blue-600/30 transition-colors duration-200">
                    <FileText className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium group-hover/item:text-blue-300 transition-colors duration-200">Documentation</h4>
                    <p className="text-gray-400 text-xs">Comprehensive guides and tutorials</p>
                  </div>
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 text-xs">→</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-xl border border-green-500/20 hover:border-green-400/40 transition-all duration-200 group/item cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-green-600/20 group-hover/item:bg-green-600/30 transition-colors duration-200">
                    <Users className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium group-hover/item:text-green-300 transition-colors duration-200">Contact Support</h4>
                    <p className="text-gray-400 text-xs">Get help from our expert team</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 text-xs">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-orange-600/10 to-yellow-600/10 rounded-xl border border-orange-500/20 hover:border-orange-400/40 transition-all duration-200 group/item cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-600/20 group-hover/item:bg-orange-600/30 transition-colors duration-200">
                    <Activity className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium group-hover/item:text-orange-300 transition-colors duration-200">System Status</h4>
                    <p className="text-gray-400 text-xs">Check service availability</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-green-400">Online</span>
                    </div>
                    <div className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <span className="text-orange-400 text-xs">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-200 group/item cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-purple-600/20 group-hover/item:bg-purple-600/30 transition-colors duration-200">
                    <Zap className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium group-hover/item:text-purple-300 transition-colors duration-200">Feature Requests</h4>
                    <p className="text-gray-400 text-xs">Suggest new features and improvements</p>
                  </div>
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 text-xs">→</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700/50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Response time: ~2 hours</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
