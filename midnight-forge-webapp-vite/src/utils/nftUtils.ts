// import { type BrowserWalletManager } from '../contexts/WalletManager';
// import { fromHex } from '@midnight-ntwrk/midnight-js-utils';


/** Deploy a new contract */
// export async function deployNewContract(
//   walletManager: BrowserWalletManager,
//   privateState: PrivateState<CombinedContractContract>,
//   ownerAddress: string
// ): Promise<ContractAddress> {
//     const providers = await walletManager.getCombinedContractProviders();
//     if (!providers) {
//         throw new Error('Wallet not connected');
//     }

//     // random secret key
//     const ownerAddressBytes = fromHex(ownerAddress);
//     const ownerSecretKey = randomBytes(32);

//     const contract = await deployCombinedContract(providers, privateState, ownerSecretKey, ownerAddressBytes);
//     return contract.deployTxData.public.contractAddress;
// }

// /** Join an existing contract */
// export async function joinExistingContract(
//   walletManager: BrowserWalletManager,
//   contractAddress: ContractAddress
// ): Promise<DeployedCombinedContractContract> {
//   const providers = await walletManager.getCombinedContractProviders();
//   if (!providers) {
//     throw new Error('Wallet not connected');
//   }
//   const contract = await joinCombinedContract(providers, contractAddress);
//   return contract;
// }

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
// export async function mintNFT(
//   walletManager: BrowserWalletManager,
//   contractAddress: ContractAddress,
//   metadataHash: Uint8Array,
//   did: Uint8Array
// ): Promise<FinalizedTxData> {
//   const providers = await walletManager.getCombinedContractProviders();
//   if (!providers) {
//     throw new Error('Wallet not connected');
//   }

//   const contract = await joinCombinedContract(providers, contractAddress);
//   return await mintDIDzNFT(contract, metadataHash, did);
// }

/**
 * Example of how to use the existing getDIDzNFT function from api.ts
 */
// export async function getNFTExample(
//   walletManager: BrowserWalletManager): Promise<{
//   ownerAddress: Uint8Array;
//   metadataHash: Uint8Array;
//   did: Uint8Array;
// }> {
//   const providers = await walletManager.getProviders();
//   if (!providers) {
//     throw new Error('Wallet not connected');
//   }

//   // This is where you would import and use the actual api.ts functions
//   throw new Error(`
//     To implement this:
//     1. Import { getDIDzNFT, joinCombinedContract } from '../../counter-cli/src/api'
//     2. Join the contract: const contract = await joinCombinedContract(providers, contractAddress)
//     3. Call the function: return await getDIDzNFT(contract, nftId)
//   `);
// }


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