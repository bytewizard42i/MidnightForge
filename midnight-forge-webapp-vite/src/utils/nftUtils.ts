import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type FinalizedTxData, type PrivateState } from '@midnight-ntwrk/midnight-js-types';
import { type BrowserWalletManager } from '../contexts/WalletManager';
import { hexStringToBytes32 } from '../../../counter-cli/src/utils';
import { fromHex } from '@midnight-ntwrk/midnight-js-utils';

/**
 * NFT Utilities for the Midnight Forge webapp
 * 
 * This file shows how to use the existing NFT functions from api.ts
 * with the browser wallet manager. The actual NFT operations are already
 * implemented in the counter-cli/src/api.ts file.
 * 
 * To use these functions, you'll need to:
 * 1. Import the functions from the api.ts file
 * 2. Deploy or join a contract first
 * 3. Call the functions with the deployed contract instance
 */

import { mintDIDzNFT, joinCombinedContract, deployCombinedContract } from '../../../counter-cli/src/api'
import type { CombinedContractContract, DeployedCombinedContractContract } from '../../../counter-cli/src/common-types';
import { randomBytes } from 'crypto';

/** Deploy a new contract */
export async function deployNewContract(
  walletManager: BrowserWalletManager,
  privateState: PrivateState<CombinedContractContract>,
  ownerAddress: string
): Promise<ContractAddress> {
    const providers = await walletManager.getCombinedContractProviders();
    if (!providers) {
        throw new Error('Wallet not connected');
    }

    // random secret key
    const ownerAddressBytes = hexStringToBytes32(ownerAddress);
    const ownerSecretKey = randomBytes(32);

    const contract = await deployCombinedContract(providers, privateState, ownerSecretKey, ownerAddressBytes);
    return contract.deployTxData.public.contractAddress;
}

/** Join an existing contract */
export async function joinExistingContract(
  walletManager: BrowserWalletManager,
  contractAddress: ContractAddress
): Promise<DeployedCombinedContractContract> {
  const providers = await walletManager.getCombinedContractProviders();
  if (!providers) {
    throw new Error('Wallet not connected');
  }
  const contract = await joinCombinedContract(providers, contractAddress);
  return contract;
}

/** Mint an NFT */

/**
 * Example of how to use the existing mintDIDzNFT function from api.ts
 * 
 * Usage example:
 * ```typescript
 * import { mintDIDzNFT } from '../../counter-cli/src/api';
 * 
 * // First you need a deployed contract instance
 * const deployedContract = await deployCombinedContract(providers, ...);
 * 
 * // Then you can mint an NFT
 * const result = await mintDIDzNFT(deployedContract, metadataHash, didBytes);
 * ```
 */
export async function mintNFT(
  walletManager: BrowserWalletManager,
  contractAddress: ContractAddress,
  metadataHash: Uint8Array,
  did: Uint8Array
): Promise<FinalizedTxData> {
  const providers = await walletManager.getCombinedContractProviders();
  if (!providers) {
    throw new Error('Wallet not connected');
  }

  const contract = await joinCombinedContract(providers, contractAddress);
  return await mintDIDzNFT(contract, metadataHash, did);
}

/**
 * Example of how to use the existing getDIDzNFT function from api.ts
 */
export async function getNFTExample(
  walletManager: BrowserWalletManager,
  contractAddress: ContractAddress,
  nftId: number
): Promise<{
  ownerAddress: Uint8Array;
  metadataHash: Uint8Array;
  did: Uint8Array;
}> {
  const providers = await walletManager.getProviders();
  if (!providers) {
    throw new Error('Wallet not connected');
  }

  // This is where you would import and use the actual api.ts functions
  throw new Error(`
    To implement this:
    1. Import { getDIDzNFT, joinCombinedContract } from '../../counter-cli/src/api'
    2. Join the contract: const contract = await joinCombinedContract(providers, contractAddress)
    3. Call the function: return await getDIDzNFT(contract, nftId)
  `);
}


/**
 * Available NFT functions from api.ts:
 * 
 * ✅ mintDIDzNFT(combinedContract, metadataHash, did) - Mint a new DIDz NFT
 * ✅ getDIDzNFT(combinedContract, nftId) - Get NFT data by ID
 * ✅ getDIDzNFTOwner(combinedContract, nftId) - Get NFT owner DID  
 * ✅ getDIDzNFTMetadataHash(combinedContract, nftId) - Get NFT metadata hash
 * ❌ burnDIDzNFT(combinedContract, nftId) - Not implemented in contract
 * ❌ transferDIDzNFT(combinedContract, nftId, newOwnerDID) - Not implemented in contract
 * 
 * Contract deployment functions:
 * ✅ deployCombinedContract(providers, privateState, ownerSecretKey, ownerAddress)
 * ✅ joinCombinedContract(providers, contractAddress)
 */ 