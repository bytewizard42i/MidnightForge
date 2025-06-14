import React, { type PropsWithChildren, createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { type WalletProviders, BrowserWalletManager } from './WalletManager';
import { type Logger } from 'pino';
import { type DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { WalletState } from '@midnight-ntwrk/wallet-api';

type WalletConnectionStatusType = 'disconnected' | 'connecting' | 'connected' | 'error';

// Constants for localStorage keys
const WALLET_STORAGE_KEYS = {
  CONNECTION_STATUS: 'wallet_connection_status',
  WALLET_STATE: 'wallet_state',
  WALLET_ADDRESS: 'wallet_address',
} as const;

/**
 * Enhanced wallet context that stores both the manager AND the wallet instance
 */
export interface WalletContextType {
  // Original wallet manager for connection management
  // walletManager: WalletAPIProvider;
  
  // Direct access to wallet instance for transactions
  wallet: DAppConnectorWalletAPI | null;
  walletProviders: WalletProviders | null;
  
  // Setters to save wallet when connected
  setWallet: (wallet: DAppConnectorWalletAPI | null) => void;
  setWalletProviders: (providers: WalletProviders | null) => void;

  // Convenience methods
  isWalletConnected: boolean;
  walletAddress: string | null;

  // Contains the wallet state, including the sync progress (coins, balances, etc.)
  walletState: WalletState | null;
  setWalletState: (state: WalletState | null) => void;

  // wallet connection status
  walletConnectionStatus: WalletConnectionStatusType;
  setWalletConnectionStatus: (status: WalletConnectionStatusType) => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export type WalletProviderProps = PropsWithChildren<{
  logger: Logger;
}>;

export const WalletProvider: React.FC<Readonly<WalletProviderProps>> = ({ logger, children }) => {
  // Create persistent wallet manager
  const walletManager = useMemo(() => {
    // console.log('🔧 Creating new BrowserWalletManager instance');
    logger.info('🔧 Creating new BrowserWalletManager instance');
    return new BrowserWalletManager(logger);
  }, [logger]);

  // Initialize state from localStorage
  const [wallet, setWallet] = useState<DAppConnectorWalletAPI | null>(null);
  const [walletProviders, setWalletProviders] = useState<WalletProviders | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    try {
      return localStorage.getItem(WALLET_STORAGE_KEYS.WALLET_ADDRESS);
    } catch {
      return null;
    }
  });
  const [walletState, setWalletState] = useState<WalletState | null>(() => {
    try {
      const savedState = localStorage.getItem(WALLET_STORAGE_KEYS.WALLET_STATE);
      return savedState ? JSON.parse(savedState) : null;
    } catch {
      return null;
    }
  });
  const [walletConnectionStatus, setWalletConnectionStatus] = useState<WalletConnectionStatusType>(() => {
    try {
      const savedStatus = localStorage.getItem(WALLET_STORAGE_KEYS.CONNECTION_STATUS);
      return (savedStatus as WalletConnectionStatusType) || 'disconnected';
    } catch {
      return 'disconnected';
    }
  });

  // Save wallet connection status to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEYS.CONNECTION_STATUS, walletConnectionStatus);
    } catch (error) {
      logger.warn('Failed to save wallet connection status to localStorage:', error);
    }
  }, [walletConnectionStatus, logger]);

  // Save wallet state to localStorage
  useEffect(() => {
    try {
      if (walletState) {
        localStorage.setItem(WALLET_STORAGE_KEYS.WALLET_STATE, JSON.stringify(walletState));
      } else {
        localStorage.removeItem(WALLET_STORAGE_KEYS.WALLET_STATE);
      }
    } catch (error) {
      logger.warn('Failed to save wallet state to localStorage:', error);
    }
  }, [walletState, logger]);

  // Save wallet address to localStorage
  useEffect(() => {
    try {
      if (walletAddress) {
        localStorage.setItem(WALLET_STORAGE_KEYS.WALLET_ADDRESS, walletAddress);
      } else {
        localStorage.removeItem(WALLET_STORAGE_KEYS.WALLET_ADDRESS);
      }
    } catch (error) {
      logger.warn('Failed to save wallet address to localStorage:', error);
    }
  }, [walletAddress, logger]);

  // Attempt to reconnect wallet on app load
  useEffect(() => {
    const attemptReconnection = async () => {
      // Only attempt reconnection if we have a saved connected state
      if (walletConnectionStatus === 'connected' && walletState) {
        logger.info('Attempting to reconnect wallet from saved state...');
        setWalletConnectionStatus('connecting');
        
        try {
          // Check if Midnight Lace wallet is still available
          const midnight = (window as any).midnight;
          if (!midnight?.mnLace) {
            logger.warn('Midnight Lace wallet not found during reconnection');
            setWalletConnectionStatus('disconnected');
            return;
          }

          const connector = midnight.mnLace;
          
          // Check if already enabled
          const isEnabled = await connector.isEnabled();
          if (!isEnabled) {
            logger.info('Wallet is not enabled, clearing saved state');
            setWalletConnectionStatus('disconnected');
            setWalletState(null);
            setWalletAddress(null);
            return;
          }

          // Enable the wallet
          const reconnectedWallet = await connector.enable();
          
          // Get current wallet state
          const currentState: WalletState = await reconnectedWallet.state();
          
          // Verify the wallet address matches what we saved
          if (currentState.address === walletState.address) {
            logger.info('Wallet reconnected successfully');
            setWallet(reconnectedWallet);
            setWalletState(currentState);
            setWalletAddress(currentState.address);
            setWalletConnectionStatus('connected');
          } else {
            logger.warn('Wallet address mismatch during reconnection');
            setWalletConnectionStatus('disconnected');
            setWalletState(null);
            setWalletAddress(null);
          }
        } catch (error) {
          logger.error('Failed to reconnect wallet:', error);
          setWalletConnectionStatus('disconnected');
          setWalletState(null);
          setWalletAddress(null);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(attemptReconnection, 100);
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - only run once on mount

  // Enhanced setters that also update related state
  const handleSetWallet = useCallback((newWallet: DAppConnectorWalletAPI | null) => {
    setWallet(newWallet);
    if (!newWallet) {
      setWalletAddress(null);
      setWalletProviders(null);
      setWalletState(null);
      setWalletConnectionStatus('disconnected');
    }
  }, []);

  const handleSetWalletProviders = useCallback((providers: WalletProviders | null) => {
    setWalletProviders(providers);
    if (providers && wallet) {
      // Extract address from providers if available
      setWalletAddress(providers.walletProvider.coinPublicKey || null);
    }
  }, [wallet]);

  // Enhanced setters that clear localStorage when disconnecting
  const handleSetWalletState = useCallback((state: WalletState | null) => {
    setWalletState(state);
    if (!state) {
      setWalletAddress(null);
    } else {
      setWalletAddress(state.address);
    }
  }, []);

  const handleSetWalletConnectionStatus = useCallback((status: WalletConnectionStatusType) => {
    setWalletConnectionStatus(status);
    
    // Clear all wallet data when disconnecting
    if (status === 'disconnected') {
      setWallet(null);
      setWalletProviders(null);
      setWalletState(null);
      setWalletAddress(null);
      
      // Clear localStorage
      try {
        localStorage.removeItem(WALLET_STORAGE_KEYS.WALLET_STATE);
        localStorage.removeItem(WALLET_STORAGE_KEYS.WALLET_ADDRESS);
      } catch (error) {
        logger.warn('Failed to clear wallet data from localStorage:', error);
      }
    }
  }, [logger]);

  // Computed values
  const isWalletConnected = walletConnectionStatus === 'connected';

  const contextValue: WalletContextType = useMemo(() => ({
    walletManager,
    wallet,
    walletProviders,
    setWallet: handleSetWallet,
    setWalletProviders: handleSetWalletProviders,
    isWalletConnected,
    walletAddress,
    walletState,
    setWalletState: handleSetWalletState,
    walletConnectionStatus,
    setWalletConnectionStatus: handleSetWalletConnectionStatus,
  }), [walletManager, wallet, walletProviders, handleSetWallet, handleSetWalletProviders, isWalletConnected, walletAddress, walletState, handleSetWalletState, walletConnectionStatus, handleSetWalletConnectionStatus]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};