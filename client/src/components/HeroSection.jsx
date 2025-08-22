import { Button } from '@/components/ui/button';
import { User, Search, Award } from 'lucide-react';
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
              <Button 
                onClick={() => openLoginModal('issuer')}
                variant="outline"
                className="border-2 border-web3-cyan text-white px-8 py-4 text-lg font-semibold rounded-xl hover:bg-web3-cyan hover:bg-opacity-20 transition-all flex items-center justify-center bg-transparent"
                data-testid="button-login-issuer"
              >
                <Award className="mr-2 h-5 w-5" />
                Login as Issuer
              </Button>
            </div>

            {/* Hero Image */}
            <div className="relative max-w-4xl mx-auto hero-glow">
              <img 
                src="/src/assets/web3-hero-modern.png" 
                alt="Ultra-modern Web3 holographic interface with digital identity visualization" 
                className="rounded-2xl shadow-2xl animate-float relative z-10" 
                data-testid="hero-image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent rounded-2xl z-20"></div>
              
              {/* Floating Particles */}
              <div className="floating-particles">
                <div className="particle" style={{left: '10%', animationDelay: '0s'}}></div>
                <div className="particle" style={{left: '20%', animationDelay: '-1s'}}></div>
                <div className="particle" style={{left: '30%', animationDelay: '-2s'}}></div>
                <div className="particle" style={{left: '70%', animationDelay: '-3s'}}></div>
                <div className="particle" style={{left: '80%', animationDelay: '-4s'}}></div>
                <div className="particle" style={{left: '90%', animationDelay: '-5s'}}></div>
              </div>
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
