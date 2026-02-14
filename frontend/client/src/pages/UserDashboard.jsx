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
import blockchainNotificationService from '@/utils/blockchainNotifications.js';
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
  Search,
  Loader2,
  Share2,
  Zap,
  Star,
  Globe,
  Layers,
  Calendar,
  AlertCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const UserDashboard = () => {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Web3 and User Registration state - independent from AuthContext
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userDID, setUserDID] = useState('');
  const [userId, setUserId] = useState(null);
  const [isEligibleUser, setIsEligibleUser] = useState(false);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVerificationRequest, setSelectedVerificationRequest] = useState(null);
  const dropdownRef = useRef(null);

  // Share Credential state
  const [selectedCredentialId, setSelectedCredentialId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [verifierDid, setVerifierDid] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Blockchain notification state
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  // Backend notifications query
  const { data: backendNotifications = [], isLoading: isLoadingBackendNotifications } = useQuery({
    queryKey: [`/api/notifications/user/${userId}`],
    queryFn: async () => {
      if (!userId) {
        console.log('🔍 No userId available for notification fetch');
        return [];
      }
      console.log('🔍 Fetching notifications for userId:', userId);
      console.log('🔍 Current walletAddress:', walletAddress);
      console.log('🔍 Is registered user:', isRegisteredUser);
      
      const response = await fetch(`/api/notifications/user/${userId}`);
      if (!response.ok) {
        console.error('🔍 Notification fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch notifications');
      }
      const notifications = await response.json();
      console.log('🔍 Fetched backend notifications count:', notifications.length);
      console.log('🔍 Notification details:', notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        read: n.read,
        createdAt: n.createdAt
      })));
      return notifications;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Handle new notification from blockchain events
  const handleNewNotification = (notification) => {
    console.log('🔔 New blockchain notification received:', notification);
    
    // Update local notifications state
    setNotifications(prev => [notification, ...prev]);
    
    // Invalidate backend notifications query to refetch
    if (userId) {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${userId}`] });
    }
    
    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000
    });
  };
  
  // Refresh notifications from blockchain service
  const refreshNotifications = () => {
    if (walletAddress) {
      const userNotifications = blockchainNotificationService.getNotifications(walletAddress);
      setNotifications(userNotifications);
    }
  };

  // Force refresh backend notifications
  const refreshBackendNotifications = () => {
    if (userId) {
      console.log('🔄 Force refreshing backend notifications for userId:', userId);
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/credentials/wallet/${walletAddress}`] });
    }
  };




  // Fetch and create notifications from past blockchain events
  const fetchPastEventsAndCreateNotifications = async (userAddress) => {
    try {
      console.log(` Fetching past credential events for ${userAddress}`);
      
      // Get past events from blockchain
      const pastEvents = await web3Service.getPastCredentialEvents(userAddress);
      console.log(` Found ${pastEvents.length} past credential events`);
      
      if (pastEvents.length === 0) {
        console.log(' No past events found');
        return 0;
      }
      
      let createdCount = 0;
      
      // Create notifications for each past event
      for (const eventData of pastEvents) {
        const success = await createNotificationFromEvent(eventData, userAddress, true);
        if (success) {
          createdCount++;
        }
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(` Created ${createdCount} notifications from past events`);
      return createdCount;
    } catch (error) {
      console.error(' Error fetching past events:', error);
      return 0;
    }
  };

  // Real-time credential event listener
  const startCredentialEventListener = async (userAddress) => {
    try {
      console.log(` Setting up real-time credential event listener for ${userAddress}`);
      
      // Event handler for when credentials are issued to this user
      const handleCredentialIssued = async (eventData) => {
        console.log(' Real-time credential event received:', eventData);
        
        const success = await createNotificationFromEvent(eventData, userAddress, false);
        
        if (success) {
          // Refresh notifications and credentials
          queryClient.invalidateQueries({ queryKey: ['notifications', 'user', userAddress] });
          queryClient.invalidateQueries({ queryKey: ['credentials', 'user', userAddress] });
          queryClient.invalidateQueries({ queryKey: ['blockchain-credentials', userAddress] });
          
          // Show toast notification
          toast({
            title: "New Credential Received! ",
            description: `${eventData.credentialType} credential from ${eventData.issuerDID.slice(0, 20)}...`,
          });
        }
      };
      
      // Start listening for events
      const success = await web3Service.startListeningForCredentialEvents(userAddress, handleCredentialIssued);
      
      if (success) {
        console.log(' Real-time credential event listener started successfully');
        return true;
      } else {
        console.log(' Failed to start real-time credential event listener');
        return false;
      }
    } catch (error) {
      console.error(' Error setting up credential event listener:', error);
      return false;
    }
  };

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

  // Setup blockchain notifications when user registers or wallet connects
  useEffect(() => {
    const setupBlockchainNotifications = async () => {
      if (isRegisteredUser && walletAddress && walletConnected) {
        console.log(' Setting up blockchain notifications for', walletAddress);
        
        setIsLoadingNotifications(true);
        
        try {
          // Setup complete notification system (past events + real-time)
          const result = await blockchainNotificationService.setupNotifications(
            walletAddress, 
            handleNewNotification
          );
          
          if (result.success) {
            console.log(` Blockchain notifications setup complete:`, result);
            
            // Refresh notifications from service
            refreshNotifications();
            
            if (result.pastEventsCount > 0) {
              toast({
                title: "Historical Credentials Found! ",
                description: `Found ${result.pastEventsCount} historical credentials. Check your notifications!`,
                duration: 5000
              });
            }
          } else {
            console.error(' Failed to setup blockchain notifications:', result.error);
          }
        } catch (error) {
          console.error(' Error setting up blockchain notifications:', error);
        } finally {
          setIsLoadingNotifications(false);
        }
      }
    };
    
    setupBlockchainNotifications();
    
    // Cleanup on unmount or wallet change
    return () => {
      if (walletAddress) {
        console.log(' Cleaning up blockchain notifications for', walletAddress);
        blockchainNotificationService.cleanup(walletAddress);
      }
    };
  }, [isRegisteredUser, walletAddress, walletConnected]);

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
        
        // Stop event listeners for previous account
        if (previousAccount && previousAccount !== newAccount) {
          console.log(` Stopping event listeners for previous account: ${previousAccount}`);
          web3Service.stopListeningForCredentialEvents(previousAccount);
        }
        
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

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkUserStatus = async (address) => {
    try {
      // Use the correct method name from web3Service
      const isEligible = await web3Service.validateUserRegistration(address);
      setIsEligibleUser(isEligible);
      
      if (isEligible) {
        const isRegistered = await web3Service.userRegistry.isRegisteredUser(address);
        setIsRegisteredUser(isRegistered);
        
        if (isRegistered) {
          setUserDID(`did:ethr:${address}`);
          
          // If user is already registered, get their backend userId
          try {
            const response = await fetch(`/api/users/wallet/${address}`);
            if (response.ok) {
              const userData = await response.json();
              console.log('🔍 Found existing user data:', userData);
              setUserId(userData.id);
              console.log('🔍 Set userId for existing user:', userData.id);
            } else {
              console.log('🔍 No backend user found for registered blockchain user');
            }
          } catch (error) {
            console.error('Error fetching backend user data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
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

      // Generate a default name if userName is empty
      const defaultName = userName || `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      console.log('🔍 Registering user with name:', defaultName);

      // First register on blockchain and fetch existing credentials
      let blockchainResult;
      try {
        blockchainResult = await web3Service.registerUserOnBlockchain(defaultName, '');
      } catch (blockchainError) {
        console.error('Blockchain registration failed:', blockchainError);
        // Try alternative registration method
        blockchainResult = await web3Service.registerUser(defaultName, '');
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
            name: defaultName,
            email: '',
            transactionHash: blockchainResult.transactionHash
          })
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('🔍 User registration response:', userData);
          setIsRegisteredUser(true);
          setUserDID(`did:ethr:${blockchainResult.address}`);
          setUserId(userData.user.id); // Store user ID for backend notifications
          setUserName(defaultName); // Update the userName state for UI display
          console.log('🔍 Set userId to:', userData.user.id);
          console.log('🔍 User registration complete - userData:', userData);
          console.log('🔍 User address stored in backend:', userData.user.address);
          console.log('🔍 Current wallet address:', walletAddress);
          
          // Immediately invalidate and refetch notifications for the new user
          queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${userData.user.id}`] });
          
          // Force immediate refresh of backend notifications
          setTimeout(() => {
            refreshBackendNotifications();
          }, 1000);
          
          // Setup blockchain notifications for existing credentials
          if (blockchainResult.credentials && blockchainResult.credentials.length > 0) {
            console.log(` Found ${blockchainResult.credentials.length} existing blockchain credentials, setting up notifications...`);
            
            toast({
              title: "Existing Credentials Found! ",
              description: `Found ${blockchainResult.credentials.length} existing credentials. Setting up notifications...`,
            });
          }
          
          // Force immediate refresh of credentials for current account
          queryClient.removeQueries({ queryKey: [`/api/credentials/wallet/${walletAddress}`] });
          queryClient.removeQueries({ queryKey: ['blockchain-credentials', walletAddress] });
          
          // Refetch credentials immediately
          queryClient.refetchQueries({ queryKey: [`/api/credentials/wallet/${walletAddress}`] });
          queryClient.refetchQueries({ queryKey: ['blockchain-credentials', walletAddress] });
          
          // Setup blockchain notifications after registration
          if (walletAddress) {
            console.log(' Setting up blockchain notifications after registration...');
            
            // This will be handled by the useEffect hook that monitors registration status
            // No need to duplicate the setup here
          }
          
          toast({
            title: "Registration Successful! ",
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
  const { data: backendCredentials = [], isLoading: isLoadingBackend } = useQuery({
    queryKey: ['credentials', 'user', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const response = await fetch(`/api/credentials/wallet/${walletAddress}`);
      if (!response.ok) throw new Error('Failed to fetch credentials');
      return response.json();
    },
    enabled: walletConnected && !!walletAddress
  });

  // Refresh notifications periodically from blockchain service and backend
  useEffect(() => {
    if (walletAddress && isRegisteredUser && userId) {
      const interval = setInterval(() => {
        refreshNotifications();
        refreshBackendNotifications();
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [walletAddress, isRegisteredUser, userId]);

  // Force refresh notifications when userId becomes available
  useEffect(() => {
    if (userId) {
      console.log('🔄 UserId available, refreshing backend notifications:', userId);
      refreshBackendNotifications();
    }
  }, [userId]);

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

  const credentialsLoading = isLoadingBackend || blockchainLoading;

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
    const didToCopy = isEligibleUser ? (userDID || `did:ethr:${walletAddress || '0x...'}`) : 'did:ethr:0x000';
    navigator.clipboard.writeText(didToCopy);
    toast({
      title: "DID Copied",
      description: isEligibleUser ? "Your DID has been copied to clipboard!" : "Placeholder DID copied. Connect with accounts 2-7 for actual DID.",
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
                Welcome back, {userName || `User ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` || 'User'}!
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
                <p className="text-sm text-gray-400">Digital Identity</p>
                <p className="text-lg font-semibold text-white">Verified User</p>
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
                    {isEligibleUser ? (userDID || `did:ethr:${walletAddress || '0x...'}`) : 'did:ethr:0x000'}
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

  // Generate credential ID consistently
  const generateCredentialId = (credential) => {
    if (credential.uniqueId) return credential.uniqueId;
    
    const type = credential.credentialType || credential.type || 'CRED';
    let prefix = 'CRD';
    
    switch (type.toLowerCase()) {
      case 'degree':
      case 'university degree':
        prefix = 'DEG';
        break;
      case 'certificate':
      case 'professional certificate':
      case 'training certificate':
        prefix = 'CERT';
        break;
      case 'license':
      case 'driving license':
        prefix = 'LIC';
        break;
      case 'pan':
      case 'pan card':
        prefix = 'PAN';
        break;
      default:
        prefix = 'CRD';
    }
    
    // Use a deterministic ID based on credential data
    const hash = Math.abs(JSON.stringify(credential).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    let tempHash = hash;
    for (let i = 0; i < 5; i++) {
      randomStr += chars.charAt(tempHash % chars.length);
      tempHash = Math.floor(tempHash / chars.length);
    }
    
    return `${prefix}-${randomStr}`;
  };

  // Handle credential search
  const handleCredentialSearch = () => {
    if (!selectedCredentialId || selectedCredentialId.trim() === '') return;
    
    const credential = myCredentials.find(cred => generateCredentialId(cred) === selectedCredentialId);
    setSelectedCredential(credential || null);
    setShowDropdown(false);
  };

  const handleCredentialSelect = (credentialId) => {
    setSelectedCredentialId(credentialId);
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const renderShareCredential = () => {

    const handleShare = async (credential) => {
      if (!verifierDid || verifierDid.trim() === '') {
        toast({
          title: "Verifier DID Required",
          description: "Please enter the Verifier DID before sharing the credential.",
          variant: "destructive"
        });
        return;
      }

      // Check if credential is revoked
      if (credential.status === 'revoked' || credential.isRevoked) {
        toast({
          title: "Cannot Share Revoked Certificate",
          description: "You Can not share Revoked Certificate",
          variant: "destructive"
        });
        return;
      }

      setIsSharing(true);
      try {
        // Validate verifier DID format first
        const validation = await web3Service.validateVerifierDID(verifierDid);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Initialize Web3Service and connect wallet
        await web3Service.init();
        await web3Service.connectWallet();

        // Show MetaMask transaction notice
        toast({
          title: "MetaMask Transaction Required",
          description: "Please sign the transaction in MetaMask to share your credential on-chain.",
          duration: 3000
        });

        // Share credential on blockchain with MetaMask signing
        const result = await web3Service.shareCredential(credential, verifierDid, 'Credential shared via Credence platform');
        
        if (result.success) {
          // Store the shared credential data in backend for verifier access
          try {
            const sharePayload = {
              holderAddress: walletAddress.toLowerCase(), // Normalize to lowercase
              verifierAddress: verifierDid.replace('did:ethr:', '').toLowerCase(), // Normalize to lowercase
              credentialId: credential.id || credential.uniqueId,
              credentialType: credential.credentialType || credential.type,
              credentialTitle: credential.title || credential.data?.title || 'Untitled Credential',
              message: 'Credential shared via Credence platform',
              signature: result.signature,
              holderDID: `did:ethr:${walletAddress}`,
              verifierDID: verifierDid,
              credentialData: credential
            };
            
            console.log('📤 Sending credential share payload to backend:', sharePayload);
            console.log('📤 Holder address (user):', sharePayload.holderAddress);
            console.log('📤 Verifier address (extracted from DID):', sharePayload.verifierAddress);
            console.log('📤 Verifier DID (original):', sharePayload.verifierDID);
            
            const backendResponse = await fetch('/api/credentials/share', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sharePayload)
            });
            
            console.log('📡 Backend response status:', backendResponse.status);

            if (!backendResponse.ok) {
              throw new Error('Failed to store shared credential data');
            }

            const backendResult = await backendResponse.json();
            console.log('✅ Shared credential stored in backend:', backendResult);

            toast({
              title: "Credential Shared with the Verifier",
              description: `${result.message}. The verifier can now review your credential.`,
              duration: 5000
            });
          } catch (backendError) {
            console.error('Backend storage failed:', backendError);
            // Show error and don't proceed since backend storage is required
            throw new Error('Failed to store credential sharing data. Please try again.');
          }
          
          // Reset form
          setSelectedCredential(null);
          setVerifierDid('');
          setSelectedCredentialId('');
        } else {
          throw new Error('Credential sharing failed');
        }
      } catch (error) {
        console.error('Credential sharing error:', error);
        toast({
          title: "Sharing Failed",
          description: error.message || "Failed to share credential. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSharing(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/5 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                Share Credentials
              </h1>
            </div>
            <p className="text-gray-400 max-w-xl mx-auto">
              Search for your credentials by ID and share them securely
            </p>
          </div>

          {/* Compact Search Section */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-br from-gray-800/70 via-gray-800/50 to-gray-900/70 backdrop-blur-lg border border-purple-500/30 shadow-xl rounded-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Search className="h-4 w-4 text-purple-400" />
                    <label className="text-base font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      Search by Credential ID
                    </label>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="relative dropdown-container flex-1" ref={dropdownRef}>
                      <div className="relative">
                        <input
                          type="text"
                          value={selectedCredentialId}
                          onChange={(e) => setSelectedCredentialId(e.target.value)}
                          onFocus={() => setShowDropdown(true)}
                          onClick={() => setShowDropdown(true)}
                          placeholder="Enter or select credential ID..."
                          className="w-full px-4 py-3 bg-gradient-to-r from-gray-700/60 to-gray-800/60 border border-gray-600/40 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/25 transition-all duration-200 text-sm font-medium backdrop-blur-sm hover:border-purple-500/50"
                        />
                      </div>
                      
                      {/* Enhanced Dropdown with Maximum Visibility */}
                      {showDropdown && myCredentials.length > 0 && (
                        <div 
                          className="fixed left-0 right-0 mx-auto max-w-2xl bg-gray-800/98 backdrop-blur-xl border-2 border-purple-500/50 rounded-xl shadow-2xl shadow-black/80 z-[99999] max-h-80 overflow-hidden"
                          style={{
                            top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + window.scrollY + 8 : 'auto',
                            left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left + window.scrollX : 'auto',
                            width: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().width : 'auto'
                          }}
                        >
                          <div className="p-2">
                            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/70 scrollbar-track-gray-700/40 scrollbar-thumb-rounded-full">
                              {myCredentials.map((credential, index) => {
                                const credentialId = generateCredentialId(credential);
                                
                                return (
                                  <button
                                    key={credentialId}
                                    onClick={() => handleCredentialSelect(credentialId)}
                                    className="w-full p-3 text-left hover:bg-gradient-to-r hover:from-purple-600/25 hover:to-blue-600/25 transition-all duration-200 rounded-lg group focus:outline-none focus:bg-gradient-to-r focus:from-purple-600/25 focus:to-blue-600/25 border border-transparent hover:border-purple-500/40 focus:border-purple-400/50 mb-1 last:mb-0"
                                  >
                                    <div className="flex flex-col space-y-1">
                                      <div className="text-white font-mono text-sm font-semibold group-hover:text-purple-300 transition-colors">
                                        {credentialId}
                                      </div>
                                      <div className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors">
                                        {credential.title || 'No title available'}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {/* Visual separator at bottom */}
                          <div className="h-0.5 bg-gradient-to-r from-purple-600/40 via-blue-600/40 to-purple-600/40"></div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={handleCredentialSearch}
                      disabled={!selectedCredentialId || selectedCredentialId.trim() === ''}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed font-medium text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Search className="h-4 w-4 mr-1.5" />
                      Search
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Credential Display */}
          {selectedCredential && (
            <div className="space-y-6 mt-12">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl backdrop-blur-sm ${
                  selectedCredential.status === 'revoked' || selectedCredential.isRevoked
                    ? 'bg-gradient-to-br from-red-600/20 to-orange-600/20'
                    : 'bg-gradient-to-br from-green-600/20 to-emerald-600/20'
                }`}>
                  {selectedCredential.status === 'revoked' || selectedCredential.isRevoked ? (
                    <XCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                </div>
                <h2 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                  selectedCredential.status === 'revoked' || selectedCredential.isRevoked
                    ? 'from-red-400 to-orange-400'
                    : 'from-green-400 to-emerald-400'
                }`}>
                  {selectedCredential.status === 'revoked' || selectedCredential.isRevoked
                    ? '⚠️ Revoked Credential'
                    : '✅ Selected Credential'
                  }
                </h2>
              </div>
              
              {/* Warning message for revoked credentials */}
              {(selectedCredential.status === 'revoked' || selectedCredential.isRevoked) && (
                <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <p className="text-red-400 font-medium">
                      This certificate has been revoked and cannot be shared with verifiers.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Use the same CredentialCard component from My Credentials */}
              <CredentialCard 
                credential={selectedCredential}
                onRevoke={() => {}}
                showActions={false}
              />
              
              {/* Verifier DID and Share Section */}
              <Card className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 shadow-lg">
                <CardContent className="p-6">
                    <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-300">
                        Verifier DID (Required for On-Chain Sharing)
                      </label>
                      <div className="flex items-center space-x-2 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                        <Wallet className="h-3 w-3" />
                        <span>MetaMask Required</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={verifierDid}
                        onChange={(e) => setVerifierDid(e.target.value)}
                        placeholder="did:ethr:0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"
                        className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-200 font-mono text-sm"
                      />
                      
                      <Button
                        onClick={() => handleShare(selectedCredential)}
                        disabled={isSharing || !verifierDid || verifierDid.trim() === '' || selectedCredential?.status === 'revoked' || selectedCredential?.isRevoked}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
                      >
                        {isSharing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Signing Transaction...
                          </>
                        ) : (
                          <>
                            <Share2 className="h-4 w-4 mr-2" />
                            {selectedCredential?.status === 'revoked' || selectedCredential?.isRevoked ? 'Cannot Share' : 'Share'}
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* DID Format Help */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Activity className="h-4 w-4 text-blue-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-blue-400 font-medium mb-1">Verifier DID Format</p>
                          <p className="text-gray-300 text-xs mb-2">
                            Enter the verifier's DID in the format: <code className="bg-gray-800/60 px-1 rounded">did:ethr:0x...</code>
                          </p>
                          <div className="space-y-1 text-xs text-gray-400">
                            <p>• Account 8: <code className="bg-gray-800/60 px-1 rounded text-blue-300">did:ethr:0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f</code></p>
                            <p>• Account 9: <code className="bg-gray-800/60 px-1 rounded text-blue-300">did:ethr:0xa0Ee7A142d267C1f36714E4a8F75612F20a79720</code></p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(!verifierDid || verifierDid.trim() === '') && (
                      <p className="text-amber-400 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Please enter a Verifier DID to enable on-chain credential sharing
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* No credential selected state */}
          {!selectedCredential && selectedCredentialId && (
            <Card className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Credential Not Found</h3>
                <p className="text-gray-400">
                  No credential found with ID: <span className="font-mono">{selectedCredentialId}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  // Mark notification as read using blockchain service and backend
  const markNotificationAsRead = async (notificationId) => {
    if (walletAddress) {
      blockchainNotificationService.markAsRead(walletAddress, notificationId);
      refreshNotifications(); // Refresh to update UI
    }
    
    // Also mark as read in backend if it's a backend notification
    if (userId) {
      try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          // Invalidate backend notifications query to refetch updated data
          queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${userId}`] });
        }
      } catch (error) {
        console.error('Error marking backend notification as read:', error);
      }
    }
  };

  // Mark all notifications as read using blockchain service and backend
  const markAllNotificationsAsRead = async () => {
    if (walletAddress) {
      const markedCount = blockchainNotificationService.markAllAsRead(walletAddress);
      refreshNotifications(); // Refresh to update UI
      
      if (markedCount > 0) {
        toast({
          title: "All Notifications Marked as Read",
          description: `Marked ${markedCount} notifications as read`,
        });
      }
    }
    
    // Also mark all backend notifications as read
    if (userId) {
      try {
        const response = await fetch(`/api/notifications/user/${userId}/read-all`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          // Invalidate backend notifications query to refetch updated data
          queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${userId}`] });
        }
      } catch (error) {
        console.error('Error marking all backend notifications as read:', error);
      }
    }
  };

  const renderNotifications = () => {
    // Combine blockchain and backend notifications
    const allNotifications = [
      ...backendNotifications.map(n => ({ ...n, source: 'backend' })),
      ...notifications.map(n => ({ ...n, source: 'blockchain' }))
    ].sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
    
    console.log('🔍 Rendering notifications:', {
      userId,
      backendCount: backendNotifications.length,
      blockchainCount: notifications.length,
      totalCount: allNotifications.length,
      backendNotifications,
      allNotifications
    });
    
    const unreadCount = allNotifications.filter(n => !n.read).length;

    const getNotificationIcon = (type) => {
      switch (type) {
        case 'credential_issued':
          return Award;
        case 'verification_request':
          return Shield;
        case 'credential_verification':
          return CheckCircle;
        case 'credential_shared':
          return Share2;
        case 'system':
          return Activity;
        default:
          return Bell;
      }
    };

    const getNotificationColor = (priority) => {
      switch (priority) {
        case 'high':
          return 'from-red-500/20 to-orange-500/20 border-red-500/30';
        case 'medium':
          return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
        case 'low':
          return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
        default:
          return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
      }
    };

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              🔔 Notifications
            </h2>
            <p className="text-gray-400">Stay updated with your credential activities</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-blue-400 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
              <Bell className="h-4 w-4" />
              <span>Total: {allNotifications.length}</span>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center space-x-2 text-sm text-orange-400 bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
                <Activity className="h-4 w-4" />
                <span>Unread: {unreadCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notification Filters */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Button
                size="sm"
                className="bg-purple-600/20 border-purple-500/30 text-purple-400 hover:bg-purple-600/30"
              >
                All Notifications
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Unread Only
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
                onClick={() => markAllNotificationsAsRead()}
                disabled={unreadCount === 0}
              >
                Mark All Read
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {isLoadingNotifications ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : allNotifications.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Notifications Yet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                You'll receive notifications here when there are updates about your credentials, verification requests, or system activities.
              </p>
              <div className="space-y-3 max-w-sm mx-auto">
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center mr-3">
                    <Award className="h-3 w-3 text-purple-400" />
                  </div>
                  Credential issuance notifications
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center mr-3">
                    <Shield className="h-3 w-3 text-blue-400" />
                  </div>
                  Verification request alerts
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center mr-3">
                    <Share2 className="h-3 w-3 text-green-400" />
                  </div>
                  Credential sharing confirmations
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <div className="w-6 h-6 bg-cyan-600/20 rounded-full flex items-center justify-center mr-3">
                    <Activity className="h-3 w-3 text-cyan-400" />
                  </div>
                  System and security updates
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.priority);
              
              // Simple notification card for credential_issued notifications
              if (notification.type === 'credential_issued') {
                return (
                  <Card 
                    key={notification.id} 
                    className={`bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600/50 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-0.5 ${!notification.read ? 'ring-2 ring-blue-400/30 shadow-lg shadow-blue-500/20' : 'hover:border-slate-500/70'}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-400/30">
                            <Award className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm leading-tight">{notification.title}</p>
                            <p className="text-sm text-slate-300 mt-0.5">{notification.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors duration-200"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              // Verification request notification with consistent styling
              if (notification.type === 'verification_request') {
                return (
                  <Card 
                    key={notification.id} 
                    className={`bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600/50 backdrop-blur-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-0.5 ${!notification.read ? 'ring-2 ring-orange-400/30 shadow-lg shadow-orange-500/20' : 'hover:border-slate-500/70'}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2.5 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-400/30">
                            <Shield className="h-5 w-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm leading-tight">{notification.title}</p>
                            <p className="text-sm text-slate-300 mt-0.5">
                              {notification.data?.credentialType && `Request for ${notification.data.credentialType} credential`}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Issued on {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 px-3 py-1.5 rounded-lg transition-colors duration-200"
                            onClick={() => setSelectedVerificationRequest(notification)}
                          >
                            View Details
                          </Button>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors duration-200"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              // Credential verification notification with consistent styling
              if (notification.type === 'credential_verification') {
                return (
                  <Card 
                    key={notification.id} 
                    className={`bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600/50 backdrop-blur-sm hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 transform hover:-translate-y-0.5 ${!notification.read ? 'ring-2 ring-green-400/30 shadow-lg shadow-green-500/20' : 'hover:border-slate-500/70'}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2.5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-400/30">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm leading-tight">{notification.title}</p>
                            <p className="text-sm text-slate-300 mt-0.5">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors duration-200"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              // Regular notification display for other notification types
              return (
                <Card 
                  key={notification.id} 
                  className={`bg-gradient-to-r ${colorClass} backdrop-blur-sm hover:shadow-lg transition-all duration-200 ${!notification.read ? 'ring-2 ring-purple-500/30' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${notification.priority === 'high' ? 'from-red-600/30 to-orange-600/30' : notification.priority === 'medium' ? 'from-yellow-600/30 to-amber-600/30' : 'from-blue-600/30 to-cyan-600/30'} flex-shrink-0`}>
                        <IconComponent className={`h-6 w-6 ${notification.priority === 'high' ? 'text-red-400' : notification.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-purple-400 hover:text-purple-300"
                                onClick={() => markNotificationAsRead(notification.id)}
                              >
                                Mark Read
                              </Button>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-300 mb-3">
                          {notification.message}
                        </p>
                      </div>
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

  // Verification Request Details Modal
  const renderVerificationRequestModal = () => {
    if (!selectedVerificationRequest) return null;

    const request = selectedVerificationRequest;
    const requestData = request.data || {};

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-400/30">
                  <Shield className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Verification Request Details</h2>
                  <p className="text-gray-400">Review the verification request information</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVerificationRequest(null)}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Request Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    <span>Request Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Request Type</Label>
                      <p className="text-white font-medium">{request.title}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Status</Label>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${request.read ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                        <span className="text-white">{request.read ? 'Read' : 'Unread'}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-400">Request Date</Label>
                      <p className="text-white">{new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Priority</Label>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        request.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {request.priority?.toUpperCase() || 'NORMAL'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verifier Information */}
              {requestData.verifierDID && (
                <Card className="bg-gray-800/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center space-x-2">
                      <User className="h-5 w-5 text-purple-400" />
                      <span>Verifier Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-400">Verifier DID</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-purple-300 font-mono text-sm bg-gray-900/50 px-3 py-2 rounded border border-gray-700 flex-1 break-all">
                          {requestData.verifierDID}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(requestData.verifierDID);
                            toast({ title: "Copied to clipboard", description: "Verifier DID copied" });
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {requestData.verifierName && (
                      <div>
                        <Label className="text-gray-400">Verifier Name</Label>
                        <p className="text-white">{requestData.verifierName}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Credential Request Details */}
              {requestData.credentialType && (
                <Card className="bg-gray-800/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center space-x-2">
                      <Award className="h-5 w-5 text-green-400" />
                      <span>Credential Request</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400">Credential Type</Label>
                        <p className="text-green-300 font-medium">{requestData.credentialType}</p>
                      </div>
                      {requestData.timestamp && (
                        <div>
                          <Label className="text-gray-400">Request Timestamp</Label>
                          <p className="text-white">{new Date(requestData.timestamp).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    {requestData.message && (
                      <div>
                        <Label className="text-gray-400">Message</Label>
                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mt-2">
                          <p className="text-gray-300">{requestData.message}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}


              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                {!request.read && (
                  <Button
                    onClick={() => {
                      markNotificationAsRead(request.id);
                      setSelectedVerificationRequest(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark as Read
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedVerificationRequest(null)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="flex">
        <UserSidebar activeSection={activeSection} onSectionChange={setActiveSection} userDID={userDID} />
        
        <main className="flex-1 ml-64">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'credentials' && renderCredentials()}
          {activeSection === 'share-credential' && renderShareCredential()}
          {activeSection === 'notifications' && renderNotifications()}
          {activeSection === 'verification-requests' && renderVerificationRequests()}
        </main>
      </div>
      
      {/* Verification Request Details Modal */}
      {renderVerificationRequestModal()}
    </div>
  );
};

export default UserDashboard;
