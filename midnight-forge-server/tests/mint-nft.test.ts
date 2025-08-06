import { describe, it, expect, beforeAll } from 'vitest';
import fetch from 'node-fetch';
import { randomBytes } from 'crypto';

// Test configuration
const SERVER_URL = 'http://localhost:3001';
const TIMEOUT = 120000; // 2 minutes for blockchain operations

// Helper function to convert bytes to hex
const toHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Helper function to generate random 32-byte hex string
const generateRandomHex32 = (): string => {
  return toHex(randomBytes(32));
};

// Helper function to wait for server to be ready
const waitForServer = async (maxAttempts = 30): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${SERVER_URL}/health`);
      if (response.ok) {
        const health: any = await response.json();
        if (health.status === 'healthy') {
          console.log('✅ Server is ready');
          return;
        }
      }
    } catch (error) {
      // Server not ready yet
    }
    
    console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Server failed to start within timeout period');
};

// Helper function to deploy a contract for testing
const deployTestContract = async (): Promise<string> => {
  const deployResponse = await fetch(`${SERVER_URL}/api/deploy-contract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ownerSecretKey: '55ddac2bd7414e6ca90dcf42126b2d97cd4ddd72231bea50bbcffbfa826d8f0e',
      ownerAddress: 'mn_shield-cpk_test1klc0mygks6uqckn4j5ss4pguna3tjmgz9jhx6ksn9y0mckgj5n8qkvwc2l',
    }),
  });

  expect(deployResponse.ok).toBe(true);
  const deployResult: any = await deployResponse.json();
  expect(deployResult.success).toBe(true);
  expect(deployResult.data?.contractAddress).toBeDefined();
  
  console.log(`📄 Test contract deployed at: ${deployResult.data.contractAddress}`);
  return deployResult.data.contractAddress;
};

describe('Mint NFT Endpoint Tests', () => {
  let contractAddress: string;

  beforeAll(async () => {
    console.log('🚀 Starting mint-nft endpoint tests...');
    
    // Wait for server to be ready
    await waitForServer();
    
    // Deploy a test contract
    contractAddress = await deployTestContract();
  }, TIMEOUT);

  describe('POST /api/mint-nft', () => {
    it('should successfully mint an NFT with valid parameters', async () => {
      const metadataHash = generateRandomHex32();
      const did = generateRandomHex32();

      console.log(`🎨 Minting NFT with metadata: ${metadataHash.substring(0, 8)}...`);
      console.log(`🔍 Contract address in test: "${contractAddress}"`);
      console.log(`🔍 Contract address length: ${contractAddress?.length}`);
      console.log(`🔍 Contract address type: ${typeof contractAddress}`);

      const requestBody = {
        contractAddress: contractAddress,
        metadataHash,
        metadataCID: 'QmTestCIDForNFTMetadata123456789',
        did,
      };
      
      console.log(`🔍 Request body:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result: any = await response.json();
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response result:', result);
      
      expect(response.ok).toBe(true);

      // Verify response structure
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.nftId).toBeDefined();
      expect(typeof result.data.nftId).toBe('number');
      expect(result.data.nftId).toBeGreaterThanOrEqual(1);
      expect(result.data.transactionId).toBeDefined();
      expect(typeof result.data.transactionId).toBe('string');
      expect(result.data.message).toBe('NFT minted successfully');

      console.log(`🎉 Successfully minted NFT with ID: ${result.data.nftId}`);
    }, TIMEOUT);

    it('should fail with missing contractAddress', async () => {
      const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadataHash: generateRandomHex32(),
          metadataCID: 'QmTestCIDForNFTMetadata123456789',
          did: generateRandomHex32(),
        }),
      });

      expect(response.status).toBe(400);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should fail with missing metadataHash', async () => {
      const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          metadataCID: 'QmTestCIDForNFTMetadata123456789',
          did: generateRandomHex32(),
        }),
      });

      expect(response.status).toBe(400);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should fail with missing did', async () => {
      const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          metadataHash: generateRandomHex32(),
          metadataCID: 'QmTestCIDForNFTMetadata123456789',
        }),
      });

      expect(response.status).toBe(400);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should fail with invalid metadataHash length', async () => {
      const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          metadataHash: 'invalid_short_hash',
          metadataCID: 'QmTestCIDForNFTMetadata123456789',
          did: generateRandomHex32(),
        }),
      });

      expect(response.status).toBe(400);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be 32 bytes');
    });

    it('should fail with invalid did length', async () => {
      const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          metadataHash: generateRandomHex32(),
          metadataCID: 'QmTestCIDForNFTMetadata123456789',
          did: 'invalid_short_did',
        }),
      });

      expect(response.status).toBe(400);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be 32 bytes');
    });

    it('should fail with non-existent contract address', async () => {
      const fakeContractAddress = '0x' + '0'.repeat(64);
      
      const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: fakeContractAddress,
          metadataHash: generateRandomHex32(),
          metadataCID: 'QmTestCIDForNFTMetadata123456789',
          did: generateRandomHex32(),
        }),
      });

      expect(response.status).toBe(500);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      // The error message will depend on the blockchain response
      expect(result.error).toBeDefined();
    });

    it('should mint multiple NFTs with different metadata', async () => {
      const nfts = [
        { metadataHash: generateRandomHex32(), did: generateRandomHex32() },
        { metadataHash: generateRandomHex32(), did: generateRandomHex32() },
        { metadataHash: generateRandomHex32(), did: generateRandomHex32() },
      ];

      const results: number[] = [];

      for (const nft of nfts) {
        console.log(`🎨 Minting NFT ${results.length + 1}/3...`);
        
        const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractAddress,
            metadataCID: 'QmTestCIDForNFTMetadata123456789',
            ...nft,
          }),
        });

        expect(response.ok).toBe(true);
        
        const result: any = await response.json();
        expect(result.success).toBe(true);
        expect(result.data.nftId).toBeDefined();
        
        results.push(result.data.nftId);
      }

      // Verify all NFTs have unique IDs
      const uniqueIds = new Set(results);
      expect(uniqueIds.size).toBe(results.length);
      
      // Verify IDs are sequential (assuming they start from 1)
      results.sort((a, b) => a - b);
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThan(results[i - 1]);
      }

      console.log(`🎉 Successfully minted ${results.length} NFTs with IDs: ${results.join(', ')}`);
    }, TIMEOUT);
  });

  // TODO: N/A for now as we are not using the wallet service to mint the NFTs
  describe('Error Handling', () => {
    it.skip('should handle malformed JSON', async () => {
      const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
    });

    it('should handle empty request body', async () => {
      const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });
  });
}); 