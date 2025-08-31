import React, { useState, useEffect, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Calendar,
  AlertCircle
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
      console.log('Account changed detected:', accounts);
      
      if (accounts.length > 0) {
        const newAccount = accounts[0];
        const previousAccount = walletAddress;
        
        // Update wallet state
        setWalletAddress(newAccount);
        setWalletConnected(true);
        
        // Reset user registration status for new account
        setIsRegisteredUser(false);
        setUserDID('');
        
        // Check eligibility for new account
        await checkUserStatus(newAccount);
        
        // Clear old credential queries and refetch for new account
        if (previousAccount !== newAccount) {
          console.log(`Switching from ${previousAccount} to ${newAccount}`);
          
          // Invalidate all credential queries for the old account
          queryClient.removeQueries({ queryKey: [`/api/credentials/wallet/${previousAccount}`] });
          queryClient.removeQueries({ queryKey: ['blockchain-credentials', previousAccount] });
          
          // Immediately refetch for new account
          queryClient.invalidateQueries({ queryKey: [`/api/credentials/wallet/${newAccount}`] });
          queryClient.invalidateQueries({ queryKey: ['blockchain-credentials', newAccount] });
          
          // Update web3Service account
          web3Service.account = newAccount;
          
          // Force reconnection with new account
          try {
            await web3Service.connectWallet();
          } catch (connectError) {
            console.log('Could not reconnect web3Service with new account:', connectError.message);
          }
          
          toast({
            title: "Account Changed",
            description: `Switched to ${newAccount.slice(0, 6)}...${newAccount.slice(-4)}. Refreshing credentials...`,
          });
        }
      } else {
        // No accounts connected
        setWalletConnected(false);
        setWalletAddress('');
        setIsEligibleUser(false);
        setIsRegisteredUser(false);
        setUserDID('');
        
        // Clear all credential queries
        queryClient.clear();
        
        toast({
          title: "Wallet Disconnected",
          description: "Please reconnect your wallet to view credentials",
          variant: "destructive"
        });
      }
    };

    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Cleanup listener on component unmount
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [toast, walletAddress, queryClient]);

  const checkUserStatus = async (address) => {
    try {
      console.log('Checking user status for address:', address);
      const isEligible = await web3Service.validateUserRegistration(address);
      console.log('User eligibility result:', isEligible);
      setIsEligibleUser(isEligible);
      
      // Check if user is already registered
      try {
        const registrationStatus = await web3Service.checkUserRegistrationStatus(address);
        console.log('Registration status:', registrationStatus);
        setIsRegisteredUser(registrationStatus.isRegistered);
      } catch (regError) {
        console.log('Could not check registration status, assuming not registered');
        setIsRegisteredUser(false);
      }
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
      
      // Immediately fetch credentials for the connected account
      queryClient.invalidateQueries({ queryKey: [`/api/credentials/wallet/${connection.account}`] });
      queryClient.invalidateQueries({ queryKey: ['blockchain-credentials', connection.account] });
      
      toast({
        title: "Wallet Connected! ",
        description: `Connected to ${connection.account.slice(0, 6)}...${connection.account.slice(-4)}. Fetching credentials...`,
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

      // First register on blockchain and fetch existing credentials
      let blockchainResult;
      try {
        blockchainResult = await web3Service.registerUserOnBlockchain(userName, '');
      } catch (blockchainError) {
        console.error('Blockchain registration failed:', blockchainError);
        // Try alternative registration method
        blockchainResult = await web3Service.registerUser(userName, '');
        blockchainResult.credentials = [];
      }
      
      if (blockchainResult.success) {
        // Register with backend
        const response = await fetch('/api/auth/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: blockchainResult.address,
            userType: 'user',
            name: userName,
            email: '',
            transactionHash: blockchainResult.transactionHash
          })
        });

        if (response.ok) {
          setIsRegisteredUser(true);
          setUserDID(`did:ethr:${blockchainResult.address}`);
          
          // Store blockchain credentials in backend if any exist
          if (blockchainResult.credentials && blockchainResult.credentials.length > 0) {
            await fetch('/api/credentials/sync-blockchain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                walletAddress: blockchainResult.address,
                credentials: blockchainResult.credentials
              })
            });
          }
          
          // Force immediate refresh of credentials for current account
          queryClient.removeQueries({ queryKey: [`/api/credentials/wallet/${walletAddress}`] });
          queryClient.removeQueries({ queryKey: ['blockchain-credentials', walletAddress] });
          
          // Refetch credentials immediately
          queryClient.refetchQueries({ queryKey: [`/api/credentials/wallet/${walletAddress}`] });
          queryClient.refetchQueries({ queryKey: ['blockchain-credentials', walletAddress] });
          
          toast({
            title: "Registration Successful! 🎉",
            description: `You are now registered as a user. Found ${blockchainResult.credentials?.length || 0} existing credentials on blockchain.`,
          });
          
        } else {
          throw new Error('Backend registration failed. Please try again.');
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

  // Query for backend credentials - only fetch if user is registered
  const { data: backendCredentials = [], isLoading: backendLoading } = useQuery({
    queryKey: [`/api/credentials/wallet/${walletAddress}`],
    queryFn: async () => {
      if (!walletAddress || !isRegisteredUser) return [];
      const response = await fetch(`/api/credentials/wallet/${walletAddress}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!walletAddress && isRegisteredUser,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Query for blockchain credentials - only fetch if user is registered
  const { data: blockchainCredentials = [], isLoading: blockchainLoading } = useQuery({
    queryKey: ['blockchain-credentials', walletAddress],
    queryFn: async () => {
      if (!walletAddress || !isRegisteredUser) {
        console.log('No wallet address or user not registered, skipping blockchain credential fetch');
        return [];
      }
      
      try {
        console.log(`Fetching blockchain credentials for registered user: ${walletAddress}`);
        await web3Service.init();
        
        // Ensure web3Service has the current account
        const currentAccount = await web3Service.getCurrentAccount();
        if (currentAccount && currentAccount.toLowerCase() === walletAddress.toLowerCase()) {
          web3Service.account = currentAccount;
          // Only connect if not already connected to avoid errors
          if (!web3Service.isConnected()) {
            try {
              await web3Service.connectWallet();
            } catch (connectError) {
              console.log('Web3 connection error, continuing with direct credential fetch:', connectError.message);
            }
          }
        }
        
        const credentials = await web3Service.getHolderCredentials(walletAddress);
        console.log(`Fetched ${credentials.length} blockchain credentials for ${walletAddress}:`, credentials);
        return credentials;
      } catch (error) {
        console.error('Failed to fetch blockchain credentials:', error);
        return [];
      }
    },
    enabled: !!walletAddress && isRegisteredUser,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Combine and deduplicate credentials from both sources - only if user is registered
  const myCredentials = React.useMemo(() => {
    if (!isRegisteredUser) {
      return []; // Return empty array if user is not registered
    }
    
    const combined = [...backendCredentials, ...blockchainCredentials];
    // Deduplicate by credential ID, preferring blockchain data
    const credentialMap = new Map();
    
    // First add backend credentials
    backendCredentials.forEach(cred => {
      credentialMap.set(cred.id, { ...cred, source: 'backend' });
    });
    
    // Then add blockchain credentials (will override backend if same ID)
    blockchainCredentials.forEach(cred => {
      credentialMap.set(cred.id, { ...cred, source: 'blockchain' });
    });
    
    return Array.from(credentialMap.values());
  }, [backendCredentials, blockchainCredentials, isRegisteredUser]);

  const credentialsLoading = backendLoading || blockchainLoading;

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2" data-testid="dashboard-welcome">
                Welcome back, {userName}!
              </h1>
              <p className="text-gray-300 text-lg">Manage your digital identity and verifiable credentials</p>
              {walletAddress && (
                <p className="text-sm text-gray-400 mt-2">
                  Connected Account: <code className="bg-gray-800/80 text-cyan-300 px-2 py-1 rounded">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</code>
                </p>
              )}
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
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-xs text-blue-400">{blockchainCredentials.length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-xs text-purple-400">{backendCredentials.length}</span>
                    </div>
                  </div>
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
    // Show credentials if wallet is connected, regardless of registration status
    if (!walletConnected || !walletAddress) {
      return (
        <div className="p-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-12 w-12 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet Required</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                To view your credentials, please connect your MetaMask wallet first.
              </p>
              <div className="space-y-4 max-w-sm mx-auto">
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-400 font-semibold">1</span>
                  </div>
                  Connect MetaMask wallet
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-400 font-semibold">2</span>
                  </div>
                  Register as user to access credentials
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-400 font-semibold">3</span>
                  </div>
                  View your issued credentials
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
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-blue-400 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
              <Wallet className="h-4 w-4" />
              <span>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
              <Activity className="h-4 w-4" />
              <span>Auto-Sync: ON</span>
            </div>
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
              <p className="text-gray-400 mb-4">
                {!isRegisteredUser 
                  ? "Register as a user to check for existing credentials issued to your wallet address on the blockchain"
                  : "No credentials have been issued to your wallet address yet. Credentials issued on the blockchain will appear here automatically."
                }
              </p>
              {!isRegisteredUser && (
                <Button
                  onClick={() => setActiveSection('dashboard')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Register Now
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">Blockchain: {blockchainCredentials.length}</span>
                </div>
                <div className="flex items-center space-x-2 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400 text-sm font-medium">Backend: {backendCredentials.length}</span>
                </div>
                <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Total: {myCredentials.length}</span>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCredentials.map((credential) => (
                <CredentialCard key={`${credential.source}-${credential.id}`} credential={credential} />
              ))}
            </div>
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

  const renderNotifications = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Notifications</h2>
          <p className="text-gray-400">Stay updated with your credential activities</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
        >
          Mark All Read
        </Button>
      </div>

      <div className="space-y-4">
        {/* Sample notifications - replace with real data */}
        {[
          {
            id: 1,
            type: 'credential_issued',
            title: 'New Credential Received',
            message: 'You have received a University Degree credential from ABC University',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            read: false,
            icon: Award,
            color: 'green'
          },
          {
            id: 2,
            type: 'verification_request',
            title: 'Verification Request',
            message: 'XYZ Company has requested to verify your Professional Certificate',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            read: false,
            icon: Shield,
            color: 'blue'
          },
          {
            id: 3,
            type: 'credential_expired',
            title: 'Credential Expiring Soon',
            message: 'Your Training Certificate will expire in 7 days',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            read: true,
            icon: Clock,
            color: 'yellow'
          }
        ].map((notification) => {
          const IconComponent = notification.icon;
          return (
            <Card key={notification.id} className={`bg-gray-800/50 border-gray-700/50 ${!notification.read ? 'border-l-4 border-l-purple-500' : ''} hover:bg-gray-800/70 transition-all duration-200`}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    notification.color === 'green' ? 'bg-green-600/20' :
                    notification.color === 'blue' ? 'bg-blue-600/20' :
                    notification.color === 'yellow' ? 'bg-yellow-600/20' : 'bg-purple-600/20'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      notification.color === 'green' ? 'text-green-400' :
                      notification.color === 'blue' ? 'text-blue-400' :
                      notification.color === 'yellow' ? 'text-yellow-400' : 'text-purple-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{notification.title}</h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-gray-400 mb-3">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500 text-sm">
                        {notification.timestamp.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {!notification.read && (
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-300">
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state for when no notifications */}
      {false && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Notifications</h3>
            <p className="text-gray-400">You're all caught up! New notifications will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderRevokeCredentials = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Revoke Credentials</h2>
          <p className="text-gray-400">Manage and revoke credentials you have shared</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
          <ShieldX className="h-4 w-4" />
          <span>Revocation Control</span>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <Label className="text-gray-300 mb-2 block">Search Credentials</Label>
              <Input
                placeholder="Search by credential type, title, or issuer..."
                className="bg-gray-900/50 border-gray-600 text-white"
              />
            </div>
            <div className="w-48">
              <Label className="text-gray-300 mb-2 block">Filter by Status</Label>
              <Select defaultValue="all">
                <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Credentials</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials List for Revocation */}
      {credentialsLoading ? (
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
      ) : myCredentials.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldX className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Credentials to Revoke</h3>
            <p className="text-gray-400 mb-6">You don't have any credentials that can be revoked</p>
            <Button
              onClick={() => setActiveSection('credentials')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              View My Credentials
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myCredentials.filter(credential => credential.status === 'active').map((credential) => (
            <Card key={credential.id} className="bg-gray-800/50 border-gray-700/50 hover:border-red-500/30 transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-red-600/20 group-hover:bg-red-600/30 transition-colors duration-200">
                      <Award className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {credential.metadata?.title || credential.type}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Type: {credential.type}</span>
                        <span>•</span>
                        <span>Issued: {new Date(credential.issueDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Issuer: {credential.metadata?.issuerName || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          Active
                        </span>
                        {credential.metadata?.collegeName && (
                          <span className="text-gray-500 text-xs">
                            {credential.metadata.collegeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-400 hover:bg-gray-700"
                      onClick={() => setActiveSection('credentials')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30 hover:border-red-400"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to revoke access to this credential? This action cannot be undone.')) {
                          toast({
                            title: "Credential Access Revoked",
                            description: "You have revoked access to this credential.",
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Revoke Access
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Revocation Information */}
      <Card className="bg-yellow-500/10 border-yellow-500/30">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-400 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Important Information</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Revoking a credential removes access for verifiers who have already received it</li>
                <li>• This action is permanent and cannot be undone</li>
                <li>• The credential will remain in your wallet but marked as revoked</li>
                <li>• Future verification requests will show this credential as inactive</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="flex">
        <UserSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <main className="flex-1 ml-64">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'credentials' && renderCredentials()}
          {activeSection === 'notifications' && renderNotifications()}
          {activeSection === 'revoke-credentials' && renderRevokeCredentials()}
          {activeSection === 'verification-requests' && renderVerificationRequests()}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
