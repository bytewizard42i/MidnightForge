import type { Config, ServerConfig } from '../config.js';
import type { CombinedContractProviders, ServerWallet } from '../types.js';
import logger from '../logger.js';
import { Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import { getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Wallet } from '@midnight-ntwrk/wallet-api';

export class SimpleWalletService {
  private initialized = false;

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
    // console.log('=== DEBUG getWalletFromSeed ===');
    // console.log('config.walletSeed:', JSON.stringify(config?.walletSeed));
    // console.log('config.walletSeed length:', config?.walletSeed?.length);
    
    const actualSeed = config.walletSeed;
    // console.log('actualSeed:', JSON.stringify(actualSeed));
    
    // console.log('Building wallet with:');
    // console.log('- indexer:', config.midnight.indexer);
    // console.log('- indexerWS:', config.midnight.indexerWS);
    // console.log('- proofServer:', config.midnight.proofServer);
    // console.log('- node:', config.midnight.node);
    // console.log('- networkId:', getZswapNetworkId());
    
    try {
      const wallet = await WalletBuilder.build(
        config.midnight.indexer,
        config.midnight.indexerWS,
        config.midnight.proofServer,
        config.midnight.node,
        actualSeed,
        getZswapNetworkId(),
        'warn',
      );
      
      console.log('Wallet created successfully:', !!wallet);
      console.log('=== END DEBUG ===');
      return wallet;
    } catch (error) {
      console.error('Error building wallet:', error);
      throw error;
    }
  }

  getProviders(): CombinedContractProviders {
    if (!this.initialized) {
      throw new Error('Providers not initialized. Call initialize() first.');
    }
    // Return mock providers for now
    return {} as CombinedContractProviders;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async cleanup(): Promise<void> {
    if (this.initialized) {
      logger.info('Cleaning up wallet resources...');
      this.initialized = false;
    }
  }
} 