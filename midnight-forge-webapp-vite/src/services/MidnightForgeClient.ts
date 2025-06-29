/**
 * MidnightForgeClient - TypeScript client for midnight-forge-server API
 * 
 * Provides type-safe methods to interact with all server endpoints:
 * - Health checks
 * - Contract deployment
 * - NFT operations
 * - Contract status queries
 */

// Types matching the server's API contract
export interface DeployContractRequest {
  ownerSecretKey: string; // hex string
  ownerAddress: string;   // hex string
}

export interface DeployContractResponse {
  success: boolean;
  data?: {
    contractAddress: string;
    message: string;
  };
  error?: string;
}

export interface MintNFTRequest {
  contractAddress: string;
  metadataHash: string; // hex string
  metadataCID: string;  // IPFS CID string
  did: string;          // hex string
}

export interface MintNFTResponse {
  success: boolean;
  data?: {
    transactionId: string;
    nftId: number;
  };
  error?: string;
}

export interface GetNFTResponse {
  success: boolean;
  data?: {
    nft: {
      nftId: number;
      ownerAddress: string;
      metadataHash: string;
      did: string;
    };
    transactionId: string;
    message: string;
  };
  error?: string;
}

export interface ListNFTsResponse {
  success: boolean;
  data?: {
    nfts: Array<{
      nftId: number;
      ownerAddress: string;
      metadataHash: string;
      metadataCID: string;
      did: string;
      metadata?: {
        name: string;
        description: string;
        image: string;
        attributes: Array<{
          trait_type: string;
          value: string | number;
        }>;
      };
      metadataUri?: string;
      metadataVerified?: boolean;
    }>;
    totalCount: number;
    maxNftId: number;
    message: string;
  };
  error?: string;
}

export interface ContractStatusResponse {
  success: boolean;
  data?: {
    ownerKey: string;
    ownerAddress: string;
    status: string;
  };
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
    providers: any;
  };
}

