/**
 * React Hook for Midnight Forge Server API
 * 
 * Provides reactive state management and convenient methods for interacting
 * with the midnight-forge-server from React components.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  MidnightForgeClient, 
  DeployContractRequest, 
  DeployContractResponse,
  MintNFTRequest,
  MintNFTResponse,
  GetNFTResponse,
  ContractStatusResponse,
  HealthCheckResponse,
  createMidnightForgeClient
} from '../services/MidnightForgeClient';

interface UseMidnightForgeState {
  isLoading: boolean;
  error: string | null;
  serverHealth: HealthCheckResponse | null;
  lastDeployment: DeployContractResponse | null;
}

interface UseMidnightForgeReturn extends UseMidnightForgeState {
  // Core operations
  deployContract: (request: DeployContractRequest) => Promise<DeployContractResponse>;
  mintNFT: (request: MintNFTRequest) => Promise<MintNFTResponse>;
  getNFT: (contractAddress: string, nftId: number) => Promise<GetNFTResponse>;
  getContractStatus: (contractAddress: string) => Promise<ContractStatusResponse>;
  
  // Health and connectivity
  checkHealth: () => Promise<HealthCheckResponse>;
  waitForReady: () => Promise<void>;
  
  // Batch operations
  deployAndMintBatch: (
    deployRequest: DeployContractRequest,
    mintRequests: Omit<MintNFTRequest, 'contractAddress'>[]
  ) => Promise<{
    deployResult: DeployContractResponse;
    mintResults: MintNFTResponse[];
    errors: string[];
  }>;
  
  // State management
  clearError: () => void;
  refresh: () => Promise<void>;
}

export const useMidnightForge = (baseUrl?: string): UseMidnightForgeReturn => {
  const [client] = useState(() => createMidnightForgeClient({ baseUrl }));
  
  const [state, setState] = useState<UseMidnightForgeState>({
    isLoading: false,
    error: null,
    serverHealth: null,
    lastDeployment: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Wrapper for async operations with error handling
  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    loadingState = true
  ): Promise<T> => {
    if (loadingState) setLoading(true);
    clearError();
    
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      throw error;
    } finally {
      if (loadingState) setLoading(false);
    }
  }, [setLoading, clearError, setError]);

  // Health check
  const checkHealth = useCallback(async (): Promise<HealthCheckResponse> => {
    return withErrorHandling(async () => {
      const health = await client.healthCheck();
      setState(prev => ({ ...prev, serverHealth: health }));
      return health;
    });
  }, [client, withErrorHandling]);

  // Wait for server readiness
  const waitForReady = useCallback(async (): Promise<void> => {
    return withErrorHandling(async () => {
      await client.waitForServiceReady();
      // Refresh health after ready
      await checkHealth();
    });
  }, [client, withErrorHandling, checkHealth]);

  // Deploy contract
  const deployContract = useCallback(async (request: DeployContractRequest): Promise<DeployContractResponse> => {
    return withErrorHandling(async () => {
      const result = await client.deployContract(request);
      setState(prev => ({ ...prev, lastDeployment: result }));
      return result;
    });
  }, [client, withErrorHandling]);

  // Mint NFT
  const mintNFT = useCallback(async (request: MintNFTRequest): Promise<MintNFTResponse> => {
    return withErrorHandling(async () => {
      return await client.mintNFT(request);
    });
  }, [client, withErrorHandling]);

  // Get NFT
  const getNFT = useCallback(async (contractAddress: string, nftId: number): Promise<GetNFTResponse> => {
    return withErrorHandling(async () => {
      return await client.getNFT(contractAddress, nftId);
    });
  }, [client, withErrorHandling]);

  // Get contract status
  const getContractStatus = useCallback(async (contractAddress: string): Promise<ContractStatusResponse> => {
    return withErrorHandling(async () => {
      return await client.getContractStatus(contractAddress);
    });
  }, [client, withErrorHandling]);

  // Batch deploy and mint
  const deployAndMintBatch = useCallback(async (
    deployRequest: DeployContractRequest,
    mintRequests: Omit<MintNFTRequest, 'contractAddress'>[]
  ) => {
    return withErrorHandling(async () => {
      const result = await client.deployAndMintBatch(deployRequest, mintRequests);
      setState(prev => ({ ...prev, lastDeployment: result.deployResult }));
      return result;
    });
  }, [client, withErrorHandling]);

  // Refresh all data
  const refresh = useCallback(async (): Promise<void> => {
    await checkHealth();
  }, [checkHealth]);

  // Auto-check health on mount
  useEffect(() => {
    checkHealth().catch(() => {
      // Silent fail on initial health check
      console.log('Initial health check failed - server may not be running');
    });
  }, [checkHealth]);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    serverHealth: state.serverHealth,
    lastDeployment: state.lastDeployment,
    
    // Operations
    deployContract,
    mintNFT,
    getNFT,
    getContractStatus,
    checkHealth,
    waitForReady,
    deployAndMintBatch,
    
    // Utilities
    clearError,
    refresh,
  };
};

// Specialized hooks for specific use cases
export const useMidnightForgeHealth = (baseUrl?: string) => {
  const { serverHealth, checkHealth, isLoading, error } = useMidnightForge(baseUrl);
  
  return {
    health: serverHealth,
    checkHealth,
    isLoading,
    error,
    isHealthy: serverHealth?.status === 'healthy',
    isWalletReady: serverHealth?.wallet.connected && serverHealth?.contractService.initialized,
  };
};

export const useMidnightForgeDeployment = (baseUrl?: string) => {
  const { deployContract, lastDeployment, isLoading, error, clearError } = useMidnightForge(baseUrl);
  
  return {
    deployContract,
    lastDeployment,
    isDeploying: isLoading,
    deploymentError: error,
    clearDeploymentError: clearError,
    lastContractAddress: lastDeployment?.data?.contractAddress,
  };
}; 