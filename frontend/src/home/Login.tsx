import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { colors } from '../config/colors';

interface User {
  id: string;
  wallet_address: string;
  created_at: string;
  last_login: string;
}

const Login = () => {
  const [account, setAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask to use this feature');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        // Only set account if user data exists in localStorage
        const savedUser = localStorage.getItem('stellar_user');
        const savedAddress = localStorage.getItem('stellar_wallet');
        
        if (savedUser && savedAddress && savedAddress.toLowerCase() === accounts[0].toLowerCase()) {
          setAccount(accounts[0]);
          setUser(JSON.parse(savedUser));
          // Redirect to dashboard if already logged in
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      if (!window.ethereum) {
        setError('Please install MetaMask to continue');
        setLoading(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const walletAddress = accounts[0];
      setAccount(walletAddress);

      // Create a message to sign
      const message = `Sign this message to authenticate with your wallet.\nTimestamp: ${Date.now()}`;

      // Request signature
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Send to backend
      const response = await fetch('http://localhost:3001/api/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        // Save to localStorage for persistence
        localStorage.setItem('stellar_user', JSON.stringify(data.user));
        localStorage.setItem('stellar_wallet', walletAddress);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(data.error || 'Authentication failed');
        // Clean up on failure
        cleanupLoginState();
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      
      // Handle specific MetaMask errors
      if (err.code === 4001) {
        // User rejected the request
        setError('Connection request was rejected. Please try again.');
      } else if (err.code === -32002) {
        // Request already pending
        setError('Connection request already pending. Please check MetaMask.');
      } else if (err.message && err.message.includes('user rejected')) {
        // User rejected signing
        setError('Signature request was rejected. Please try again.');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
      
      // Clean up state on any error
      cleanupLoginState();
    } finally {
      setLoading(false);
    }
  };

  const cleanupLoginState = () => {
    // Reset all state
    setAccount('');
    setUser(null);
    // Clear localStorage
    localStorage.removeItem('stellar_user');
    localStorage.removeItem('stellar_wallet');
  };

  const disconnectWallet = () => {
    cleanupLoginState();
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.lightBlue} 50%, ${colors.lightMint} 100%)` }}
    >
      <div className="bg-white shadow-2xl p-10 max-w-lg w-full animate-fade-in" style={{ borderRadius: '8px' }}>
        <h1 className="text-4xl font-bold text-center mb-3" style={{ color: colors.darkRed }}>
          Stellar Login
        </h1>
        <p className="text-center text-gray-600 mb-8 text-base">
          Connect your wallet to get started
        </p>

        {error && (
          <div 
            className="border p-3 mb-5 flex items-center gap-2"
            style={{ 
              backgroundColor: colors.lightPink, 
              borderColor: colors.rose, 
              color: colors.darkRed,
              borderRadius: '6px'
            }}
          >
            <span>{error}</span>
          </div>
        )}

        {!account ? (
          <button
            className="w-full text-white font-semibold py-4 px-6 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mb-5"
            style={{ 
              background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.gold} 100%)`,
              borderRadius: '6px'
            }}
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="mb-5">
            <div 
              className="p-5 mb-5"
              style={{ backgroundColor: colors.cream, borderRadius: '6px' }}
            >
              <div className="flex justify-between py-2.5 border-b border-gray-200">
                <span className="font-semibold text-gray-700">Connected Wallet:</span>
                <span className="font-mono text-sm" style={{ color: colors.blue }}>{formatAddress(account)}</span>
              </div>
              {user && (
                <>
                  <div className="flex justify-between py-2.5 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">User ID:</span>
                    <span className="font-mono text-sm" style={{ color: colors.blue }}>{user.id}</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Joined:</span>
                    <span className="font-mono text-sm" style={{ color: colors.blue }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="font-semibold text-gray-700">Last Login:</span>
                    <span className="font-mono text-sm" style={{ color: colors.blue }}>
                      {new Date(user.last_login).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
            <button 
              className="w-full bg-gray-100 text-gray-700 font-semibold py-4 px-6 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-all duration-200"
              style={{ borderRadius: '6px' }}
              onClick={disconnectWallet}
            >
              Disconnect
            </button>
          </div>
        )}

        <div 
          className="border-l-4 p-4"
          style={{ 
            backgroundColor: colors.lightYellow, 
            borderColor: colors.gold, 
            color: '#854d0e',
            borderRadius: '6px'
          }}
        >
          <p className="m-0 leading-relaxed">
            <strong className="text-gray-900">Note:</strong> Make sure you have MetaMask or another Web3
            wallet extension installed in your browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
