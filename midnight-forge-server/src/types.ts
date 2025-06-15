import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import type { TransactionId } from '@midnight-ntwrk/ledger';
import type { FinalizedTxData, ImpureCircuitId, MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { Wallet } from '@midnight-ntwrk/wallet-api';
import type { Resource } from '@midnight-ntwrk/wallet';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CombinedContract, type CombinedContractPrivateState } from '@midnight-forge/protocol-did-contract';

// Define types locally to avoid import issues
export type CombinedContractCircuits = ImpureCircuitId<CombinedContract.Contract<CombinedContractPrivateState>>;

export const CombinedContractPrivateStateId = 'combinedContractPrivateState';

export type CombinedContractProviders = MidnightProviders<CombinedContractCircuits, typeof CombinedContractPrivateStateId, CombinedContractPrivateState> & {
  mintDIDzNFTZkConfigProvider: NodeZkConfigProvider<'mintDIDzNFT'>;
  getDIDzNFTOwnerZkConfigProvider: NodeZkConfigProvider<'getDIDzNFTOwner'>;
  getDIDzNFTMetadataHashZkConfigProvider: NodeZkConfigProvider<'getDIDzNFTMetadataHash'>;
  getOwnerKeyZkConfigProvider: NodeZkConfigProvider<'getOwnerKey'>;
  incrementCounterZkConfigProvider: NodeZkConfigProvider<'incrementCounter'>;
  getCounterZkConfigProvider: NodeZkConfigProvider<'getCounter'>;
  getOwnerAddressZkConfigProvider: NodeZkConfigProvider<'getOwnerAddress'>;
  zkConfigProvider: NodeZkConfigProvider<'incrementCounter'>;
  getDIDzNFTFromIdZkConfigProvider: NodeZkConfigProvider<'getDIDzNFTFromId'>;
};

export type CombinedContractContract = CombinedContract.Contract<CombinedContractPrivateState>;

export type DeployedCombinedContractContract = DeployedContract<CombinedContractContract> | FoundContract<CombinedContractContract>;

// Server-specific types
export interface ServerWallet extends Wallet, Resource {}

export interface DeployContractRequest {
  ownerSecretKey: string; // hex string
  ownerAddress: string;   // hex string
}

export interface DeployContractResponse {
  success: boolean;
  contractAddress?: string;
  transactionId?: string;
  error?: string;
}

export interface MintNFTRequest {
  contractAddress: string;
  metadataHash: string; // hex string
  did: string;          // hex string
}

export interface MintNFTResponse {
  success: boolean;
  nftId?: number;
  transactionId?: string;
  error?: string;
}

export interface GetNFTRequest {
  contractAddress: string;
  nftId: number;
}

export interface GetNFTResponse {
  success: boolean;
  nft?: {
    owner: string;
    metadataHash: string;
    did: string;
  };
  error?: string;
}

export interface ContractStatusRequest {
  contractAddress: string;
}

export interface ContractStatusResponse {
  success: boolean;
  ownerKey?: string;
  ownerAddress?: string;
  error?: string;
}

export interface ServerContext {
  wallet: ServerWallet;
  providers: CombinedContractProviders;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  network: {
    indexer: string;
    node: string;
    proofServer: string;
  };
  wallet: {
    connected: boolean;
    synced: boolean;
  };
  contractService: {
    initialized: boolean;
    providers: CombinedContractProviders;
  };
} 