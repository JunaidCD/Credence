import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLocation } from 'wouter';

const LoginModal = ({ isOpen, onClose, userType }) => {
  const [, setLocation] = useLocation();
  const { connectWallet, loading } = useAuth();

  const handleConnect = async () => {
    try {
      const user = await connectWallet(userType);
      onClose();
      
      // Redirect based on user type
      if (user.userType === 'verifier') {
        setLocation('/dashboard/verifier');
      } else if (user.userType === 'issuer') {
        setLocation('/dashboard/issuer');
      } else {
        setLocation('/dashboard/user');
      }
    } catch (error) {
      // Error is handled in AuthContext
      console.error('Login failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border border-gray-800 max-w-md">
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-gradient-to-r from-web3-purple to-web3-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" data-testid="modal-title">Connect Wallet</h2>
          <p className="text-gray-400 mb-6" data-testid="modal-description">
            Connect your MetaMask wallet to access your decentralized identity
          </p>
          
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
