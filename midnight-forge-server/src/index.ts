import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import { getServerConfig, ServerConfig } from './config.js';
// import logger from './logger.js';
import { CombinedContractContract, CombinedContractPrivateStateId, DeployContractRequest, MintNFTRequest, type ApiResponse, type CombinedContractProviders, type HealthCheckResponse } from './types.js';
import { SimpleWalletService } from './services/simpleWalletService.js';
import { ContractService } from './services/contractService.js';
import * as Rx from 'rxjs';


import {
  CombinedContract,
  witnesses,
} from '../../nft-contract/dist/index.js';

// load env file
import dotenv from 'dotenv';
import { Wallet } from '@midnight-ntwrk/wallet-api';
import { Resource } from '@midnight-ntwrk/wallet';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
// import { fromHex } from '@midnight-ntwrk/midnight-js-utils';
import { buildFreshWallet, buildWalletAndWaitForFunds, configureCombinedContractProviders, getWalletFromSeed } from './api.js';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { EnhancedNFTData, fetchMetadataFromIPFS, verifyMetadataHash } from './utils.js';
import { encodeCoinPublicKey, encodeContractAddress } from '@midnight-ntwrk/compact-runtime';
import path from 'path';
import logger from './logger.js';

dotenv.config();

let config: ServerConfig = getServerConfig();
const app = express();

// Initialize services
const walletService = new SimpleWalletService();
let contractService: ContractService | null = null;
let wallet: Wallet & Resource | null = null;

