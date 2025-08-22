import { Button } from '@/components/ui/button';
import { User, Search } from 'lucide-react';
import { useState } from 'react';
import LoginModal from './LoginModal.jsx';

const HeroSection = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUserType, setLoginUserType] = useState(null);

  const openLoginModal = (userType) => {
    setLoginUserType(userType);
    setShowLoginModal(true);
  };

  return (
    <>
      <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-slide-in">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6" data-testid="hero-title">
              <span className="block">Own Your</span>
              <span className="block bg-gradient-to-r from-web3-purple via-web3-blue to-web3-cyan bg-clip-text text-transparent">
                Digital Identity
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto" data-testid="hero-subtitle">
              Secure, decentralized identity management with verifiable credentials. Take control of your digital identity on the blockchain.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={() => openLoginModal('user')}
                className="glow-button text-white px-8 py-4 text-lg font-semibold rounded-xl flex items-center justify-center"
                data-testid="button-login-user"
              >
                <User className="mr-2 h-5 w-5" />
                Login as User
              </Button>
              <Button 
                onClick={() => openLoginModal('verifier')}
                variant="outline"
                className="border-2 border-web3-purple text-white px-8 py-4 text-lg font-semibold rounded-xl hover:bg-web3-purple hover:bg-opacity-20 transition-all flex items-center justify-center bg-transparent"
                data-testid="button-login-verifier"
              >
                <Search className="mr-2 h-5 w-5" />
                Login as Verifier
              </Button>
            </div>

            {/* Hero Image */}
            <div className="relative max-w-4xl mx-auto">
              <img 
                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
                alt="Blockchain digital identity visualization" 
                className="rounded-2xl shadow-2xl animate-float" 
                data-testid="hero-image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        userType={loginUserType}
      />
    </>
  );
};

export default HeroSection;
