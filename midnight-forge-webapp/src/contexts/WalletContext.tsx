import React, { type PropsWithChildren, createContext, useState, useCallback, useMemo } from 'react';
import { type WalletProviders, type WalletAPIProvider, BrowserWalletManager } from './WalletManager';
import { type Logger } from 'pino';
import { type DAppConnectorWalletAPI } from '@midnight-ntwrk/dapp-connector-api';

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
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export type WalletProviderProps = PropsWithChildren<{
  logger: Logger;
}>;

export const WalletProvider: React.FC<Readonly<WalletProviderProps>> = ({ logger, children }) => {
  // Create persistent wallet manager
  // const walletManager = useMemo(() => {
  //   console.log('🔧 Creating new BrowserWalletManager instance');
  //   return new BrowserWalletManager(logger);
  // }, [logger]);

  // State to store the actual wallet instance and providers
  const [wallet, setWallet] = useState<DAppConnectorWalletAPI | null>(null);
  const [walletProviders, setWalletProviders] = useState<WalletProviders | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Enhanced setters that also update related state
  const handleSetWallet = useCallback((newWallet: DAppConnectorWalletAPI | null) => {
    setWallet(newWallet);
    if (!newWallet) {
      setWalletAddress(null);
      setWalletProviders(null);
    }
  }, []);

  const handleSetWalletProviders = useCallback((providers: WalletProviders | null) => {
    setWalletProviders(providers);
    if (providers && wallet) {
      // Extract address from providers if available
      setWalletAddress(providers.walletProvider.coinPublicKey || null);
    }
  }, [wallet]);

  // Computed values
  const isWalletConnected = wallet !== null && walletProviders !== null;

  const contextValue: WalletContextType = useMemo(() => ({
    // walletManager,
    wallet,
    walletProviders,
    setWallet: handleSetWallet,
    setWalletProviders: handleSetWalletProviders,
    isWalletConnected,
    walletAddress,
  }), [wallet, walletProviders, handleSetWallet, handleSetWalletProviders, isWalletConnected, walletAddress]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};