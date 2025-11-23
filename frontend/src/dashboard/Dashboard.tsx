import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../config/colors';

interface User {
  id: string;
  wallet_address: string;
  created_at: string;
  last_login: string;
}

type MenuItem = 'profile' | 'earn';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<string>('');
  const [activeMenu, setActiveMenu] = useState<MenuItem>('profile');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const savedUser = localStorage.getItem('stellar_user');
    const savedAddress = localStorage.getItem('stellar_wallet');

    if (!savedUser || !savedAddress) {
      // Redirect to login if not authenticated
      navigate('/');
      return;
    }

    setUser(JSON.parse(savedUser));
    setAccount(savedAddress);

    // Listen for account changes
    const handleAccountChange = (accounts: string[]) => handleAccountsChanged(accounts);
    
    if (window.ethereum && typeof window.ethereum.on === 'function') {
      window.ethereum.on('accountsChanged', handleAccountChange);
    }

    return () => {
      if (window.ethereum && typeof window.ethereum.removeListener === 'function') {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
      }
    };
  }, [navigate]);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      handleLogout();
    } else if (account && accounts[0].toLowerCase() !== account.toLowerCase()) {
      // User switched to a different account
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('stellar_user');
    localStorage.removeItem('stellar_wallet');
    navigate('/');
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.lightBlue} 100%)` }}
      >
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: colors.cream }}>
      {/* Sidebar */}
      <aside 
        className="w-64 shadow-lg flex flex-col"
        style={{ backgroundColor: 'white', borderRight: `1px solid ${colors.lightBlue}` }}
      >
        {/* Logo/Brand */}
        <div 
          className="p-6 border-b"
          style={{ borderColor: colors.lightBlue }}
        >
          <h1 className="text-2xl font-bold" style={{ color: colors.darkRed }}>
            Stellar
          </h1>
          <p className="text-sm text-gray-500 mt-1">Dashboard</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveMenu('profile')}
            className={`w-full text-left px-4 py-3 mb-2 font-medium transition-all duration-200 ${
              activeMenu === 'profile' ? 'shadow-md' : 'hover:shadow-sm'
            }`}
            style={{
              backgroundColor: activeMenu === 'profile' ? colors.lightBlue : 'transparent',
              color: activeMenu === 'profile' ? colors.blue : '#4B5563',
              borderRadius: '6px'
            }}
          >
            Profile
          </button>

          <button
            onClick={() => setActiveMenu('earn')}
            className={`w-full text-left px-4 py-3 mb-2 font-medium transition-all duration-200 ${
              activeMenu === 'earn' ? 'shadow-md' : 'hover:shadow-sm'
            }`}
            style={{
              backgroundColor: activeMenu === 'earn' ? colors.lightBlue : 'transparent',
              color: activeMenu === 'earn' ? colors.blue : '#4B5563',
              borderRadius: '6px'
            }}
          >
            Earn
          </button>
        </nav>

        {/* User Info & Logout */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: colors.lightBlue }}
        >
          <div 
            className="p-3 mb-3"
            style={{ backgroundColor: colors.cream, borderRadius: '6px' }}
          >
            <p className="text-xs text-gray-500 mb-1">Connected Wallet</p>
            <p className="font-mono text-sm font-medium" style={{ color: colors.blue }}>
              {formatAddress(account)}
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full text-white px-4 py-3 font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${colors.darkRed} 0%, ${colors.rose} 100%)`,
              borderRadius: '6px'
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header 
          className="bg-white shadow-sm border-b p-6"
          style={{ borderColor: colors.lightBlue }}
        >
          <h2 className="text-2xl font-bold" style={{ color: colors.darkRed }}>
            {activeMenu === 'profile' ? 'Profile' : 'Earn'}
          </h2>
          <p className="text-gray-600 mt-1">
            {activeMenu === 'profile' 
              ? 'Manage your account and view your information' 
              : 'Earn rewards and complete tasks'}
          </p>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {activeMenu === 'profile' && (
            <>
              {/* Welcome Section */}
              <div 
                className="bg-white shadow-md p-6 mb-6"
                style={{ borderRadius: '8px' }}
              >
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.darkRed }}>
                  Welcome back
                </h3>
                <p className="text-gray-600">
                  You're successfully logged in to your Stellar account.
                </p>
              </div>

              {/* User Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* User ID Card */}
                <div 
                  className="shadow-md p-5 hover:shadow-lg transition-shadow duration-300"
                  style={{ backgroundColor: colors.cream, borderRadius: '8px' }}
                >
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">User ID</h4>
                  <p className="font-mono text-sm break-all" style={{ color: colors.blue }}>
                    {user.id}
                  </p>
                </div>

                {/* Wallet Address Card */}
                <div 
                  className="shadow-md p-5 hover:shadow-lg transition-shadow duration-300"
                  style={{ backgroundColor: colors.lightPink, borderRadius: '8px' }}
                >
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Wallet Address</h4>
                  <p className="font-mono text-sm break-all" style={{ color: colors.darkRed }}>
                    {user.wallet_address}
                  </p>
                </div>

                {/* Member Since Card */}
                <div 
                  className="shadow-md p-5 hover:shadow-lg transition-shadow duration-300"
                  style={{ backgroundColor: colors.lightYellow, borderRadius: '8px' }}
                >
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Member Since</h4>
                  <p className="font-mono text-sm" style={{ color: colors.orange }}>
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Last Login Card */}
                <div 
                  className="shadow-md p-5 hover:shadow-lg transition-shadow duration-300"
                  style={{ backgroundColor: colors.peach, borderRadius: '8px' }}
                >
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Last Login</h4>
                  <p className="font-mono text-sm" style={{ color: colors.darkRed }}>
                    {new Date(user.last_login).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Account Status Card */}
                <div 
                  className="shadow-md p-5 hover:shadow-lg transition-shadow duration-300"
                  style={{ backgroundColor: colors.lightMint, borderRadius: '8px' }}
                >
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Account Status</h4>
                  <p className="font-semibold text-lg" style={{ color: '#059669' }}>Active</p>
                </div>

                {/* Network Card */}
                <div 
                  className="shadow-md p-5 hover:shadow-lg transition-shadow duration-300"
                  style={{ backgroundColor: colors.lightBlue, borderRadius: '8px' }}
                >
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Network</h4>
                  <p className="font-semibold text-lg" style={{ color: colors.blue }}>Ethereum</p>
                </div>
              </div>

              {/* Account Details */}
              <div 
                className="bg-white shadow-md p-6"
                style={{ borderRadius: '8px' }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.darkRed }}>
                  Account Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-3 border-b" style={{ borderColor: colors.lightBlue }}>
                    <span className="font-medium text-gray-700">Full Wallet Address</span>
                    <span className="font-mono text-sm" style={{ color: colors.blue }}>
                      {user.wallet_address}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b" style={{ borderColor: colors.lightBlue }}>
                    <span className="font-medium text-gray-700">User ID</span>
                    <span className="font-mono text-sm" style={{ color: colors.blue }}>
                      {user.id}
                    </span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="font-medium text-gray-700">Account Created</span>
                    <span className="font-mono text-sm" style={{ color: colors.blue }}>
                      {new Date(user.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeMenu === 'earn' && (
            <div 
              className="bg-white shadow-md p-8 text-center"
              style={{ borderRadius: '8px' }}
            >
              <h3 className="text-2xl font-bold mb-3" style={{ color: colors.darkRed }}>
                Earn Section
              </h3>
              <p className="text-gray-600 mb-6">
                This section is coming soon. Check back later for exciting earning opportunities!
              </p>
              <div 
                className="inline-block px-6 py-3 font-medium"
                style={{ 
                  backgroundColor: colors.lightYellow, 
                  color: colors.orange,
                  borderRadius: '6px'
                }}
              >
                Under Development
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