export interface MidnightForgeClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class MidnightForgeClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(config: MidnightForgeClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3001';
    this.timeout = config.timeout || 300000; // 5 minutes - very tolerant for testnet POC
    this.retries = config.retries || 1;
  }

  /**
   * Generic HTTP request method with error handling and retries
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    currentRetryCount = 0,
    maxRetries?: number
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      const effectiveMaxRetries = maxRetries !== undefined ? maxRetries : this.retries;
      if (currentRetryCount < effectiveMaxRetries && this.shouldRetry(error)) {
        console.warn(`Request failed, retrying (${currentRetryCount + 1}/${effectiveMaxRetries}):`, error);
        await this.delay(1000 * Math.pow(2, currentRetryCount)); // Exponential backoff
        return this.request<T>(endpoint, options, currentRetryCount + 1, maxRetries);
      }

      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Determine if an error is worth retrying
   */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // Retry on network errors, timeouts, and server errors (5xx)
      return (
        error.name === 'AbortError' ||
        error.message.includes('fetch') ||
        error.message.includes('5')
      );
    }
    return false;
  }

  /**
   * Simple delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health Check - Check if the server is running and services are initialized
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/health', {
      method: 'GET',
    });
  }

  /**
   * Deploy Contract - Deploy a new combined contract to the blockchain
   */
  async deployContract(request: DeployContractRequest): Promise<DeployContractResponse> {
    // No retries for deployment to avoid duplicate contracts
    return this.request<DeployContractResponse>('/api/deploy-contract', {
      method: 'POST',
      body: JSON.stringify(request),
    }, 0, 0); // Force no retries
  }

  /**
   * Mint NFT - Mint a new DIDz NFT in the specified contract
   */
  async mintNFT(request: MintNFTRequest): Promise<MintNFTResponse> {
    return this.request<MintNFTResponse>('/api/mint-nft', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get NFT - Retrieve NFT details by contract address and NFT ID
   */
  async getNFT(contractAddress: string, nftId: number): Promise<GetNFTResponse> {
    return this.request<GetNFTResponse>(`/api/nft/${contractAddress}/${nftId}`, {
      method: 'GET',
    });
  }

  /**
   * List NFTs - Retrieve all NFTs in a contract
   */
  async listNFTs(contractAddress: string, maxRetries: number = 2): Promise<ListNFTsResponse> {
    // Use longer timeout for list operations as they may need to fetch many NFTs
    const url = `${this.baseUrl}/api/nfts/${contractAddress}`;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes for list operations

      try {
        console.log(`Attempting to list NFTs (attempt ${attempt}/${maxRetries + 1})...`);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Successfully retrieved NFT list on attempt ${attempt}`);
        return data as ListNFTsResponse;
      } catch (error) {
        clearTimeout(timeoutId);
        
        const isLastAttempt = attempt === maxRetries + 1;
        const shouldRetry = this.shouldRetry(error) && !isLastAttempt;
        
        if (shouldRetry) {
          const delay = 2000 * Math.pow(1.5, attempt - 1); // Exponential backoff
          console.warn(`List NFTs attempt ${attempt} failed, retrying in ${Math.round(delay)}ms:`, error instanceof Error ? error.message : error);
          await this.delay(delay);
        } else {
          throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    throw new Error('All attempts failed');
  }

  /**
   * Get Contract Status - Get the current status and details of a deployed contract
   */
  async getContractStatus(contractAddress: string): Promise<ContractStatusResponse> {
    return this.request<ContractStatusResponse>(`/api/contract-status/${contractAddress}`, {
      method: 'GET',
    });
  }

  /**
   * Wait for Service Readiness - Polls health endpoint until services are ready
   */
  async waitForServiceReady(maxWaitMs = 60000, pollIntervalMs = 2000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const health = await this.healthCheck();
        
        if (
          health.status === 'healthy' &&
          health.wallet.connected &&
          health.contractService.initialized
        ) {
          console.log('✅ Midnight Forge Server is ready!');
          return;
        }
        
        console.log('⏳ Waiting for services to initialize...', {
          wallet: health.wallet.connected,
          contractService: health.contractService.initialized,
        });
      } catch (error) {
        console.log('⏳ Server not yet available, waiting...');
      }
      
      await this.delay(pollIntervalMs);
    }
    
    throw new Error(`Service did not become ready within ${maxWaitMs}ms`);
  }

  /**
   * Batch Operations - Execute multiple operations with error handling
   */
  async deployAndMintBatch(
    deployRequest: DeployContractRequest,
    mintRequests: Omit<MintNFTRequest, 'contractAddress'>[]
  ): Promise<{
    deployResult: DeployContractResponse;
    mintResults: MintNFTResponse[];
    errors: string[];
  }> {
    const errors: string[] = [];
    
    // Deploy contract first
    const deployResult = await this.deployContract(deployRequest);
    
    if (!deployResult.success || !deployResult.data?.contractAddress) {
      throw new Error(`Contract deployment failed: ${deployResult.error}`);
    }
    
    const contractAddress = deployResult.data.contractAddress;
    console.log(`✅ Contract deployed at: ${contractAddress}`);
    
    // Mint NFTs in sequence
    const mintResults: MintNFTResponse[] = [];
    
    for (const [index, mintRequest] of mintRequests.entries()) {
      try {
        const result = await this.mintNFT({
          ...mintRequest,
          contractAddress,
        });
        
        mintResults.push(result);
        
        if (result.success) {
          console.log(`✅ NFT ${index + 1} minted successfully`);
        } else {
          errors.push(`NFT ${index + 1} mint failed: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = `NFT ${index + 1} mint error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        mintResults.push({ success: false, error: errorMsg });
      }
    }
    
    return { deployResult, mintResults, errors };
  }
}

// Export a default instance for convenience
export const midnightForgeClient = new MidnightForgeClient();

// Export factory function for custom configuration
export const createMidnightForgeClient = (config: MidnightForgeClientConfig) => 
  new MidnightForgeClient(config); 