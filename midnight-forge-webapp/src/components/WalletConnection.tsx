import React, { useState, useEffect } from 'react';

interface WalletState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  address?: string;
  error?: string;
}

const SimpleWalletConnection: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>({ status: 'disconnected' });

  const connectWallet = async () => {
    setWalletState({ status: 'connecting' });
    
    try {
      // Check if Midnight Lace wallet is available
      const midnight = (window as any).midnight;
      if (!midnight?.mnLace) {
        throw new Error('Midnight Lace wallet not found. Please install the extension.');
      }

      const connector = midnight.mnLace;
      console.log('Found Midnight Lace connector:', connector.apiVersion);

      // Check if already enabled
      const isEnabled = await connector.isEnabled();
      console.log('Wallet enabled status:', isEnabled);

      // Enable the wallet
      const wallet = await connector.enable();
      console.log('Wallet enabled successfully');

      // Get wallet state
      const state = await wallet.state();
      console.log('Wallet state:', state);

      setWalletState({
        status: 'connected',
        address: state.address,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const disconnectWallet = () => {
    setWalletState({ status: 'disconnected' });
  };

  const renderStatus = () => {
    switch (walletState.status) {
      case 'disconnected':
        return (
          <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '20px 0' }}>
            <h3>Wallet Not Connected</h3>
            <p>Connect your Midnight Lace wallet to interact with contracts.</p>
            <button 
              onClick={connectWallet}
              style={{
                background: '#1976d2',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Connect Wallet
            </button>
          </div>
        );

      case 'connecting':
        return (
          <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '20px 0' }}>
            <h3>Connecting...</h3>
            <p>Please check your Midnight Lace wallet extension.</p>
          </div>
        );

      case 'connected':
        return (
          <div style={{ 
            padding: '20px', 
            border: '1px solid #4caf50', 
            borderRadius: '8px', 
            margin: '20px 0',
            background: '#f1f8e9'
          }}>
            <h3>✅ Wallet Connected</h3>
            <p><strong>Address:</strong> {walletState.address}</p>
            <p><strong>Network:</strong> {walletState.address?.includes('addr_test') ? 'TestNet' : 'Unknown'}</p>
            <button 
              onClick={disconnectWallet}
              style={{
                background: '#d32f2f',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Disconnect
            </button>
          </div>
        );

      case 'error':
        return (
          <div style={{ 
            padding: '20px', 
            border: '1px solid #f44336', 
            borderRadius: '8px', 
            margin: '20px 0',
            background: '#ffebee'
          }}>
            <h3>❌ Connection Error</h3>
            <p style={{ color: '#d32f2f' }}>{walletState.error}</p>
            <button 
              onClick={connectWallet}
              style={{
                background: '#1976d2',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStatus();
};

export default SimpleWalletConnection; 