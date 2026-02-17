import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLocation } from 'wouter';

const LoginModal = ({ isOpen, onClose, userType }) => {
  const [, setLocation] = useLocation();
  const { connectWallet, loading, user: authUser, isAuthenticated } = useAuth();

  const handleConnect = async () => {
    try {
      const user = await connectWallet(userType);
      
      if (user) {
        // Close modal first
        onClose();
        
        // Small delay to ensure modal closes before redirect
        setTimeout(() => {
          if (userType === 'verifier') {
            setLocation('/dashboard/verifier');
          } else if (userType === 'issuer') {
            setLocation('/dashboard/issuer');
          } else {
            setLocation('/dashboard/user');
          }
        }, 100);
      }
    } catch (error) {
      // Error is handled in AuthContext
      console.error('Login failed:', error);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated && authUser) {
      // User is already authenticated, redirect directly
      onClose();
      if (authUser.userType === 'verifier') {
        setLocation('/dashboard/verifier');
      } else if (authUser.userType === 'issuer') {
        setLocation('/dashboard/issuer');
      } else {
        setLocation('/dashboard/user');
      }
    }
  }, [isOpen, isAuthenticated, authUser]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border border-gray-800 max-w-md">
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-gradient-to-r from-web3-purple to-web3-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-white mb-2" data-testid="modal-title">Connect Wallet</DialogTitle>
          <DialogDescription className="text-gray-400 mb-6" data-testid="modal-description">
            Connect your MetaMask wallet to access your decentralized identity
          </DialogDescription>
          
          <Button 
            onClick={handleConnect}
            disabled={loading}
            className="glow-button text-white px-6 py-3 rounded-xl font-semibold w-full flex items-center justify-center mb-4"
            data-testid="button-connect-metamask"
          >
            <Wallet className="mr-2 h-5 w-5" />
            {loading ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
          
          <Button 
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
