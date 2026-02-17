import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';

const Landing = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUserType, setLoginUserType] = useState(null);

  const openLoginModal = (userType = null) => {
    setLoginUserType(userType);
    setShowLoginModal(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar 
        onLoginClick={openLoginModal} 
      />
      <HeroSection 
        onLoginClick={openLoginModal} 
      />
      <FeaturesSection />
      <HowItWorksSection />
      <Footer />
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        userType={loginUserType}
      />
    </div>
  );
};

export default Landing;
