import React, { useState, useEffect } from 'react';
import { useWalletContext } from '../hooks/useWalletContext';
import type { WalletState } from '@midnight-ntwrk/wallet-api';

// interface WalletState {
//   status: 'disconnected' | 'connecting' | 'connected' | 'error';
//   address?: string;
//   error?: string;
// }

const SimpleWalletConnection: React.FC = () => {
  // const [walletState, setWalletState] = useState<WalletState>({ status: 'disconnected' });

  // set the wallet context
  const {setWallet, isWalletConnected, walletState, setWalletState, walletConnectionStatus, setWalletConnectionStatus} = useWalletContext();

  useEffect(() => {
    console.log('Wallet Connection Status:', walletConnectionStatus);
    console.log('Is Wallet Connected:', isWalletConnected);
    console.log('Get wallet state:', walletState);
  }, [walletConnectionStatus, isWalletConnected, walletState]);

  const connectWallet = async () => {
    setWalletConnectionStatus('connecting');
    
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
      setWallet(wallet);

      // Get wallet state
      const state: WalletState = await wallet.state();
      console.log('Wallet state:', state);
      

      if (state != null) {
        setWalletState(state);
        setWalletConnectionStatus('connected');
      } else {
        setWalletConnectionStatus('disconnected');
      }

      const serviceUriConfig = await connector.serviceUriConfig();
      console.log('Service URI config:', serviceUriConfig);



    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletConnectionStatus('error');
    }
  };

  const disconnectWallet = () => {
    setWalletConnectionStatus('disconnected');
  };

  const renderStatus = () => {
    switch (walletConnectionStatus) {
             case 'disconnected':
         return (
           <div style={{ 
             padding: '24px', 
             border: '3px solid #333', 
             borderRadius: '12px', 
             margin: '24px auto', 
             background: 'rgba(255, 255, 255, 0.95)',
             backdropFilter: 'blur(10px)',
             boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
             maxWidth: '600px',
             textAlign: 'center'
           }}>
             <h3 style={{ 
               color: '#1a1a1a', 
               fontSize: '1.5rem', 
               fontWeight: '600',
               margin: '0 0 16px 0',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '12px'
             }}>
               🔌 Wallet Not Connected
             </h3>
             <p style={{ 
               color: '#444', 
               fontSize: '1rem', 
               lineHeight: '1.5',
               margin: '8px 0 20px 0' 
             }}>
               Connect your Midnight Lace wallet to interact with contracts.
             </p>
             <button 
               onClick={connectWallet}
               style={{
                 background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                 color: 'white',
                 border: 'none',
                 padding: '14px 28px',
                 borderRadius: '8px',
                 cursor: 'pointer',
                 fontSize: '16px',
                 fontWeight: '600',
                 textTransform: 'uppercase',
                 letterSpacing: '0.5px',
                 boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                 transition: 'all 0.3s ease'
               }}
               onMouseOver={(e) => {
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 6px 20px rgba(25, 118, 210, 0.4)';
               }}
               onMouseOut={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.3)';
               }}
             >
               Connect Wallet
             </button>
           </div>
         );

             case 'connecting':
         return (
           <div style={{ 
             padding: '24px', 
             border: '3px solid #ff9800', 
             borderRadius: '12px', 
             margin: '24px auto', 
             background: 'rgba(255, 255, 255, 0.95)',
             backdropFilter: 'blur(10px)',
             boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
             maxWidth: '600px',
             textAlign: 'center',
             animation: 'pulse 2s infinite'
           }}>
             <h3 style={{ 
               color: '#1a1a1a', 
               fontSize: '1.5rem', 
               fontWeight: '600',
               margin: '0 0 16px 0',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '12px'
             }}>
               ⏳ Connecting...
             </h3>
             <p style={{ 
               color: '#444', 
               fontSize: '1rem', 
               lineHeight: '1.5',
               margin: '8px 0' 
             }}>
               Please check your Midnight Lace wallet extension.
             </p>
             <style>
               {`
                 @keyframes pulse {
                   0% { box-shadow: 0 8px 32px rgba(255, 152, 0, 0.2); }
                   50% { box-shadow: 0 8px 32px rgba(255, 152, 0, 0.5); }
                   100% { box-shadow: 0 8px 32px rgba(255, 152, 0, 0.2); }
                 }
               `}
             </style>
           </div>
         );

             case 'connected':
         return (
           <div style={{ 
             padding: '24px', 
             border: '3px solid #4caf50', 
             borderRadius: '12px', 
             margin: '24px auto',
             background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(129, 199, 132, 0.15))',
             backdropFilter: 'blur(10px)',
             boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
             maxWidth: '600px',
             textAlign: 'center'
           }}>
             <h3 style={{ 
               color: '#ffffff', // should be a light color
               fontSize: '1.5rem', 
               fontWeight: '600',
               margin: '0 0 20px 0',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '12px'
             }}>
               ✅ Wallet Connected
             </h3>
             <div style={{ marginBottom: '20px' }}>
               <p style={{ 
                 color: '#ffffff', 
                 fontSize: '1rem', 
                 margin: '8px 0' 
               }}>
                 <strong>Address:</strong> <code style={{
                   background: 'rgba(0,0,0,0.1)', 
                   padding: '4px 8px', 
                   borderRadius: '4px', 
                   fontSize: '0.9em',
                   wordBreak: 'break-all'
                 }}>{walletState?.address}</code>
               </p>
               <p style={{ 
                 color: 'grey', // more darker since it's a label 
                 fontSize: '1rem', 
                 margin: '8px 0' 
               }}>
                 <strong>Network:</strong> <span style={{
                   color: '#ffffff', 
                   fontWeight: 'bold',
                   fontSize: '1.1em'
                 }}>{walletState?.address?.includes('addr_test') ? 'TestNet' : 'Unknown'}</span>
               </p>
             </div>
             <button 
               onClick={disconnectWallet}
               style={{
                 background: 'linear-gradient(135deg, #d32f2f, #c62828)',
                 color: 'white',
                 border: 'none',
                 padding: '14px 28px',
                 borderRadius: '8px',
                 cursor: 'pointer',
                 fontSize: '16px',
                 fontWeight: '600',
                 textTransform: 'uppercase',
                 letterSpacing: '0.5px',
                 boxShadow: '0 4px 16px rgba(211, 47, 47, 0.3)',
                 transition: 'all 0.3s ease'
               }}
               onMouseOver={(e) => {
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 6px 20px rgba(211, 47, 47, 0.4)';
               }}
               onMouseOut={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 4px 16px rgba(211, 47, 47, 0.3)';
               }}
             >
               Disconnect
             </button>
           </div>
         );

             case 'error':
         return (
           <div style={{ 
             padding: '24px', 
             border: '3px solid #f44336', 
             borderRadius: '12px', 
             margin: '24px auto',
             background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(239, 154, 154, 0.15))',
             backdropFilter: 'blur(10px)',
             boxShadow: '0 8px 32px rgba(244, 67, 54, 0.3)',
             maxWidth: '600px',
             textAlign: 'center'
           }}>
             <h3 style={{ 
               color: '#1a1a1a', 
               fontSize: '1.5rem', 
               fontWeight: '600',
               margin: '0 0 16px 0',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '12px'
             }}>
               ❌ Connection Error
             </h3>
             <div style={{
               background: 'rgba(244, 67, 54, 0.1)',
               padding: '12px',
               borderRadius: '8px',
               borderLeft: '4px solid #f44336',
               margin: '16px 0 20px 0'
             }}>
               <p style={{ 
                 color: '#d32f2f', 
                 fontSize: '0.95em',
                 margin: '0'
               }}>
                 <strong>Error:</strong> {walletConnectionStatus === 'error' ? 'Unknown error' : ''}
               </p>
             </div>
             <button 
               onClick={connectWallet}
               style={{
                 background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                 color: 'white',
                 border: 'none',
                 padding: '14px 28px',
                 borderRadius: '8px',
                 cursor: 'pointer',
                 fontSize: '16px',
                 fontWeight: '600',
                 textTransform: 'uppercase',
                 letterSpacing: '0.5px',
                 boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                 transition: 'all 0.3s ease'
               }}
               onMouseOver={(e) => {
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 6px 20px rgba(25, 118, 210, 0.4)';
               }}
               onMouseOut={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.3)';
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