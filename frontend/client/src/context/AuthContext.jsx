import { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        loading: false, 
        error: null 
      };
    case 'LOGIN_ERROR':
      return { 
        ...state, 
        loading: false, 
        error: action.payload, 
        isAuthenticated: false 
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'LOGOUT':
      return { 
        user: null, 
        isAuthenticated: false, 
        loading: false, 
        error: null 
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { toast } = useToast();

  const connectWallet = async (userType = 'user') => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      const address = accounts[0];

      // Call backend to authenticate or create user
      const response = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, userType })
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with backend');
      }

      const { user } = await response.json();
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      
      toast({
        title: "Connected Successfully!",
        description: `Welcome back, ${user.name}!`,
      });

      return user;
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message,
      });

      throw error;
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const disconnect = () => {
    dispatch({ type: 'LOGOUT' });
    
    toast({
      title: "Disconnected",
      description: "You have been logged out successfully.",
    });
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            // Auto-reconnect if already connected
            const address = accounts[0];
            const response = await fetch('/api/auth/connect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address })
            });

            if (response.ok) {
              const { user } = await response.json();
              dispatch({ type: 'LOGIN_SUCCESS', payload: user });
            }
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  const value = {
    ...state,
    connectWallet,
    updateUser,
    disconnect
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