// Initialize wallet service on startup
const initializeServices = async () => {
  try {
    config = getServerConfig();

    if (!config.walletSeed) {
      throw new Error('WALLET_SEED environment variable is required');
    }
    
    await walletService.initialize(config.midnight, config.walletSeed, config.walletFilename);
    
    wallet = await walletService.getWalletFromSeed(config);

    // console.log('Wallet object created:', !!wallet);
    // console.log('Wallet methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(wallet)));

    const state = await Rx.firstValueFrom(wallet.state());
    console.log('Raw wallet state:', state);
    console.log('State type:', typeof state);
    console.log('State keys:', state ? Object.keys(state) : 'null/undefined');

    // Get providers and initialize contract service
    console.log('=== DEBUG ContractService Initialization ===');
    const providers = walletService.getProviders();
    // console.log('Providers from walletService:', providers);
    // console.log('Providers type:', typeof providers);
    // console.log('Providers keys:', providers ? Object.keys(providers) : 'null/undefined');
    
    contractService = new ContractService(providers, wallet);
    console.log('ContractService created:', !!contractService);
    console.log('=== END ContractService DEBUG ===');

    // expect(this.wallet).not.toBeNull();


    // check if state is not null or undefined so that we notify succcessfully initialized
    if (state === null || state === undefined) {
      throw new Error('Wallet state is null or undefined');
    }

    console.info('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// Start initialization (non-blocking)
initializeServices();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.info(`${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const healthResponse: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    network: {
      indexer: config.midnight.indexer,
      node: config.midnight.node,
      proofServer: config.midnight.proofServer,
    },
    wallet: {
      connected: walletService.isInitialized(),
      synced: walletService.isInitialized(),
    },
    contractService: {
      initialized: !!contractService,
      providers: contractService ? contractService.getProviders() : {} as CombinedContractProviders,
    },
  };
  
  res.json(healthResponse);
});

export const combinedContractInstance: CombinedContractContract = new CombinedContract.Contract(witnesses);

// Contract deployment endpoint
app.post('/api/deploy-contract', async (req: Request, res: Response) => {
  try {
    const { ownerSecretKey, ownerAddress } : DeployContractRequest = req.body;
    
    if (!ownerSecretKey || !ownerAddress) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: ownerSecretKey, ownerAddress',
      };
      return res.status(400).json(response);
    }

    if (!contractService) {
      const response: ApiResponse = {
        success: false,
        error: 'Contract service not initialized. Please wait for wallet initialization to complete.',
      };
      return res.status(503).json(response);
    }

    // if (!wallet) {
    //   const response: ApiResponse = {
    //     success: false,
    //     error: 'Wallet not initialized. Please wait for wallet initialization to complete.',
    //   };
    //   return res.status(503).json(response);
    // }

    // Build wallet and wait for funds
    // const wallet = await getWalletFromSeed(config.walletSeed, config.midnight);

    const wallet = await buildFreshWallet(config);

    console.info('Wallet:', wallet);

    // Call contract deployment service
    console.info('Deploying counter contract...');
    const state = await Rx.firstValueFrom(wallet.state());

    console.info('State:', state);
    console.info('Owner address:', state.address);

    const ownerAddressBytes = encodeCoinPublicKey(state.coinPublicKeyLegacy);
    
    const ownerSecretKeyBytes = fromHex(ownerSecretKey);


    console.info('Using actual wallet public key as owner address:', state.address);
    console.info('Owner address bytes length:', ownerAddressBytes.length);  
    
    // // Verify they're exactly 32 bytes
    // if (ownerSecretKeyBytes.length !== 32) throw new Error(`Secret key must be 32 bytes, got ${ownerSecretKeyBytes.length}`);
    // if (ownerAddressBytes.length !== 32) throw new Error(`Address must be 32 bytes, got ${ownerAddressBytes.length}`);

    // // Let's use the genesis wallet for now to deploy the contract
    // const genesisWallet = await walletService.getWalletFromSeed(config);
    // const genesisState = await Rx.firstValueFrom(genesisWallet.state());
    // console.log('Genesis wallet state:', genesisState);
    // console.log('Genesis wallet state type:', typeof genesisState);
    // console.log('Genesis wallet state keys:', genesisState ? Object.keys(genesisState) : 'null/undefined');

    const providers = await configureCombinedContractProviders(wallet, config.midnight);
    
    console.info('Deploying contract...');
    const counterContract = await deployContract(providers, {
      contract: combinedContractInstance,
      privateStateId: CombinedContractPrivateStateId,
      initialPrivateState: { privateValue: 0 },
      args: [ownerSecretKeyBytes, ownerAddressBytes],
    });
    
    const contractAddress = counterContract.deployTxData.public.contractAddress;
    logger.info(`Deployed contract at address: ${contractAddress}`);
    
    return res.status(200).json({
      success: true,
      data: {
        contractAddress: contractAddress,
        message: 'Contract deployed successfully',
      },
    });
  } catch (error) {
    logger.error('Error in deploy-contract endpoint:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return res.status(500).json(response);
  }
});

// NFT minting endpoint
app.post('/api/mint-nft', async (req: Request, res: Response) => {
  try {
    logger.info('Raw request body:', req.body);
    const { contractAddress, metadataHash, did } : MintNFTRequest = req.body;
    
    logger.info('Extracted values:', {
      contractAddress: contractAddress,
      contractAddressType: typeof contractAddress,
      contractAddressLength: contractAddress?.length,
      metadataHash: metadataHash?.substring(0, 8) + '...',
      did: did?.substring(0, 8) + '...'
    });
    
    if (!contractAddress || !metadataHash || !did) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: contractAddress, metadataHash, did',
      };
      return res.status(400).json(response);
    }

    if (!contractService) {
      const response: ApiResponse = {
        success: false,
        error: 'Contract service not initialized. Please wait for wallet initialization to complete.',
      };
      return res.status(503).json(response);
    }

    // Build wallet and wait for funds
    const wallet = await buildFreshWallet(config);

    // Call NFT minting service
    logger.info('Minting DIDz NFT...');
    
    // Convert hex strings to bytes (only for metadata and DID, not contract address)
    const metadataHashBytes = fromHex(metadataHash);
    const didBytes = fromHex(did);
    
    // Verify they're exactly 32 bytes
    if (metadataHashBytes.length !== 32) throw new Error(`Metadata hash must be 32 bytes, got ${metadataHashBytes.length}`);
    if (didBytes.length !== 32) throw new Error(`DID must be 32 bytes, got ${didBytes.length}`);

    const providers = await configureCombinedContractProviders(wallet, config.midnight);
    
    console.info('Finding deployed contract...');
    console.info('Contract address:', contractAddress);
    console.info('Contract address length:', contractAddress.length);
    console.info('Contract address bytes:', contractAddress.length / 2);
    
    // Find the deployed contract using findDeployedContract
    // Note: contractAddress is used as-is (string), not converted to bytes
    const foundContract = await findDeployedContract(providers, {
      contractAddress, // Use contract address directly as string
      contract: combinedContractInstance,
      privateStateId: CombinedContractPrivateStateId,
      initialPrivateState: { privateValue: 0 },
    });

    console.log('Found contract:', foundContract, null, 2);

    console.info('Calling mintDIDzNFT circuit...');
    // Call the mintDIDzNFT circuit
    // Note: The contract expects DID and NFTMetadataHash structs with bytes field
    const mintResult = await foundContract.callTx.mintDIDzNFT(
      { bytes: didBytes },        // recipientDID: DID
      { bytes: metadataHashBytes } // metadataHash: NFTMetadataHash
    );
    
    const nftId = Number(mintResult.private.result);
    const transactionId = mintResult.public.txId;
    
    console.info(`Minted NFT with ID: ${nftId}, Transaction: ${transactionId}`);
    
    return res.status(200).json({
      success: true,
      data: {
        nftId: nftId,
        transactionId: transactionId,
        message: 'NFT minted successfully',
      },
    });
  } catch (error) {
    console.error('Error in mint-nft endpoint:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return res.status(500).json(response);
  }
});



// List all NFTs for a contract endpoint
app.get('/api/nfts/:contractAddress', async (req: Request, res: Response) => {
  // Set a timeout for the entire operation (5 minutes - very tolerant for testnet)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out after 5 minutes')), 300000);
  });

  try {
    // Race between the actual operation and timeout
    const result = await Promise.race([
      timeoutPromise,
      (async () => {
    const { contractAddress } = req.params;
    const { includeMetadata } = req.query; // Optional query parameter to fetch IPFS metadata
    
    if (!contractAddress) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required parameter: contractAddress',
      };
      return res.status(400).json(response);
    }

    if (!contractService) {
      const response: ApiResponse = {
        success: false,
        error: 'Contract service not initialized. Please wait for wallet initialization to complete.',
      };
      return res.status(503).json(response);
    }

    // Build wallet and configure providers
    const wallet = await buildFreshWallet(config);
    const providers = await configureCombinedContractProviders(wallet, config.midnight);
    
    console.info('Finding deployed contract for NFT listing...');
    console.info('Contract address:', contractAddress);
    
    // Find the deployed contract using findDeployedContract
    const foundContract = await findDeployedContract(providers, {
      contractAddress, // Use contract address directly as string
      contract: combinedContractInstance,
      privateStateId: CombinedContractPrivateStateId,
      initialPrivateState: { privateValue: 0 },
    });

    console.info('Getting current counter to determine total NFTs...');
    // Get the current counter to know how many NFTs exist
    const counterResult = await foundContract.callTx.getCounter();
    const totalNFTs = Number(counterResult.private.result);
    
    console.info(`Total NFTs minted: ${totalNFTs}`);
    
    // Early return for empty contracts
    if (totalNFTs === 0) {
      console.info('No NFTs found, returning empty list');
      const response = {
        success: true,
        data: {
          nfts: [],
          totalCount: 0,
          maxNftId: 0,
          message: 'NFTs retrieved successfully',
        },
      };
      return res.status(200).json(response);
    }
    
    const nfts = [];
    
    // Fetch NFTs in parallel for better performance, but limit concurrency to avoid overwhelming the system
    console.info(`Fetching ${totalNFTs} NFTs with controlled concurrency...`);
    const BATCH_SIZE = 5; // Process 5 NFTs at a time to balance speed and resource usage
    
    for (let i = 1; i <= totalNFTs; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE - 1, totalNFTs);
      console.info(`Processing NFTs ${i} to ${batchEnd}...`);
      
      const batchPromises = [];
      for (let nftId = i; nftId <= batchEnd; nftId++) {
        const nftPromise = foundContract.callTx.getDIDzNFTFromId(BigInt(nftId))
          .then(async nftResult => {
            const nftData = nftResult.private.result;
            const baseNftInfo: EnhancedNFTData = {
              nftId,
              ownerAddress: toHex(nftData.ownerAddress),
              metadataHash: toHex(nftData.metadataHash),
              did: toHex(nftData.did),
            };

            // If metadata fetching is requested, attempt to decode it
            if (includeMetadata === 'true') {
              console.log(`Attempting to fetch metadata for NFT ${nftId}...`);
              
              // Note: We don't have the IPFS URI stored on-chain in this contract version
              // The metadata hash is just a verification hash, not a pointer to IPFS
              // For now, we'll just indicate that metadata fetching is not available
              // In a future version, we could store IPFS CIDs on-chain or use a mapping service
              
              baseNftInfo.metadataVerified = false;
              // Don't assign undefined explicitly - leave properties unset
              
              console.log(`Metadata fetching not available for NFT ${nftId} - no IPFS URI stored on-chain`);
            }

            return baseNftInfo;
          })
          .catch(error => {
            console.error(`Error fetching NFT ${nftId} after retries:`, error);
            console.error(`Error details for NFT ${nftId}:`, {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              type: typeof error,
              error: error
            });
            return null; // Return null for missing NFTs
          });
        
        batchPromises.push(nftPromise);
      }
      
      // Wait for this batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Filter out null results and add to main array
      const validBatchNfts = batchResults.filter(nft => nft !== null);
      nfts.push(...validBatchNfts);
      
      console.info(`Batch complete. Retrieved ${validBatchNfts.length}/${batchResults.length} NFTs from this batch.`);
    }
    
    console.info(`Successfully retrieved ${nfts.length} NFTs out of ${totalNFTs} total`);
    
    const response = {
      success: true,
      data: {
        nfts,
        totalCount: nfts.length,
        maxNftId: totalNFTs,
        message: 'NFTs retrieved successfully',
      },
    };
    
    return res.status(200).json(response);
      })() // Close the async function
    ]); // Close Promise.race
    
    return result;
  } catch (error) {
    console.error('Error in list-nfts endpoint:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return res.status(500).json(response);
  }
});

// Get NFT endpoint
app.get('/api/nft/:contractAddress/:nftId', async (req: Request, res: Response) => {
  try {
    const { contractAddress, nftId } = req.params;
    
    if (!contractAddress || !nftId) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required parameters: contractAddress, nftId',
      };
      return res.status(400).json(response);
    }

    if (!contractService) {
      const response: ApiResponse = {
        success: false,
        error: 'Contract service not initialized. Please wait for wallet initialization to complete.',
      };
      return res.status(503).json(response);
    }

    // Build wallet and configure providers
    const wallet = await buildFreshWallet(config);
    const providers = await configureCombinedContractProviders(wallet, config.midnight);
    
    console.info('Finding deployed contract for NFT viewing...');
    console.info('Contract address:', contractAddress);
    console.info('NFT ID:', nftId);
    
    // Find the deployed contract using findDeployedContract
    const foundContract = await findDeployedContract(providers, {
      contractAddress, // Use contract address directly as string
      contract: combinedContractInstance,
      privateStateId: CombinedContractPrivateStateId,
      initialPrivateState: { privateValue: 0 },
    });

    console.info('Calling getDIDzNFTFromId circuit...');
    // Call the getDIDzNFTFromId circuit to get NFT details
    const nftResult = await foundContract.callTx.getDIDzNFTFromId(
      BigInt(nftId) // Convert string nftId to Field (BigInt)
    );
    
    const nftData = nftResult.private.result;
    const transactionId = nftResult.public.txId;
    
    console.info(`Retrieved NFT ${nftId}:`, nftData);
    
    // Convert bytes to hex strings for frontend consumption
    const response = {
      success: true,
      data: {
        nft: {
          nftId: parseInt(nftId),
          ownerAddress: toHex(nftData.ownerAddress),
          metadataHash: toHex(nftData.metadataHash),
          did: toHex(nftData.did),
        },
        transactionId: transactionId,
        message: 'NFT retrieved successfully',
      },
    };
    
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Error in get-nft endpoint:', error);
    logger.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return res.status(500).json(response);
  }
});

// Get contract status endpoint
app.get('/api/contract-status/:contractAddress', async (req: Request, res: Response) => {
  try {
    const { contractAddress } = req.params;
    
    if (!contractAddress) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required parameter: contractAddress',
      };
      return res.status(400).json(response);
    }

    // TODO: Call contract status service
    
    // Placeholder response
    const response: ApiResponse = {
      success: false,
      error: 'Contract status not yet implemented - wallet initialization required',
    };
    
    return res.status(501).json(response);
  } catch (error) {
    logger.error('Error in contract-status endpoint:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return res.status(500).json(response);
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  const response: ApiResponse = {
    success: false,
    error: 'Internal server error',
  };
  res.status(500).json(response);
});

// 404 handler
app.use((req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: 'Endpoint not found',
  };
  res.status(404).json(response);
});

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Midnight Forge Server started on http://${config.ip}:${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Network: ${config.midnight.indexer}`);
});

// Set server timeout for contract operations
server.timeout = 360000; // 6 minutes - very tolerant for testnet POC
server.keepAliveTimeout = 310000; // Slightly longer than client timeout
server.headersTimeout = 320000; // Slightly longer than keepAliveTimeout

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await walletService.cleanup();
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await walletService.cleanup();
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app; 