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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import web3Service from '@/utils/web3.js';
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

const UserDashboard = () => {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Web3 and User Registration state - independent from AuthContext
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isEligibleUser, setIsEligibleUser] = useState(false);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const [userDID, setUserDID] = useState('');
  const [userName, setUserName] = useState('User');
  
  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  // Initialize Web3 service
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        await web3Service.init();
        
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setWalletConnected(true);
            await checkUserStatus(accounts[0]);
          }
        }
      } catch (error) {
        console.error('Web3 initialization failed:', error);
      }
    };

    initWeb3();
  }, []);

  // Listen for MetaMask account changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0];
        setWalletAddress(newAccount);
        setWalletConnected(true);
        await checkUserStatus(newAccount);
        
        toast({
          title: "Account Changed",
          description: `Switched to ${newAccount.slice(0, 6)}...${newAccount.slice(-4)}`,
        });
      } else {
        setWalletConnected(false);
        setWalletAddress('');
        setIsEligibleUser(false);
        setIsRegisteredUser(false);
        setUserDID('');
      }
    };

    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Cleanup listener on component unmount
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [toast]);

  const checkUserStatus = async (address) => {
    try {
      const isEligible = await web3Service.validateUserRegistration(address);
      setIsEligibleUser(isEligible);
      setIsRegisteredUser(false);
    } catch (error) {
      console.error('Failed to check user status:', error);
      setIsEligibleUser(false);
      setIsRegisteredUser(false);
    }
  };

  const connectWallet = async () => {
    try {
      const connection = await web3Service.connectWallet();
      setWalletAddress(connection.account);
      setWalletConnected(true);
      await checkUserStatus(connection.account);
      
      toast({
        title: "Wallet Connected! 🎉",
        description: `Connected to ${connection.account.slice(0, 6)}...${connection.account.slice(-4)}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const registerAsUser = async () => {
    try {
      if (!walletConnected || !walletAddress) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your MetaMask wallet first",
          variant: "destructive"
        });
        return;
      }

      await web3Service.init();
      await web3Service.connectWallet();

      const result = await web3Service.registerUser(userName, '');

      if (result.success) {
        const response = await fetch('/api/auth/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: result.address,
            userType: 'user',
            name: userName,
            email: '',
            signature: result.signature
          })
        });

        if (response.ok) {
          setIsRegisteredUser(true);
          setUserDID(`did:ethr:${result.address}`);
          
          toast({
            title: "Registration Successful! 🎉",
            description: "You are now registered as a user. You can now view your credentials!",
          });
        } else {
          throw new Error('Only Hardhat accounts 2-7 can register as users. Please use a valid user account.');
        }
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Queries - User-specific data
  const { data: myCredentials = [], isLoading: credentialsLoading } = useQuery({
    queryKey: [`/api/credentials/wallet/${walletAddress}`],
    queryFn: async () => {
      if (!walletAddress) return [];
      try {
        const response = await fetch(`/api/credentials/wallet/${walletAddress}`);
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error('Failed to fetch credentials:', error);
        return [];
      }
    },
    enabled: !!walletAddress,
  });

  const { data: verificationRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/verification-requests/wallet', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      try {
        const response = await fetch(`/api/verification-requests/wallet/${walletAddress}`);
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error('Failed to fetch verification requests:', error);
        return [];
      }
    },
    enabled: !!walletAddress,
  });

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
      queryClient.invalidateQueries({ queryKey: ['/api/verification-requests/wallet'] });
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
    const didToCopy = userDID || `did:ethr:${walletAddress || '0x...'}`;
    navigator.clipboard.writeText(didToCopy);
    toast({
      title: "DID Copied",
      description: "Your DID has been copied to clipboard!",
    });
  };

  const renderDashboard = () => (
    <div className="p-6 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 p-8 border border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2" data-testid="dashboard-welcome">
                Welcome back, {userName}!
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
        </div>
      </div>

      <Card className="bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-purple-500/30 shadow-2xl">
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
                    {userDID || `did:ethr:${walletAddress || '0x...'}`}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-200"
                    onClick={copyDID}
                  >
                    Copy DID
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm">
                <Wallet className="h-8 w-8 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">User Registration</h3>
                <p className="text-gray-400 text-sm mb-3">Connect MetaMask wallet (accounts 2-7) and register on blockchain</p>
                
                {!walletConnected ? (
                  <Button
                    onClick={connectWallet}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Connect MetaMask</span>
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Connected</span>
                      </div>
                      <code className="bg-gray-800/80 text-blue-300 px-3 py-1 rounded-lg font-mono text-sm">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </code>
                    </div>
                    
                    {!isRegisteredUser && isEligibleUser && (
                      <Button
                        onClick={registerAsUser}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200"
                      >
                        <User className="h-5 w-5" />
                        <span>Register as User</span>
                      </Button>
                    )}
                    
                    {!isEligibleUser && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 text-sm flex items-center">
                          <X className="h-4 w-4 mr-2" />
                          Only Hardhat accounts 2-7 can register as users
                        </p>
                      </div>
                    )}
                    
                    {isRegisteredUser && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-400 text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Already registered as user
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-purple-600/20">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Credentials</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-total-credentials">
                    {myCredentials.length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-blue-600/20">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Pending Requests</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-pending-requests">
                    {verificationRequests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-cyan-600/20">
                  <CheckCircle className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">Verified Shares</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-verified-shares">
                    {verificationRequests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCredentials = () => {
    if (!isRegisteredUser) {
      return (
        <div className="p-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-12 w-12 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Registration Required</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                To access your credentials, please register as a user by connecting your MetaMask wallet and signing a transaction.
              </p>
              <div className="space-y-4 max-w-sm mx-auto">
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-400 font-semibold">1</span>
                  </div>
                  Connect MetaMask wallet (accounts 2-7 only)
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-400 font-semibold">2</span>
                  </div>
                  Click "Register as User" button
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-400 font-semibold">3</span>
                  </div>
                  Sign MetaMask transaction to complete registration
                </div>
              </div>
              <Button
                onClick={() => setActiveSection('dashboard')}
                className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">My Credentials</h2>
            <p className="text-gray-400">Manage and view your verifiable credentials</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
            <CheckCircle className="h-4 w-4" />
            <span>Registered User</span>
          </div>
        </div>

        {credentialsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-gray-800/50">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : myCredentials.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Credentials Yet</h3>
              <p className="text-gray-400">Your issued credentials will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCredentials.map((credential) => (
              <CredentialCard key={credential.id} credential={credential} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderVerificationRequests = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Verification Requests</h2>
          <p className="text-gray-400">Manage requests to share your credentials</p>
        </div>
      </div>

      {requestsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-gray-800/50">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : verificationRequests.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Verification Requests</h3>
            <p className="text-gray-400">Requests to share your credentials will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {verificationRequests.map((request) => (
            <Card key={request.id} className="bg-gray-800/50 border-gray-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {request.credentialType} Verification
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      Requested by: {request.verifier?.name || 'Unknown Verifier'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveRequest(request.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="flex">
        <UserSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        
        <main className="flex-1 ml-64">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'credentials' && renderCredentials()}
          {activeSection === 'verification-requests' && renderVerificationRequests()}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
