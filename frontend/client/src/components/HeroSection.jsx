import { Button } from '@/components/ui/button';
import { User, Search, Award } from 'lucide-react';

const HeroSection = ({ onLoginClick }) => {
  return (
    <>
      <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 z-0"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-slide-in">
            {/* Main Tagline */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-6" data-testid="hero-title">
              <span className="bg-gradient-to-r from-web3-purple via-web3-blue to-web3-cyan bg-clip-text text-transparent">
                Own Your Digital Identity
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed" data-testid="hero-subtitle">
              Secure, Verifiable, and Private Credentials Powered by Blockchain
            </p>
            
            {/* Role-based Login Buttons */}
            <div className="flex flex-col lg:flex-row gap-4 justify-center mb-16 max-w-4xl mx-auto">
              <Button 
                onClick={() => onLoginClick('issuer')}
                className="glow-button text-white px-8 py-4 text-lg font-semibold rounded-xl flex items-center justify-center min-w-[220px]"
                data-testid="button-login-issuer"
              >
                <Award className="mr-2 h-5 w-5" />
                Login as Issuer
              </Button>
              <Button 
                onClick={() => onLoginClick('user')}
                variant="outline"
                className="border-2 border-web3-purple text-white px-8 py-4 text-lg font-semibold rounded-xl hover:bg-web3-purple hover:bg-opacity-20 transition-all flex items-center justify-center bg-transparent min-w-[220px]"
                data-testid="button-login-user"
              >
                <User className="mr-2 h-5 w-5" />
                Login as User
              </Button>
              <Button 
                onClick={() => onLoginClick('verifier')}
                variant="outline"
                className="border-2 border-web3-blue text-white px-8 py-4 text-lg font-semibold rounded-xl hover:bg-web3-blue hover:bg-opacity-20 transition-all flex items-center justify-center bg-transparent min-w-[220px]"
                data-testid="button-login-verifier"
              >
                <Search className="mr-2 h-5 w-5" />
                Login as Verifier
              </Button>
            </div>

            {/* Hero Image */}
            <div className="relative max-w-5xl mx-auto px-4 sm:px-8">
              <div className="relative hero-glow rounded-3xl overflow-hidden">
                <img 
                  src="/src/assets/digital-identity-hero.png" 
                  alt="Professional digital identity and verifiable credentials management interface" 
                  className="w-full h-auto rounded-3xl shadow-2xl animate-float relative z-10 object-cover aspect-video sm:aspect-auto" 
                  data-testid="hero-image"
                />
                {/* Enhanced gradient overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-3xl z-20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-web3-purple/10 via-transparent to-web3-blue/10 rounded-3xl z-15"></div>
                
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
        </div>
      </section>
    </>
  );
};

export default HeroSection;
