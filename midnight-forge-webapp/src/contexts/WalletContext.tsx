import React, { type PropsWithChildren, createContext } from 'react';
import { type WalletAPIProvider, BrowserWalletManager } from './WalletManager';
import { type Logger } from 'pino';

/**
 * Encapsulates a wallet provider as a context object.
 */
export const WalletContext = createContext<WalletAPIProvider | undefined>(undefined);

/**
 * The props required by the {@link WalletProvider} component.
 */
export type WalletProviderProps = PropsWithChildren<{
  /** The `pino` logger to use. */
  logger: Logger;
}>;

/**
 * A React component that sets a new {@link BrowserWalletManager} object as the currently
 * in-scope wallet provider.
 */
export const WalletProvider: React.FC<Readonly<WalletProviderProps>> = ({ logger, children }) => (
  <WalletContext.Provider value={new BrowserWalletManager(logger)}>
    {children}
  </WalletContext.Provider>
); 