import type { Config, ServerConfig } from '../config.js';
import type { CombinedContractProviders } from '../types.js';
import logger from '../logger.js';
import { Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Wallet } from '@midnight-ntwrk/wallet-api';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { combinedContractConfig } from '../config.js';
import * as Rx from 'rxjs';
import { Transaction } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { createBalancedTx } from '@midnight-ntwrk/midnight-js-types';

export class SimpleWalletService {
  private initialized = false;
  private wallet: Wallet & Resource | null = null;
  private providers: CombinedContractProviders | null = null;

  async initialize(config: Config, seed: string, filename: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('Initializing simple wallet service...');
      
      // For now, just simulate initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.initialized = true;
      logger.info('Simple wallet service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize wallet service:', error);
      throw new Error(`Wallet service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletFromSeed(config: ServerConfig): Promise<Wallet & Resource> {
    console.log('=== DEBUG getWalletFromSeed ===');
    console.log('config.walletSeed:', JSON.stringify(config?.walletSeed));
    console.log('config.walletSeed length:', config?.walletSeed?.length);
    
    const actualSeed = config.walletSeed;
    console.log('actualSeed:', JSON.stringify(actualSeed));
    
    console.log('Building wallet with:');
    console.log('- indexer:', config.midnight.indexer);
    console.log('- indexerWS:', config.midnight.indexerWS);
    console.log('- proofServer:', config.midnight.proofServer);
    console.log('- node:', config.midnight.node);
    console.log('- networkId:', getZswapNetworkId());
    
    try {
      const wallet = await WalletBuilder.buildFromSeed(
        config.midnight.indexer,
        config.midnight.indexerWS,
        config.midnight.proofServer,
        config.midnight.node,
        actualSeed,
        getZswapNetworkId(),
        'info',
      );

      console.log('Current networkId:', getZswapNetworkId());
      
      console.log('Wallet created successfully:', !!wallet);
      console.log('=== END DEBUG ===');
      
      // Store wallet for provider creation
      this.wallet = wallet;
      
      // Initialize providers now that we have the wallet
      await this.initializeProviders(config);
      
      return wallet;
    } catch (error) {
      console.error('Error building wallet:', error);
      throw error;
    }
  }

  private async initializeProviders(config: ServerConfig): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet must be initialized before providers');
    }

    try {
      console.log('=== Initializing Providers ===');
      
      // Create the base providers
      const privateStateProvider = levelPrivateStateProvider({
        privateStateStoreName: combinedContractConfig.privateStateStoreName,
      });

      console.log('privateStateProvider:', privateStateProvider);
      
      const publicDataProvider = indexerPublicDataProvider(
        config.midnight.indexer,
        config.midnight.indexerWS
      );
      console.log('publicDataProvider:', publicDataProvider);
      
      const proofProvider = httpClientProofProvider(config.midnight.proofServer);
      console.log('proofProvider:', proofProvider);
      
      // Create ZK config providers for each circuit
      const zkConfigProvider = new NodeZkConfigProvider<'incrementCounter'>(combinedContractConfig.zkConfigPath);
      console.log('zkConfigProvider:', zkConfigProvider);
      
      const mintDIDzNFTZkConfigProvider = new NodeZkConfigProvider<'mintDIDzNFT'>(combinedContractConfig.zkConfigPath);
      console.log('mintDIDzNFTZkConfigProvider:', mintDIDzNFTZkConfigProvider);
      const getDIDzNFTOwnerZkConfigProvider = new NodeZkConfigProvider<'getDIDzNFTOwner'>(combinedContractConfig.zkConfigPath);
      
      const getDIDzNFTMetadataHashZkConfigProvider = new NodeZkConfigProvider<'getDIDzNFTMetadataHash'>(combinedContractConfig.zkConfigPath);
      
      const getOwnerKeyZkConfigProvider = new NodeZkConfigProvider<'getOwnerKey'>(combinedContractConfig.zkConfigPath);
      
      const incrementCounterZkConfigProvider = new NodeZkConfigProvider<'incrementCounter'>(combinedContractConfig.zkConfigPath);
      
      const getCounterZkConfigProvider = new NodeZkConfigProvider<'getCounter'>(combinedContractConfig.zkConfigPath);
      
      const getOwnerAddressZkConfigProvider = new NodeZkConfigProvider<'getOwnerAddress'>(combinedContractConfig.zkConfigPath);
      
      const getDIDzNFTFromIdZkConfigProvider = new NodeZkConfigProvider<'getDIDzNFTFromId'>(combinedContractConfig.zkConfigPath);

      console.log('getDIDzNFTFromIdZkConfigProvider:', getDIDzNFTFromIdZkConfigProvider);
      // Get wallet state for provider creation
      const walletState = await Rx.firstValueFrom(this.wallet.state());
      console.log('walletState:', walletState);
      if (!walletState) {
        throw new Error('Failed to get wallet state');
      }
      
      this.providers = {
        privateStateProvider,
        publicDataProvider,
        proofProvider,
        walletProvider: {
          coinPublicKey: walletState.coinPublicKey,
          encryptionPublicKey: walletState.encryptionPublicKey,
          balanceTx: async (tx: any, newCoins: any) => {
            return this.wallet!
              .balanceTransaction(
                ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
                newCoins,
              )
              .then((tx) => this.wallet!.proveTransaction(tx))
              .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
              .then(createBalancedTx);
          },
        },
        midnightProvider: {
          submitTx: (tx: any) => this.wallet!.submitTransaction(tx),
        },
        // ZK Config providers for all circuits
        zkConfigProvider,
        mintDIDzNFTZkConfigProvider,
        getDIDzNFTOwnerZkConfigProvider,
        getDIDzNFTMetadataHashZkConfigProvider,
        getOwnerKeyZkConfigProvider,
        incrementCounterZkConfigProvider,
        getCounterZkConfigProvider,
        getOwnerAddressZkConfigProvider,
        getDIDzNFTFromIdZkConfigProvider,
      } as unknown as CombinedContractProviders;
      
      console.log('Providers initialized successfully');
      console.log('=== End Provider Initialization ===');
      
    } catch (error) {
      console.error('Error initializing providers:', error);
      throw new Error(`Provider initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getProviders(): CombinedContractProviders {
    if (!this.initialized) {
      throw new Error('Providers not initialized. Call initialize() first.');
    }
    
    if (!this.providers) {
      throw new Error('Providers not available. Wallet initialization may have failed.');
    }
    
    console.log('Returning providers:', !!this.providers);
    return this.providers;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async cleanup(): Promise<void> {
    if (this.initialized) {
      logger.info('Cleaning up wallet resources...');
      if (this.wallet) {
        await this.wallet.close();
        this.wallet = null;
      }
      this.providers = null;
      this.initialized = false;
    }
  }
} 