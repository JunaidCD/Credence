import { useState, useEffect } from 'react';

export const useMetaMask = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkMetaMask = () => {
      setIsInstalled(typeof window.ethereum !== 'undefined');
    };

    checkMetaMask();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || null);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  const connect = async () => {
    if (!isInstalled) {
      throw new Error('MetaMask is not installed');
    }

    setIsConnecting(true);
    
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      setAccount(accounts[0]);
      return accounts[0];
    } catch (error) {
      throw new Error('Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
  };

  return {
    isInstalled,
    account,
    isConnecting,
    connect,
    disconnect
  };
};
