import {
  BehaviorSubject,
  type Observable,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  of,
  take,
  tap,
  throwError,
  timeout,
  catchError,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
  type ServiceUriConfig,
} from '@midnight-ntwrk/dapp-connector-api';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import {
  type BalancedTransaction,
  type WalletProvider,
  type UnbalancedTransaction,
  type MidnightProvider,
  createBalancedTx,
} from '@midnight-ntwrk/midnight-js-types';
import { type TransactionId, type CoinInfo, Transaction } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import semver from 'semver';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

/**
 * Connection states for the wallet
 */
export interface WalletConnecting {
  readonly status: 'connecting';
}

export interface WalletConnected {
  readonly status: 'connected';
  readonly wallet: DAppConnectorWalletAPI;
  readonly uris: ServiceUriConfig;
  readonly walletState: {
    coinPublicKey: string;
    encryptionPublicKey: string;
    address: string;
    addressLegacy?: string;
  };
}

export interface WalletDisconnected {
  readonly status: 'disconnected';
  readonly error?: Error;
}

export type WalletConnection = WalletConnecting | WalletConnected | WalletDisconnected;

/**
 * Basic providers needed for wallet functionality - follows the pattern from api.ts
 */
export interface WalletProviders {
  privateStateProvider: any;
  zkConfigProvider: any;
  proofProvider: any;  
  publicDataProvider: any;
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
  submitTx: (tx: BalancedTransaction) => Promise<TransactionId>;
  sign: (tx: UnbalancedTransaction) => Promise<BalancedTransaction>;
}

/**
 * Extended providers for CombinedContract with all required zkConfigProviders
 */
export interface CombinedContractProviders extends WalletProviders {
  mintDIDzNFTZkConfigProvider: any;
  getDIDzNFTOwnerZkConfigProvider: any;
  getDIDzNFTMetadataHashZkConfigProvider: any;
  getOwnerKeyZkConfigProvider: any;
  incrementCounterZkConfigProvider: any;
  getCounterZkConfigProvider: any;
  getOwnerAddressZkConfigProvider: any;
  getDIDzNFTFromIdZkConfigProvider: any;
}

/**
 * Provides access to wallet connection and providers
 */
export interface WalletAPIProvider {
  readonly walletConnection$: Observable<WalletConnection>;
  readonly connect: () => void;
  readonly disconnect: () => void;
  readonly getProviders: () => Promise<WalletProviders | null>;
  readonly getCombinedContractProviders: () => Promise<CombinedContractProviders | null>;
}

/**
 * Browser-based wallet manager for Midnight Forge webapp
 */
export class BrowserWalletManager implements WalletAPIProvider {
  readonly #walletConnectionSubject: BehaviorSubject<WalletConnection>;
  #initializedProviders: Promise<WalletProviders> | null = null;

  constructor(private readonly logger: Logger) {
    this.#walletConnectionSubject = new BehaviorSubject<WalletConnection>({
      status: 'disconnected',
    });
    this.walletConnection$ = this.#walletConnectionSubject;
  }

  /**
   * Static method to configure providers following the api.ts pattern
   * This allows for easy provider configuration without requiring a wallet connection
   */
  static async configureProviders(
    wallet: DAppConnectorWalletAPI,
    uris: ServiceUriConfig,
    walletState: {
      coinPublicKey: string;
      encryptionPublicKey: string;
      address: string;
      addressLegacy?: string;
    },
    privateStateStoreName: string = 'midnight-forge-private-state',
  ): Promise<WalletProviders> {
    // Dynamic import works around webpack's static analysis
    const { httpClientProofProvider } = await import('@midnight-ntwrk/midnight-js-http-client-proof-provider');

    // Create combined wallet and midnight provider following api.ts pattern
    const walletAndMidnightProvider: WalletProvider & MidnightProvider = {
      coinPublicKey: walletState.coinPublicKey,
      encryptionPublicKey: walletState.encryptionPublicKey,
      balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
        return wallet
          .balanceTransaction(
            ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
            newCoins,
          )
          .then((tx) => wallet.proveTransaction(tx))
          .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
          .then(createBalancedTx);
      },
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        return wallet.submitTransaction(tx);
      },
      sign(tx: UnbalancedTransaction): Promise<BalancedTransaction> {
        return wallet.signTransaction(tx, []);
      },
    };

    return {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName,
      }),
      zkConfigProvider: new FetchZkConfigProvider(window.location.origin, fetch.bind(window)),
      proofProvider: httpClientProofProvider(uris.proverServerUri),
      publicDataProvider: indexerPublicDataProvider(uris.indexerUri, uris.indexerWsUri),
      walletProvider: walletAndMidnightProvider,
      midnightProvider: walletAndMidnightProvider,
    };
  }

  readonly walletConnection$: Observable<WalletConnection>;

  connect(): void {
    if (this.#walletConnectionSubject.value.status === 'connecting') {
      return; // Already connecting
    }

    this.#walletConnectionSubject.next({ status: 'connecting' });
    void this.performConnection();
  }

  disconnect(): void {
    this.#walletConnectionSubject.next({ status: 'disconnected' });
    this.#initializedProviders = null;
  }

  async getProviders(): Promise<WalletProviders | null> {
    const connection = this.#walletConnectionSubject.value;
    if (connection.status !== 'connected') {
      return null;
    }

    if (!this.#initializedProviders) {
      this.#initializedProviders = this.initializeProviders(connection);
    }

    return this.#initializedProviders;
  }

  async getCombinedContractProviders(): Promise<CombinedContractProviders | null> {
    const baseProviders = await this.getProviders();
    if (!baseProviders) {
      return null;
    }

    // Add all the specialized zkConfigProviders needed for CombinedContract
    return {
      ...baseProviders,
      mintDIDzNFTZkConfigProvider: baseProviders.zkConfigProvider,
      getDIDzNFTOwnerZkConfigProvider: baseProviders.zkConfigProvider,
      getDIDzNFTMetadataHashZkConfigProvider: baseProviders.zkConfigProvider,
      getOwnerKeyZkConfigProvider: baseProviders.zkConfigProvider,
      incrementCounterZkConfigProvider: baseProviders.zkConfigProvider,
      getCounterZkConfigProvider: baseProviders.zkConfigProvider,
      getOwnerAddressZkConfigProvider: baseProviders.zkConfigProvider,
      getDIDzNFTFromIdZkConfigProvider: baseProviders.zkConfigProvider,
    };
  }

  private async performConnection(): Promise<void> {
    try {
      const result = await connectToWallet(this.logger);
      const walletState = await result.wallet.state();

      this.#walletConnectionSubject.next({
        status: 'connected',
        wallet: result.wallet,
        uris: result.uris,
        walletState: {
          coinPublicKey: walletState.coinPublicKey,
          encryptionPublicKey: walletState.encryptionPublicKey,
          address: walletState.address,
          addressLegacy: walletState.addressLegacy,
        },
      });
    } catch (error: unknown) {
      this.#walletConnectionSubject.next({
        status: 'disconnected',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async initializeProviders(connection: WalletConnected): Promise<WalletProviders> {
    const { wallet, uris } = connection;

    console.log('🔧 🔑 Initializing providers using static configuration method...');
    
    // Use the static method to configure providers, following api.ts pattern
    return BrowserWalletManager.configureProviders(
      wallet,
      uris,
      connection.walletState,
      'midnight-forge-private-state'
    );
  }
}

