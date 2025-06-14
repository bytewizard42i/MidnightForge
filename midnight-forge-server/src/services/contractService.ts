import { toHex, fromHex } from '@midnight-ntwrk/midnight-js-utils';
import type { 
  DeployContractRequest, 
  DeployContractResponse, 
  MintNFTRequest, 
  MintNFTResponse,
  GetNFTRequest,
  GetNFTResponse,
  ContractStatusRequest,
  ContractStatusResponse,
  CombinedContractProviders,
  ServerWallet,
  DeployedCombinedContractContract
} from '../types.js';
import logger from '../logger.js';

// Import functions from counter-cli - we'll adjust paths as needed
import { 
  deployCombinedContract,
  joinCombinedContract,
  mintDIDzNFT,
  getDIDzNFT,
  getCombinedContractOwnerKey,
  getCombinedContractOwnerAddress
} from '../../../counter-cli/src/api.js';

export class ContractService {
  private providers: CombinedContractProviders;
  private wallet: ServerWallet;

  constructor(providers: CombinedContractProviders, wallet: ServerWallet) {
    this.providers = providers;
    this.wallet = wallet;
  }

  async deployContract(request: DeployContractRequest): Promise<DeployContractResponse> {
    try {
      logger.info('Starting contract deployment...');
      
      const ownerSecretKey = fromHex(request.ownerSecretKey);
      const ownerAddress = fromHex(request.ownerAddress);
      
      const privateState = { privateValue: 0 };
      
      const deployedContract = await deployCombinedContract(
        this.providers,
        privateState,
        ownerSecretKey,
        ownerAddress
      );

      const contractAddress = deployedContract.deployTxData.public.contractAddress;
      const transactionId = deployedContract.deployTxData.public.txId;

      logger.info(`Contract deployed successfully at address: ${contractAddress}`);
      
      return {
        success: true,
        contractAddress,
        transactionId,
      };
    } catch (error) {
      logger.error('Contract deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
      };
    }
  }

  async mintNFT(request: MintNFTRequest): Promise<MintNFTResponse> {
    try {
      logger.info(`Minting NFT for contract: ${request.contractAddress}`);
      
      const combinedContract = await joinCombinedContract(
        this.providers,
        request.contractAddress
      );

      const metadataHash = fromHex(request.metadataHash);
      const did = fromHex(request.did);

      const finalizedTx = await mintDIDzNFT(combinedContract, metadataHash, did);
      
      logger.info(`NFT minted successfully. Transaction ID: ${finalizedTx.txId}`);
      
      return {
        success: true,
        transactionId: finalizedTx.txId,
      };
    } catch (error) {
      logger.error('NFT minting failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown minting error',
      };
    }
  }

  async getNFT(request: GetNFTRequest): Promise<GetNFTResponse> {
    try {
      logger.info(`Getting NFT ${request.nftId} from contract: ${request.contractAddress}`);
      
      const combinedContract = await joinCombinedContract(
        this.providers,
        request.contractAddress
      );

      const nftData = await getDIDzNFT(combinedContract, request.nftId);
      
      if (!nftData) {
        return {
          success: false,
          error: 'NFT not found',
        };
      }

      return {
        success: true,
        nft: {
          owner: toHex(nftData.ownerAddress),
          metadataHash: toHex(nftData.metadataHash),
          did: toHex(nftData.did),
        },
      };
    } catch (error) {
      logger.error('Failed to get NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting NFT',
      };
    }
  }

  async getContractStatus(request: ContractStatusRequest): Promise<ContractStatusResponse> {
    try {
      logger.info(`Getting status for contract: ${request.contractAddress}`);
      
      const combinedContract = await joinCombinedContract(
        this.providers,
        request.contractAddress
      );

      const ownerKey = await getCombinedContractOwnerKey(
        this.providers,
        combinedContract.deployTxData.public.contractAddress
      );

      const ownerAddress = await getCombinedContractOwnerAddress(
        this.providers,
        combinedContract.deployTxData.public.contractAddress
      );

      return {
        success: true,
        ...(ownerKey && { ownerKey }),
        ...(ownerAddress && { ownerAddress: toHex(ownerAddress) }),
      };
    } catch (error) {
      logger.error('Failed to get contract status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting contract status',
      };
    }
  }
} 