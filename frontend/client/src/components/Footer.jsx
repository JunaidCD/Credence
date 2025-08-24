import { ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 bg-opacity-50 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center mb-4">
              <ShieldCheck className="h-8 w-8 text-web3-purple mr-2" />
              <span className="text-2xl font-bold bg-gradient-to-r from-web3-purple to-web3-blue bg-clip-text text-transparent">
                Credence
              </span>
            </div>
            <p className="text-gray-400 max-w-md" data-testid="footer-description">
              Empowering individuals with decentralized identity management and verifiable credentials on the blockchain.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-web3-purple transition-colors" data-testid="footer-docs">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-web3-purple transition-colors" data-testid="footer-api">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-web3-purple transition-colors" data-testid="footer-github">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-web3-purple transition-colors" data-testid="footer-community">
                  Community
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:hello@credence.com" className="text-gray-400 hover:text-web3-purple transition-colors" data-testid="footer-email">
                  hello@credence.com
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-web3-purple transition-colors" data-testid="footer-support">
                  Support Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-web3-purple transition-colors" data-testid="footer-twitter">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-web3-purple transition-colors" data-testid="footer-discord">
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400" data-testid="footer-copyright">
            &copy; 2024 Credence. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
