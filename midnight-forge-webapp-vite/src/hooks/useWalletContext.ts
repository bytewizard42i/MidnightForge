import { useContext } from 'react';
import { WalletContext, type WalletContextType } from '../contexts/WalletContext';
// import { type WalletAPIProvider } from '../contexts/WalletManager';

/**
 * Retrieves the currently in-scope wallet provider.
 *
 * @returns The currently in-scope {@link WalletAPIProvider} implementation.
 */
export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('A <WalletProvider /> is required.');
  }

  return context;
}; 