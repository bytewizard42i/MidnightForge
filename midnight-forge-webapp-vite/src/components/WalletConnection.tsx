import React, { useState, useEffect } from 'react';
import { useWalletContext } from '../hooks/useWalletContext';
import type { WalletState } from '@midnight-ntwrk/wallet-api';
import styles from './WalletConnection.module.css';

// interface WalletState {
//   status: 'disconnected' | 'connecting' | 'connected' | 'error';
//   address?: string;
//   error?: string;
// }

const SimpleWalletConnection: React.FC = () => {
  // const [walletState, setWalletState] = useState<WalletState>({ status: 'disconnected' });
  const [, setIsReconnecting] = useState(false);

  // set the wallet context
  const {setWallet, isWalletConnected, walletState, setWalletState, walletConnectionStatus, setWalletConnectionStatus} = useWalletContext();

  useEffect(() => {
    console.log('Wallet Connection Status:', walletConnectionStatus);
    console.log('Is Wallet Connected:', isWalletConnected);
    console.log('Get wallet state:', walletState);
  }, [walletConnectionStatus, isWalletConnected, walletState]);

  // Detect reconnection attempts
  useEffect(() => {
    if (walletConnectionStatus === 'connecting' && walletState?.address) {
      setIsReconnecting(true);
    } else {
      setIsReconnecting(false);
    }
  }, [walletConnectionStatus, walletState]);

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
          <button onClick={connectWallet} className={styles.connectButton}>
            Connect
          </button>
        );

      case 'connecting':
        return (
          <div className={styles.statusText}>
            <div className={styles.spinner}></div>
            Connecting...
          </div>
        );

      case 'connected':
        return (
          <>
            <div className={styles.statusText}>
              ✅ Connected
              <button onClick={disconnectWallet} className={styles.disconnectButton}>
                Disconnect
              </button>
            </div>
            {walletState?.address && (
              <div className={styles.walletDetails}>
                <div className={styles.addressRow}>
                  <span className={styles.label}>Address:</span>
                  <code className={styles.address}>
                    {walletState.address.slice(0, 8)}...{walletState.address.slice(-6)}
                  </code>
                </div>
                <div className={styles.networkRow}>
                  <span className={styles.label}>Network:</span>
                  <span className={styles.network}>
                    {walletState.address.includes('addr_test') ? 'TestNet' : 'MainNet'}
                  </span>
                </div>
              </div>
            )}
          </>
        );

      case 'error':
        return (
          <button onClick={connectWallet} className={styles.connectButton}>
            Retry
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${styles.walletConnection} ${
      walletConnectionStatus === 'connected' ? styles.connected : 
      walletConnectionStatus === 'error' ? styles.disconnected + ' ' + styles.error : 
      styles.disconnected
    }`}>
      {renderStatus()}
    </div>
  );
};

export default SimpleWalletConnection; 