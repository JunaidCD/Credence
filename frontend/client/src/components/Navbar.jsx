import { useState } from 'react';
import { Link } from 'wouter';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = ({ onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <ShieldCheck className="h-8 w-8 text-web3-purple mr-2" />
              <span className="text-2xl font-bold bg-gradient-to-r from-web3-purple to-web3-blue bg-clip-text text-transparent">
                Credence
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a 
                  href="#features" 
                  className="text-gray-300 hover:text-web3-purple px-3 py-2 text-sm font-medium transition-colors"
                  data-testid="nav-features"
                >
                  Features
                </a>
                <a 
                  href="#how-it-works" 
                  className="text-gray-300 hover:text-web3-purple px-3 py-2 text-sm font-medium transition-colors"
                  data-testid="nav-how-it-works"
                >
                  How it Works
                </a>
                <a 
                  href="#" 
                  className="text-gray-300 hover:text-web3-purple px-3 py-2 text-sm font-medium transition-colors"
                  data-testid="nav-docs"
                >
                  Docs
                </a>
                <Button 
                  onClick={() => onLoginClick()}
                  className="glow-button text-white px-4 py-2 text-sm font-medium rounded-lg"
                  data-testid="button-get-started"
                >
                  Get Started
                </Button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white"
                data-testid="button-mobile-menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-800">
                <a 
                  href="#features" 
                  className="text-gray-300 hover:text-web3-purple block px-3 py-2 text-base font-medium transition-colors"
                  data-testid="mobile-nav-features"
                >
                  Features
                </a>
                <a 
                  href="#how-it-works" 
                  className="text-gray-300 hover:text-web3-purple block px-3 py-2 text-base font-medium transition-colors"
                  data-testid="mobile-nav-how-it-works"
                >
                  How it Works
                </a>
                <a 
                  href="#" 
                  className="text-gray-300 hover:text-web3-purple block px-3 py-2 text-base font-medium transition-colors"
                  data-testid="mobile-nav-docs"
                >
                  Docs
                </a>
                <Button 
                  onClick={() => onLoginClick()}
                  className="glow-button text-white px-4 py-2 text-sm font-medium rounded-lg w-full mt-2"
                  data-testid="mobile-button-get-started"
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
