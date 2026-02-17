import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLocation } from 'wouter';

const LoginModal = ({ isOpen, onClose, userType }) => {
  const [, setLocation] = useLocation();
  const { connectWallet, loading } = useAuth();
  const isConnecting = useRef(false);

  const handleConnect = async () => {
    // Prevent multiple clicks
    if (isConnecting.current) return;
    isConnecting.current = true;
    
    try {
      // Close modal first - set state immediately
      onClose();
      
      // Start the wallet connection
      await connectWallet(userType);
      
      // Redirect immediately to the appropriate dashboard based on button clicked
      if (userType === 'verifier') {
        setLocation('/dashboard/verifier');
      } else if (userType === 'issuer') {
        setLocation('/dashboard/issuer');
      } else {
        setLocation('/dashboard/user');
      }
    } catch (error) {
      // Error is handled in AuthContext
      console.error('Login failed:', error);
    } finally {
      isConnecting.current = false;
    }
  };

  const handleDialogClose = (open) => {
    // Only close if explicitly triggered, not during connection
    if (!open && !isConnecting.current) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
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
