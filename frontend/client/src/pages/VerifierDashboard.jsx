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
import { Web3Service } from '@/utils/web3.js';
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
  
  // Verifier registration states
  const [web3Service] = useState(() => new Web3Service());
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isEligibleVerifier, setIsEligibleVerifier] = useState(false);
  const [isRegisteredVerifier, setIsRegisteredVerifier] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  
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

  // Initialize Web3 and check wallet connection on component mount
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        await web3Service.init();
        const currentAccount = await web3Service.getCurrentAccount();
        if (currentAccount) {
          setWalletAddress(currentAccount);
          setWalletConnected(true);
          await checkVerifierStatus(currentAccount);
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };

    // Listen for account changes in MetaMask - re-run step 1 each time
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const newAddress = accounts[0].toLowerCase();
        console.log('ACCOUNT_CHANGED:', newAddress);
        setWalletAddress(newAddress);
        
        // Update Web3Service with new account
        try {
          const connection = await web3Service.connectWallet();
          setWalletAddress(connection.account);
          
          // Check eligibility with new account - update UI immediately
          const eligibility = await web3Service.checkVerifierEligibility(connection.account);
          setIsRegisteredVerifier(eligibility.isRegistered);
          setIsEligibleVerifier(eligibility.isAllowed);
        } catch (error) {
          console.error('Failed to update account:', error);
        }
      } else {
        console.log('ACCOUNT_CHANGED: disconnected');
        // No accounts connected
        setWalletConnected(false);
        setWalletAddress('');
        setIsRegisteredVerifier(false);
        setIsEligibleVerifier(false);
      }
    };

    initializeWallet();

    // Add MetaMask account change listener
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    // Cleanup listener on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Check verifier eligibility and registration status
  const checkVerifierStatus = async (address = null) => {
    try {
      const targetAddress = address || walletAddress;
      if (!targetAddress) return;

      setIsCheckingRegistration(true);
      
      // Always check on-chain registration status - no hardcoded assumptions
      const eligibility = await web3Service.checkVerifierEligibility(targetAddress);
      setIsEligibleVerifier(eligibility.isAllowed);
      setIsRegisteredVerifier(eligibility.isRegistered);
      
      console.log('Verifier eligibility check:', {
        address: targetAddress,
        isAllowed: eligibility.isAllowed,
        isRegistered: eligibility.isRegistered,
        canRegister: eligibility.canRegister
      });
    } catch (error) {
      console.error('Failed to check verifier status:', error);
      // On error, reset to safe defaults
      setIsEligibleVerifier(false);
      setIsRegisteredVerifier(false);
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    try {
      const connection = await web3Service.connectWallet();
      setWalletAddress(connection.account);
      setWalletConnected(true);
      await checkVerifierStatus(connection.account);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${connection.account.slice(0, 6)}...${connection.account.slice(-4)}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message,
      });
    }
  };

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

  // Mock credentials submitted by users for verification
  const mockCredentials = [
    {
      id: 'DEG-19160',
      credentialType: 'University Degree',
      title: 'CSE',
      subtitle: 'University Degree',
      issuerDID: 'did:ethr:0x7099970c51812dc3A010C7d01b50e0d17dc7...',
      recipientName: 'Junaid Mollah',
      recipientDID: 'did:ethr:0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      issueDate: '2025-09-09',
      status: 'pending',
      submittedAt: new Date('2024-01-15'),
      icon: '🎓',
      details: {
        institution: 'MIT University',
        degree: 'Bachelor of Computer Science Engineering',
        gpa: '3.8/4.0',
        graduationYear: '2024'
      }
    },
    {
      id: 'CERT-28471',
      credentialType: 'Professional Certificate',
      title: 'AWS Solutions Architect',
      subtitle: 'Professional Certificate',
      issuerDID: 'did:ethr:0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      recipientName: 'Sarah Johnson',
      recipientDID: 'did:ethr:0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      issueDate: '2024-12-15',
      status: 'approved',
      submittedAt: new Date('2024-01-14'),
      approvedAt: new Date('2024-01-15'),
      icon: '📜',
      details: {
        provider: 'Amazon Web Services',
        validUntil: '2027-12-15',
        certificationLevel: 'Professional',
        score: '850/1000'
      }
    },
    {
      id: 'AWARD-51704',
      credentialType: 'Achievement Award',
      title: 'Innovation Excellence',
      subtitle: 'Achievement Award',
      issuerDID: 'did:ethr:0x976EA74026E726554dB657fA54763abd0C3a0aa9',
      recipientName: 'Alex Rodriguez',
      recipientDID: 'did:ethr:0x976EA74026E726554dB657fA54763abd0C3a0aa9',
      issueDate: '2024-01-05',
      status: 'rejected',
      submittedAt: new Date('2024-01-11'),
      rejectedAt: new Date('2024-01-12'),
      icon: '🥇',
      details: {
        awardingBody: 'Tech Innovation Council',
        category: 'Best Mobile App',
        year: '2024',
        reason: 'Outstanding contribution to healthcare technology'
      }
    }
  ];

  // Queries - Fetch submitted credentials for verification
  const { data: credentials = mockCredentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ['/api/credentials/submitted', user?.id],
    enabled: !!user?.id,
    initialData: mockCredentials,
  });

  // Search and filter state
  const [searchDID, setSearchDID] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter credentials based on search DID and status
  const filteredCredentials = credentials.filter(credential => {
    const matchesDID = !searchDID || credential.recipientDID?.toLowerCase().includes(searchDID.toLowerCase()) || credential.recipientName?.toLowerCase().includes(searchDID.toLowerCase());
    const matchesStatus = statusFilter === 'all' || credential.status === statusFilter;
    return matchesDID && matchesStatus;
  });

  // Approve/Reject credential mutations
  const approveCredentialMutation = useMutation({
    mutationFn: async (credentialId) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Credential Approved",
        description: "The credential has been successfully approved.",
        variant: "success",
      });
      queryClient.invalidateQueries(['/api/credentials/submitted']);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve credential. Please try again.",
        variant: "destructive",
      });
    }
  });

  const rejectCredentialMutation = useMutation({
    mutationFn: async (credentialId) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Credential Rejected",
        description: "The credential has been rejected.",
        variant: "success",
      });
      queryClient.invalidateQueries(['/api/credentials/submitted']);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject credential. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Register as verifier function with proper validation and logging
  const registerAsVerifier = async () => {
    setIsRegistering(true);
    try {
      // First ensure wallet is connected
      if (!walletConnected) {
        console.log('Connecting wallet for registration...');
        const connection = await web3Service.connectWallet();
        setWalletConnected(true);
        setWalletAddress(connection.account);
      }

      // Check eligibility before registration
      const currentAccount = web3Service.account || walletAddress;
      const eligibility = await web3Service.checkVerifierEligibility(currentAccount);
      
      if (!eligibility.isAllowed) {
        throw new Error(`Account ${currentAccount} is not allowed. Only Hardhat accounts 8 (0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f) or 9 (0xa0Ee7A142d267C1f36714E4a8F75612F20a79720) can register as verifiers.`);
      }

      if (eligibility.isRegistered) {
        setIsRegisteredVerifier(true);
        throw new Error('This account is already registered as a verifier');
      }

      console.log('Account is eligible, proceeding with blockchain registration...');

      // Register on blockchain - this will open MetaMask, send registerVerifier() transaction
      const defaultName = `Verifier ${walletAddress.slice(0, 6)}`;
      const defaultOrganization = 'Credence Network';
      const defaultEmail = '';
      
      const result = await web3Service.registerVerifierOnChain(
        defaultName,
        defaultOrganization,
        defaultEmail
      );
      
      // Only update status after on-chain transaction confirms
      // Re-check registration status from blockchain to confirm
      await checkVerifierStatus(currentAccount);
      
      toast({
        title: "Registered as verifier — tx confirmed",
        description: `Successfully registered! Transaction: ${result.transactionHash.slice(0, 10)}...`,
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setIsRegistering(false);
    }
  };

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
    total: credentials.length,
    approved: credentials.filter(c => c.status === 'approved').length,
    pending: credentials.filter(c => c.status === 'pending').length,
    rejected: credentials.filter(c => c.status === 'rejected').length,
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
              <div className="flex items-center space-x-2 mt-3">
                <div className="bg-blue-500 bg-opacity-20 px-3 py-1 rounded-full border border-blue-500 border-opacity-30">
                  <span className="text-blue-300 text-sm font-medium">DID:</span>
                  <span className="text-white text-sm font-mono ml-2">
                    {(() => {
                      const isAccount8 = walletAddress?.toLowerCase() === '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
                      const isAccount9 = walletAddress?.toLowerCase() === '0xa0ee7a142d267c1f36714e4a8f75612f20a79720';
                      
                      let displayedDid;
                      if (walletConnected && (isAccount8 || isAccount9)) {
                        displayedDid = `did:ethr:${walletAddress}`;
                      } else {
                        displayedDid = 'did:ethr:0x0000000000000000000000000000000000000000';
                      }
                      
                      console.log('DID_RENDER:', displayedDid);
                      
                      return displayedDid.length > 40 ? `${displayedDid.slice(0, 20)}...${displayedDid.slice(-15)}` : displayedDid;
                    })()}
                  </span>
                </div>
                <button 
                  onClick={async (event) => {
                    try {
                      const isAccount8 = walletAddress?.toLowerCase() === '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
                      const isAccount9 = walletAddress?.toLowerCase() === '0xa0ee7a142d267c1f36714e4a8f75612f20a79720';
                      
                      const didToCopy = (walletConnected && (isAccount8 || isAccount9)) 
                        ? `did:ethr:${walletAddress}`
                        : 'did:ethr:0x0000000000000000000000000000000000000000';
                      
                      await navigator.clipboard.writeText(didToCopy);
                      console.log('DID copied to clipboard:', didToCopy);
                      
                      // Show temporary success feedback
                      const button = event.target.closest('button');
                      const originalTitle = button.title;
                      button.title = 'Copied!';
                      button.style.color = '#10b981';
                      
                      setTimeout(() => {
                        button.title = originalTitle;
                        button.style.color = '';
                      }, 2000);
                      
                    } catch (error) {
                      console.error('Failed to copy DID:', error);
                      alert('Failed to copy DID to clipboard');
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="Copy DID"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
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
              <Clock className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-purple-300 font-medium">Pending Verification</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">0</div>
          </div>
        </div>
      </div>

      {/* Verifier Registration Section */}
      <Card className="glass-effect mb-8">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <Shield className="h-16 w-16 text-blue-400 mx-auto floating-icon" />
            <h3 className="text-2xl font-bold gradient-text mb-2">Verifier Registration</h3>
            {!walletConnected ? (
              <p className="text-gray-300 mb-4">Connect your MetaMask wallet to register as a verifier</p>
            ) : isCheckingRegistration ? (
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                <p className="text-blue-300 mb-2">Checking registration status...</p>
              </div>
            ) : isRegisteredVerifier ? (
              <div>
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-300 mb-2">You are successfully registered as a verifier!</p>
              </div>
            ) : (
              <p className="text-gray-300 mb-4">Register yourself as a verifier on the Credence platform</p>
            )}
          </div>
          
          {!walletConnected ? (
            <div className="text-center">
              <Button
                onClick={connectWallet}
                className="enhanced-button text-white px-8 py-3 rounded-xl font-bold mb-4"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Connect MetaMask</span>
                </div>
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Button
                onClick={registerAsVerifier}
                disabled={!isEligibleVerifier || isRegisteredVerifier || isRegistering || isCheckingRegistration}
                className={`px-8 py-3 rounded-xl font-bold mb-4 transition-all duration-300 ${
                  isEligibleVerifier && !isRegisteredVerifier && !isRegistering && !isCheckingRegistration
                    ? 'enhanced-button text-white hover:scale-105' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isCheckingRegistration ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Checking status...</span>
                    </>
                  ) : isRegistering ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Registering...</span>
                    </>
                  ) : isRegisteredVerifier ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Already registered</span>
                    </>
                  ) : isEligibleVerifier ? (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>Register as Verifier</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>Register as Verifier</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          )}
          
          <div className="text-center mt-4">
            {!walletConnected ? (
              <p className="text-sm text-yellow-300">
                Only hardhat accounts 8–9 can register as a verifier
              </p>
            ) : isEligibleVerifier ? (
              <div>
                <p className="text-xs text-gray-400">
                  Current wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
                {isCheckingRegistration ? (
                  <p className="text-xs text-blue-400 mt-1">
                    ⏳ Checking blockchain status...
                  </p>
                ) : isRegisteredVerifier ? (
                  <p className="text-xs text-green-400 mt-1">
                    ✓ Already registered
                  </p>
                ) : (
                  <p className="text-xs text-blue-400 mt-1">
                    ✓ Eligible for registration
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-yellow-300">
                  Only hardhat accounts 8–9 can register as a verifier
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Current wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
                <p className="text-xs text-red-400 mt-1">
                  Please switch to accounts 8 or 9 in MetaMask
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Enhanced Recent Issued Credentials */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <div className="relative mr-3">
              <Activity className="h-6 w-6 text-web3-blue floating-icon" />
            </div>
            Recent Approve Credential
            <div className="ml-auto flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live Updates</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credentialsLoading ? (
            <div className="p-6 space-y-4">
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
          ) : credentials.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <CheckCircle className="h-20 w-20 text-gray-600 mx-auto floating-icon" />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchDID ? 'No Matching Credentials Found' : 'No Credentials Yet'}
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {searchDID 
                  ? 'Try adjusting your search criteria or check if the DID is correct' 
                  : 'When users approve your verification requests, they will appear here for you to track and manage'
                }
              </p>
              
              
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <div className="bg-green-500 bg-opacity-10 rounded-lg p-6 border border-green-500 border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                  <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                  <p className="text-green-300 font-semibold mb-2">User Approvals</p>
                  <p className="text-gray-400 text-sm">Track and manage all verification requests approved by users</p>
                </div>
                <div className="bg-blue-500 bg-opacity-10 rounded-lg p-6 border border-blue-500 border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                  <Eye className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-300 font-semibold mb-2">Real-time Status</p>
                  <p className="text-gray-400 text-sm">Monitor approval status and user responses instantly</p>
                </div>
                <div className="bg-purple-500 bg-opacity-10 rounded-lg p-6 border border-purple-500 border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                  <Shield className="h-10 w-10 text-purple-400 mx-auto mb-3" />
                  <p className="text-purple-300 font-semibold mb-2">Trust Network</p>
                  <p className="text-gray-400 text-sm">Build verified connections and expand your network</p>
                </div>
              </div>
              
              {!searchDID && (
                <div className="mt-8">
                  <Button 
                    onClick={() => setActiveSection('search')}
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Start Verifying Now
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.slice(0, 5).map((credential, index) => (
                <div key={credential.id} className="glass-effect rounded-lg p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-transparent hover:border-l-blue-500" data-testid={`recent-request-${index}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          credential.status === 'approved' ? 'bg-green-500 bg-opacity-20 border-2 border-green-500 border-opacity-50' :
                          credential.status === 'rejected' ? 'bg-red-500 bg-opacity-20 border-2 border-red-500 border-opacity-50' :
                          'bg-yellow-500 bg-opacity-20 border-2 border-yellow-500 border-opacity-50'
                        }`}>
                          {credential.status === 'approved' ? 
                            <CheckCircle className="h-6 w-6 text-green-400" /> :
                            credential.status === 'rejected' ? 
                            <XCircle className="h-6 w-6 text-red-400" /> :
                            <AlertCircle className="h-6 w-6 text-yellow-400" />
                          }
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-white">{credential.credentialType}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                            credential.status === 'approved' ? 'text-green-500 bg-green-500 bg-opacity-20' :
                            credential.status === 'rejected' ? 'text-red-500 bg-red-500 bg-opacity-20' :
                            'text-yellow-500 bg-yellow-500 bg-opacity-20'
                          }`}>
                            {credential.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm font-mono">
                          {credential.recipientDID ? `${credential.recipientDID.slice(0, 30)}...` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {new Date(credential.submittedAt || credential.issuedAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {new Date(credential.submittedAt || credential.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

              {/* Valid Recipients Section */}
              <div className="form-section">
                <div className="bg-slate-800 bg-opacity-50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center mb-3">
                    <Users className="h-4 w-4 text-blue-400 mr-2" />
                    <h3 className="text-base font-semibold text-blue-300">Valid Recipients (Accounts 2-7)</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    {/* Account 2 */}
                    <div className="bg-slate-700 bg-opacity-50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-xs font-medium mb-1">Account 2</p>
                          <p className="text-gray-400 text-xs font-mono truncate">0x3C44...4293BC</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSearchForm(prev => ({ ...prev, did: 'did:ethr:0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' }))}
                          className="ml-2 flex-shrink-0 p-1.5 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded border border-blue-500 border-opacity-30 transition-all duration-200"
                          title="Copy to search field"
                        >
                          <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Account 3 */}
                    <div className="bg-slate-700 bg-opacity-50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-xs font-medium mb-1">Account 3</p>
                          <p className="text-gray-400 text-xs font-mono truncate">0x90F7...3b906</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSearchForm(prev => ({ ...prev, did: 'did:ethr:0x90F79bf6EB2c4f870365E785982E1f101E93b906' }))}
                          className="ml-2 flex-shrink-0 p-1.5 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded border border-blue-500 border-opacity-30 transition-all duration-200"
                          title="Copy to search field"
                        >
                          <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Account 4 */}
                    <div className="bg-slate-700 bg-opacity-50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-xs font-medium mb-1">Account 4</p>
                          <p className="text-gray-400 text-xs font-mono truncate">0x15d3...C6A65</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSearchForm(prev => ({ ...prev, did: 'did:ethr:0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' }))}
                          className="ml-2 flex-shrink-0 p-1.5 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded border border-blue-500 border-opacity-30 transition-all duration-200"
                          title="Copy to search field"
                        >
                          <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Account 5 */}
                    <div className="bg-slate-700 bg-opacity-50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-xs font-medium mb-1">Account 5</p>
                          <p className="text-gray-400 text-xs font-mono truncate">0x9965...A4dc</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSearchForm(prev => ({ ...prev, did: 'did:ethr:0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc' }))}
                          className="ml-2 flex-shrink-0 p-1.5 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded border border-blue-500 border-opacity-30 transition-all duration-200"
                          title="Copy to search field"
                        >
                          <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Account 6 */}
                    <div className="bg-slate-700 bg-opacity-50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-xs font-medium mb-1">Account 6</p>
                          <p className="text-gray-400 text-xs font-mono truncate">0x976E...0aa9</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSearchForm(prev => ({ ...prev, did: 'did:ethr:0x976EA74026E726554dB657fA54763abd0C3a0aa9' }))}
                          className="ml-2 flex-shrink-0 p-1.5 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded border border-blue-500 border-opacity-30 transition-all duration-200"
                          title="Copy to search field"
                        >
                          <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Account 7 */}
                    <div className="bg-slate-700 bg-opacity-50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-xs font-medium mb-1">Account 7</p>
                          <p className="text-gray-400 text-xs font-mono truncate">0x14dC...9955</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSearchForm(prev => ({ ...prev, did: 'did:ethr:0x14dC79964da2C08b23698B3D3cc7Ca32193d9955' }))}
                          className="ml-2 flex-shrink-0 p-1.5 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded border border-blue-500 border-opacity-30 transition-all duration-200"
                          title="Copy to search field"
                        >
                          <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-yellow-500 bg-opacity-10 rounded border border-yellow-500 border-opacity-20">
                    <div className="flex items-center">
                      <AlertCircle className="h-3 w-3 text-yellow-400 mr-2" />
                      <p className="text-yellow-300 text-xs">
                        Only accounts 2-7 can receive credentials. Accounts 0-1 cannot send to themselves or other accounts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Credential Type */}
              <div className="form-section">
                <label className="form-label block text-xs font-semibold text-purple-300 mb-2">
                  📋 Credential Type
                </label>
                <div className="relative">
                  <Select
                    value={searchForm.credentialType}
                    onValueChange={(value) => setSearchForm(prev => ({ ...prev, credentialType: value }))}
                  >
                    <SelectTrigger className="form-input text-white h-10 text-sm pl-10" data-testid="select-credential-type">
                      <SelectValue placeholder="Choose the type of credential to verify..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="University Degree" className="text-white hover:bg-gray-700">
                        🎓 University Degree
                      </SelectItem>
                      <SelectItem value="Professional Certificate" className="text-white hover:bg-gray-700">
                        📜 Professional Certificate
                      </SelectItem>
                      <SelectItem value="Employment Verification" className="text-white hover:bg-gray-700">
                        💼 Employment Verification
                      </SelectItem>
                      <SelectItem value="Training Certificate" className="text-white hover:bg-gray-700">
                        🏆 Training Certificate
                      </SelectItem>
                      <SelectItem value="Achievement Award" className="text-white hover:bg-gray-700">
                        🥇 Achievement Award
                      </SelectItem>
                      <SelectItem value="Other" className="text-white hover:bg-gray-700">
                        📑 Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <ClipboardList className="h-4 w-4 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Request Message */}
              <div className="form-section">
                <label className="form-label block text-xs font-semibold text-green-300 mb-2">
                  💬 Request Message (Optional)
                </label>
                <div className="relative">
                  <Textarea
                    value={searchForm.message}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    placeholder="Describe why you need this verification..."
                    className="form-input text-white placeholder-gray-400 pl-10 pt-3 text-sm resize-none"
                    data-testid="textarea-message"
                  />
                  <div className="absolute left-3 top-3">
                    <Users className="h-4 w-4 text-green-400" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-gray-400 text-xs flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    This message will be visible to the credential holder
                  </p>
                  <span className="text-gray-500 text-xs">
                    {searchForm.message.length}/500
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-section">
                <Button
                  type="submit"
                  disabled={sendRequestMutation.isPending || !searchForm.did || !searchForm.credentialType}
                  className="enhanced-button w-full text-white py-3 text-sm font-bold"
                  data-testid="button-send-request"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {sendRequestMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Verification Request</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </form>
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
            <h1 className="text-4xl font-bold gradient-text mb-2">Approve Credential</h1>
            <p className="text-gray-300 text-lg">Review and approve credentials submitted by users</p>
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
        <Button 
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            statusFilter === 'all' 
              ? 'bg-web3-blue bg-opacity-20 text-web3-blue' 
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          All Credentials ({credentials.length})
        </Button>
        <Button 
          onClick={() => setStatusFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            statusFilter === 'approved' 
              ? 'bg-green-500 bg-opacity-20 text-green-400' 
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Approved ({credentials.filter(c => c.status === 'approved').length})
        </Button>
        <Button 
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            statusFilter === 'pending' 
              ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' 
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Pending ({credentials.filter(c => c.status === 'pending').length})
        </Button>
        <Button 
          onClick={() => setStatusFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            statusFilter === 'rejected' 
              ? 'bg-red-500 bg-opacity-20 text-red-400' 
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Rejected ({credentials.filter(c => c.status === 'rejected').length})
        </Button>
      </div>

      {/* Approve Credential Table */}
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
              <div className="relative mb-6">
                {statusFilter === 'all' ? (
                  <CheckCircle className="h-20 w-20 text-gray-600 mx-auto floating-icon" />
                ) : statusFilter === 'approved' ? (
                  <CheckCircle className="h-20 w-20 text-green-500 mx-auto floating-icon" />
                ) : statusFilter === 'pending' ? (
                  <Clock className="h-20 w-20 text-yellow-500 mx-auto floating-icon" />
                ) : (
                  <XCircle className="h-20 w-20 text-red-500 mx-auto floating-icon" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchDID ? 'No Matching Credentials Found' : 
                 statusFilter === 'approved' ? 'No Approved Credentials' :
                 statusFilter === 'pending' ? 'No Pending Credentials' :
                 statusFilter === 'rejected' ? 'No Rejected Credentials' :
                 'No Credentials Found'}
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {searchDID 
                  ? 'Try adjusting your search criteria or check if the DID is correct' 
                  : statusFilter === 'approved' ? 'No verification requests have been approved yet'
                  : statusFilter === 'pending' ? 'No verification requests are currently pending'
                  : statusFilter === 'rejected' ? 'No verification requests have been rejected'
                  : 'When users respond to your verification requests, they will appear here'
                }
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                <div className="bg-green-500 bg-opacity-10 rounded-lg p-6 border border-green-500 border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                  <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                  <p className="text-green-300 font-semibold mb-2">User Approvals</p>
                  <p className="text-gray-400 text-sm">Track and manage all verification requests approved by users</p>
                </div>
                <div className="bg-blue-500 bg-opacity-10 rounded-lg p-6 border border-blue-500 border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                  <Eye className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-300 font-semibold mb-2">Real-time Status</p>
                  <p className="text-gray-400 text-sm">Monitor approval status and user responses instantly</p>
                </div>
                <div className="bg-purple-500 bg-opacity-10 rounded-lg p-6 border border-purple-500 border-opacity-20 hover:bg-opacity-20 transition-all duration-300">
                  <Shield className="h-10 w-10 text-purple-400 mx-auto mb-3" />
                  <p className="text-purple-300 font-semibold mb-2">Trust Network</p>
                  <p className="text-gray-400 text-sm">Build verified connections and expand your network</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!searchDID && statusFilter === 'all' && (
                  <Button 
                    onClick={() => setActiveSection('search')}
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Start Verifying Now
                  </Button>
                )}
                {statusFilter !== 'all' && (
                  <Button 
                    onClick={() => setStatusFilter('all')}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3"
                  >
                    View All Requests
                  </Button>
                )}
                {searchDID && (
                  <Button 
                    onClick={() => setSearchDID('')}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredCredentials.map((credential, index) => (
                <div key={credential.id} className="bg-slate-800 bg-opacity-50 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300" data-testid={`credential-card-${index}`}>
                  <div className="flex items-start justify-between">
                    {/* Credential Info */}
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Credential Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl">
                          {credential.icon}
                        </div>
                      </div>
                      
                      {/* Credential Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="bg-slate-700 text-gray-300 px-3 py-1 rounded-full text-sm font-mono">
                            # {credential.id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            credential.status === 'approved' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                            credential.status === 'pending' ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                            credential.status === 'rejected' ? 'bg-red-500 bg-opacity-20 text-red-400' :
                            'bg-gray-500 bg-opacity-20 text-gray-400'
                          }`}>
                            {credential.status === 'approved' ? 'Active' : credential.status.charAt(0).toUpperCase() + credential.status.slice(1)}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-1">{credential.title}</h3>
                        <p className="text-gray-400 mb-3">{credential.subtitle}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Database className="h-4 w-4 text-blue-400" />
                            <div>
                              <p className="text-gray-400">Issuer DID</p>
                              <p className="text-white font-mono text-xs">{credential.issuerDID}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="text-gray-400">Recipient</p>
                              <p className="text-white">{credential.recipientName}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-purple-400" />
                            <div>
                              <p className="text-gray-400">Issue Date</p>
                              <p className="text-white">{credential.issueDate}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-orange-400" />
                            <div>
                              <p className="text-gray-400">Submitted</p>
                              <p className="text-white">{credential.submittedAt.toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      {credential.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => approveCredentialMutation.mutate(credential.id)}
                            disabled={approveCredentialMutation.isPending}
                            className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white px-6 py-3 text-sm font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none group"
                            data-testid={`approve-${index}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-center">
                              {approveCredentialMutation.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                  <span>Approving...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  <span>Approve</span>
                                </>
                              )}
                            </div>
                          </Button>
                          <Button
                            onClick={() => rejectCredentialMutation.mutate(credential.id)}
                            disabled={rejectCredentialMutation.isPending}
                            className="relative overflow-hidden bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 text-white px-6 py-3 text-sm font-semibold rounded-xl shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none group"
                            data-testid={`reject-${index}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-center">
                              {rejectCredentialMutation.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                  <span>Rejecting...</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  <span>Reject</span>
                                </>
                              )}
                            </div>
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300 px-4 py-2 text-sm"
                        data-testid={`view-details-${index}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
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
                    {(() => {
                      const isAccount8 = walletAddress?.toLowerCase() === '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
                      const isAccount9 = walletAddress?.toLowerCase() === '0xa0ee7a142d267c1f36714e4a8f75612f20a79720';
                      
                      let displayedDid;
                      if (walletConnected && (isAccount8 || isAccount9)) {
                        displayedDid = `did:ethr:${walletAddress}`;
                      } else {
                        displayedDid = 'did:ethr:0x0000000000000000000000000000000000000000';
                      }
                      
                      console.log('DID_RENDER:', displayedDid);
                      
                      return displayedDid.length > 40 ? `${displayedDid.slice(0, 20)}...${displayedDid.slice(-15)}` : displayedDid;
                    })()}
                  </p>
                </div>
                <button 
                  onClick={async (event) => {
                    try {
                      const isAccount8 = walletAddress?.toLowerCase() === '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
                      const isAccount9 = walletAddress?.toLowerCase() === '0xa0ee7a142d267c1f36714e4a8f75612f20a79720';
                      
                      const didToCopy = (walletConnected && (isAccount8 || isAccount9)) 
                        ? `did:ethr:${walletAddress}`
                        : 'did:ethr:0x0000000000000000000000000000000000000000';
                      
                      await navigator.clipboard.writeText(didToCopy);
                      console.log('DID copied to clipboard:', didToCopy);
                      
                      // Show success message
                      alert('DID copied to clipboard!');
                      
                    } catch (error) {
                      console.error('Failed to copy DID:', error);
                      alert('Failed to copy DID to clipboard');
                    }
                  }}
                  disabled={(() => {
                    const isAccount8 = walletAddress?.toLowerCase() === '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
                    const isAccount9 = walletAddress?.toLowerCase() === '0xa0ee7a142d267c1f36714e4a8f75612f20a79720';
                    return !walletConnected || (!isAccount8 && !isAccount9);
                  })()}
                  className={(() => {
                    const isAccount8 = walletAddress?.toLowerCase() === '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
                    const isAccount9 = walletAddress?.toLowerCase() === '0xa0ee7a142d267c1f36714e4a8f75612f20a79720';
                    const isDisabled = !walletConnected || (!isAccount8 && !isAccount9);
                    return isDisabled 
                      ? "text-gray-500 cursor-not-allowed transition-colors" 
                      : "text-blue-400 hover:text-blue-300 transition-colors";
                  })()}
                  title={(() => {
                    const isAccount8 = walletAddress?.toLowerCase() === '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
                    const isAccount9 = walletAddress?.toLowerCase() === '0xa0ee7a142d267c1f36714e4a8f75612f20a79720';
                    const isDisabled = !walletConnected || (!isAccount8 && !isAccount9);
                    return isDisabled ? "Copy not available for placeholder DID" : "Copy DID";
                  })()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      <VerifierSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-7xl">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'search' && renderSearch()}
          {activeSection === 'approved-requests' && renderRequests()}
          {activeSection === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default VerifierDashboard;