const connectToWallet = (logger: Logger): Promise<{ wallet: DAppConnectorWalletAPI; uris: ServiceUriConfig }> => {
  const COMPATIBLE_CONNECTOR_API_VERSION = '1.x';

  console.log('🔧 🚀 Starting wallet connection process...');
  console.log('🔧 📡 Current network IDs - Ledger:', getLedgerNetworkId(), 'Zswap:', getZswapNetworkId());

  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => window.midnight?.mnLace),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Check for wallet connector API');
        if (connectorAPI) {
          console.log('🔧 📱 Found wallet connector API:', connectorAPI.apiVersion);
        }
      }),
      filter((connectorAPI): connectorAPI is DAppConnectorAPI => !!connectorAPI),
      concatMap((connectorAPI) =>
        semver.satisfies(connectorAPI.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION)
          ? of(connectorAPI)
          : throwError(() => {
              logger.error(
                {
                  expected: COMPATIBLE_CONNECTOR_API_VERSION,
                  actual: connectorAPI.apiVersion,
                },
                'Incompatible version of wallet connector API',
              );

              return new Error(
                `Incompatible version of Midnight Lace wallet found. Require '${COMPATIBLE_CONNECTOR_API_VERSION}', got '${connectorAPI.apiVersion}'.`,
              );
            }),
      ),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Compatible wallet connector API found. Connecting.');
        console.log('🔧 ✅ Compatible wallet API version:', connectorAPI.apiVersion);
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');
            return new Error('Could not find Midnight Lace wallet. Extension installed?');
          }),
      }),
      concatMap(async (connectorAPI) => {
        const isEnabled = await connectorAPI.isEnabled();
        logger.info(isEnabled, 'Wallet connector API enabled status');
        console.log('🔧 🔓 Wallet enabled status:', isEnabled);
        return connectorAPI;
      }),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            logger.error('Wallet connector API has failed to respond');
            return new Error('Midnight Lace wallet has failed to respond. Extension enabled?');
          }),
      }),
      concatMap(async (connectorAPI) => {
        console.log('🔧 🔑 Enabling wallet connector API...');
        const walletConnectorAPI = await connectorAPI.enable();
        console.log('🔧 ✅ Wallet connector enabled successfully');
        return { walletConnectorAPI, connectorAPI };
      }),
      catchError((error, apis) => {
        console.log('🔧 ❌ Error enabling connector API:', error);
        return error
          ? throwError(() => {
              logger.error('Unable to enable connector API');
              return new Error('Application is not authorized');
            })
          : apis;
      }),
      concatMap(async ({ walletConnectorAPI, connectorAPI }) => {
        console.log('🔧 ⚙️ Getting service URI configuration...');
        const uris = await connectorAPI.serviceUriConfig();
        console.log('🔧 🌐 Service URIs:', uris);

        console.log('🔧 💳 Getting wallet state...');
        const walletState = await walletConnectorAPI.state();
        console.log('🔧 📊 Wallet state keys:', Object.keys(walletState));
        console.log('🔧 🔑 Coin public key type:', typeof walletState.coinPublicKey);
        console.log('🔧 🏠 Wallet address:', walletState.address);

        if (walletState.address?.includes('addr_test')) {
          console.log('🔧 ✅ Wallet is using TestNet address format - this should work with TestNet network');
        }

        logger.info('Connected to wallet connector API and retrieved service configuration');
        return { wallet: walletConnectorAPI, uris };
      }),
    ),
  );
}; 