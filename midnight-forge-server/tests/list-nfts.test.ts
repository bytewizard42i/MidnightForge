import { describe, it, expect, beforeAll } from 'vitest';
import fetch from 'node-fetch';
import { randomBytes } from 'crypto';
import { generateMetadataHash, NFTMetadata } from '../src/utils.js';

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

// Helper function to generate realistic metadata hash
const generateRealisticMetadataHash = async (nftId: number): Promise<string> => {
  const metadata: NFTMetadata = {
    name: `Test NFT #${nftId}`,
    description: `A test NFT for list endpoint testing - ID ${nftId}`,
    image: `ipfs://QmTestImage${nftId}Hash`,
    attributes: [
      { trait_type: "Test ID", value: nftId },
      { trait_type: "Type", value: "Test NFT" },
      { trait_type: "Rarity", value: nftId % 3 === 0 ? "Rare" : "Common" }
    ]
  };
  
  const metadataJson = JSON.stringify(metadata);
  const hashBytes = await generateMetadataHash(metadataJson);
  return Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
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

// Helper function to mint a test NFT
const mintTestNFT = async (contractAddress: string, metadataHash?: string, did?: string): Promise<number> => {
  const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contractAddress,
      metadataHash: metadataHash || generateRandomHex32(),
      did: did || generateRandomHex32(),
    }),
  });

  expect(response.ok).toBe(true);
  const result: any = await response.json();
  expect(result.success).toBe(true);
  expect(result.data.nftId).toBeDefined();
  
  console.log(`🎨 Minted test NFT with ID: ${result.data.nftId}`);
  return result.data.nftId;
};

// Helper function to mint NFT with realistic metadata
const mintTestNFTWithMetadata = async (contractAddress: string, nftId: number): Promise<{ nftId: number; metadataHash: string; metadata: NFTMetadata }> => {
  const metadata: NFTMetadata = {
    name: `Test NFT #${nftId}`,
    description: `A test NFT for list endpoint testing - ID ${nftId}`,
    image: `ipfs://QmTestImage${nftId}Hash`,
    attributes: [
      { trait_type: "Test ID", value: nftId },
      { trait_type: "Type", value: "Test NFT" },
      { trait_type: "Rarity", value: nftId % 3 === 0 ? "Rare" : "Common" }
    ]
  };
  
  const metadataHash = await generateRealisticMetadataHash(nftId);
  const did = generateRandomHex32();
  
  const response = await fetch(`${SERVER_URL}/api/mint-nft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contractAddress,
      metadataHash,
      did,
    }),
  });

  expect(response.ok).toBe(true);
  const result: any = await response.json();
  expect(result.success).toBe(true);
  
  console.log(`🎨 Minted test NFT with realistic metadata - ID: ${result.data.nftId}`);
  return { 
    nftId: result.data.nftId, 
    metadataHash, 
    metadata 
  };
};

describe('List NFTs Endpoint Tests', () => {
  let contractAddress: string;

  beforeAll(async () => {
    console.log('🚀 Starting list-nfts endpoint tests...');
    
    // Wait for server to be ready
    await waitForServer();
    
    // Deploy a test contract
    contractAddress = await deployTestContract();
  }, TIMEOUT);

  describe('GET /api/nfts/:contractAddress', () => {
    it('should return empty array when no NFTs are minted', async () => {
      console.log('📋 Testing empty NFT list...');
      
      const response = await fetch(`${SERVER_URL}/api/nfts/${contractAddress}`);
      
      const result: any = await response.json();
      console.log('🔍 Response:', result);
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.nfts).toBeInstanceOf(Array);
             expect(result.data.nfts.length).toBe(0);
       expect(result.data.totalCount).toBe(0);
       expect(result.data.maxNftId).toBe(0);
       expect(result.data.message).toBe('NFTs retrieved successfully');
    }, TIMEOUT);

    it('should list single NFT after minting one', async () => {
      console.log('🎨 Testing single NFT list...');
      
      // Mint one NFT
      const metadataHash = generateRandomHex32();
      const did = generateRandomHex32();
      const nftId = await mintTestNFT(contractAddress, metadataHash, did);
      
      // List NFTs
      const response = await fetch(`${SERVER_URL}/api/nfts/${contractAddress}`);
      
      const result: any = await response.json();
      console.log('🔍 Response:', result);
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.nfts).toBeInstanceOf(Array);
      expect(result.data.nfts.length).toBe(1);
      expect(result.data.totalCount).toBe(1);
      
      // Verify NFT data
      const nft = result.data.nfts[0];
      expect(nft.nftId).toBe(nftId);
      expect(nft.ownerAddress).toBeDefined();
      expect(typeof nft.ownerAddress).toBe('string');
      expect(nft.metadataHash).toBe(metadataHash);
      expect(nft.did).toBe(did);
    }, TIMEOUT);

    it('should list multiple NFTs after minting several', async () => {
      console.log('🎨 Testing multiple NFTs list...');
      
             // Mint 3 more NFTs (we already have 1 from previous test)
       const nftData: Array<{ nftId: number; metadataHash: string; did: string }> = [];
       for (let i = 0; i < 3; i++) {
         const metadataHash = generateRandomHex32();
         const did = generateRandomHex32();
         const nftId = await mintTestNFT(contractAddress, metadataHash, did);
         nftData.push({ nftId, metadataHash, did });
       }
      
      // List NFTs
      const response = await fetch(`${SERVER_URL}/api/nfts/${contractAddress}`);
      
      const result: any = await response.json();
      console.log('🔍 Response:', result);
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.nfts).toBeInstanceOf(Array);
      expect(result.data.nfts.length).toBe(4); // 1 from previous test + 3 new ones
      expect(result.data.totalCount).toBe(4);
      
      // Verify NFTs are ordered by ID
      const sortedNfts = result.data.nfts.sort((a: any, b: any) => a.nftId - b.nftId);
      for (let i = 0; i < sortedNfts.length - 1; i++) {
        expect(sortedNfts[i].nftId).toBeLessThan(sortedNfts[i + 1].nftId);
      }
      
      // Verify each NFT has required fields
      result.data.nfts.forEach((nft: any) => {
        expect(nft.nftId).toBeDefined();
        expect(typeof nft.nftId).toBe('number');
        expect(nft.ownerAddress).toBeDefined();
        expect(typeof nft.ownerAddress).toBe('string');
        expect(nft.metadataHash).toBeDefined();
        expect(typeof nft.metadataHash).toBe('string');
        expect(nft.metadataHash.length).toBe(64); // 32 bytes = 64 hex characters
        expect(nft.did).toBeDefined();
        expect(typeof nft.did).toBe('string');
        expect(nft.did.length).toBe(64); // 32 bytes = 64 hex characters
      });
    }, TIMEOUT);

    it('should fail with missing contractAddress', async () => {
      const response = await fetch(`${SERVER_URL}/api/nfts/`);
      
      expect(response.status).toBe(404); // Should hit 404 handler
    });

    it('should fail with invalid contractAddress', async () => {
      const fakeContractAddress = '0x' + '0'.repeat(64);
      
      const response = await fetch(`${SERVER_URL}/api/nfts/${fakeContractAddress}`);
      
      expect(response.status).toBe(500);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return consistent data when called multiple times', async () => {
      console.log('🔄 Testing consistency across multiple calls...');
      
      // Make multiple calls to the same endpoint
      const responses = await Promise.all([
        fetch(`${SERVER_URL}/api/nfts/${contractAddress}`),
        fetch(`${SERVER_URL}/api/nfts/${contractAddress}`),
        fetch(`${SERVER_URL}/api/nfts/${contractAddress}`)
      ]);
      
      // Parse all responses
      const results = await Promise.all(
        responses.map(response => response.json())
      );
      
      // All should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      results.forEach((result: any) => {
        expect(result.success).toBe(true);
      });
      
             // All should return the same data
       const firstResult = results[0] as any;
       results.forEach((result: any) => {
         expect(result.data.totalCount).toBe(firstResult.data.totalCount);
         expect(result.data.nfts.length).toBe(firstResult.data.nfts.length);
         expect(result.data.maxNftId).toBe(firstResult.data.maxNftId);
       });
       
       console.log(`✅ All calls returned consistent data with ${firstResult.data.totalCount} NFTs`);
    }, TIMEOUT);

    it('should handle large contract addresses correctly', async () => {
      // Test with a very long but invalid contract address
      const longContractAddress = '0x' + '1'.repeat(128);
      
      const response = await fetch(`${SERVER_URL}/api/nfts/${longContractAddress}`);
      
      expect(response.status).toBe(500);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Metadata Functionality', () => {
    it('should support includeMetadata query parameter', async () => {
      console.log('🔍 Testing includeMetadata parameter...');
      
      // Test without includeMetadata parameter (default behavior)
      const responseWithoutMetadata = await fetch(`${SERVER_URL}/api/nfts/${contractAddress}`);
      const resultWithoutMetadata: any = await responseWithoutMetadata.json();
      
      expect(responseWithoutMetadata.ok).toBe(true);
      expect(resultWithoutMetadata.success).toBe(true);
      
      // Test with includeMetadata=false
      const responseWithFalse = await fetch(`${SERVER_URL}/api/nfts/${contractAddress}?includeMetadata=false`);
      const resultWithFalse: any = await responseWithFalse.json();
      
      expect(responseWithFalse.ok).toBe(true);
      expect(resultWithFalse.success).toBe(true);
      
      // Test with includeMetadata=true
      const responseWithTrue = await fetch(`${SERVER_URL}/api/nfts/${contractAddress}?includeMetadata=true`);
      const resultWithTrue: any = await responseWithTrue.json();
      
      expect(responseWithTrue.ok).toBe(true);
      expect(resultWithTrue.success).toBe(true);
      
      console.log('✅ All includeMetadata parameter variations work');
    }, TIMEOUT);

    it('should include metadata fields when includeMetadata=true', async () => {
      console.log('🔍 Testing metadata fields inclusion...');
      
      const response = await fetch(`${SERVER_URL}/api/nfts/${contractAddress}?includeMetadata=true`);
      const result: any = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.nfts).toBeInstanceOf(Array);
      
      // Check that NFTs have metadata-related fields
      if (result.data.nfts.length > 0) {
        const nft = result.data.nfts[0];
        
        // Basic NFT fields should still be present
        expect(nft.nftId).toBeDefined();
        expect(nft.ownerAddress).toBeDefined();
        expect(nft.metadataHash).toBeDefined();
        expect(nft.did).toBeDefined();
        
        // Metadata-related fields should be present when includeMetadata=true
        expect(nft.metadataVerified).toBeDefined();
        expect(typeof nft.metadataVerified).toBe('boolean');
        
        // Note: metadata and metadataUri will be undefined due to current limitations
        // but the fields should be acknowledged in the response structure
        console.log('📋 NFT with metadata fields:', {
          nftId: nft.nftId,
          metadataHash: nft.metadataHash.substring(0, 8) + '...',
          metadataVerified: nft.metadataVerified,
          hasMetadata: nft.metadata !== undefined,
          hasMetadataUri: nft.metadataUri !== undefined
        });
      }
      
      console.log('✅ Metadata fields are properly included');
    }, TIMEOUT);

    it('should demonstrate metadata hash verification concept using existing NFTs', async () => {
      console.log('🔍 Testing metadata hash verification concept with existing NFTs...');
      
      // Use existing contract and mint one NFT with realistic metadata
      const nextNftId = 5; // We already have 4 NFTs from previous tests
      const mintResult = await mintTestNFTWithMetadata(contractAddress, nextNftId);
      
      console.log('🎨 Minted NFT with realistic metadata:', {
        nftId: mintResult.nftId,
        metadataHash: mintResult.metadataHash.substring(0, 8) + '...',
        metadataName: mintResult.metadata.name
      });
      
      // List NFTs and verify the metadata hash matches
      const response = await fetch(`${SERVER_URL}/api/nfts/${contractAddress}`);
      const result: any = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.nfts.length).toBeGreaterThanOrEqual(5);
      
      // Find our newly minted NFT
      const retrievedNft = result.data.nfts.find((nft: any) => nft.nftId === mintResult.nftId);
      expect(retrievedNft).toBeDefined();
      expect(retrievedNft.metadataHash).toBe(mintResult.metadataHash);
      
      console.log('✅ Metadata hash verification successful:', {
        expected: mintResult.metadataHash.substring(0, 8) + '...',
        retrieved: retrievedNft.metadataHash.substring(0, 8) + '...',
        matches: retrievedNft.metadataHash === mintResult.metadataHash
      });
      
      // Demonstrate that we can verify the metadata integrity
      const metadataJson = JSON.stringify(mintResult.metadata);
      const computedHashBytes = await generateMetadataHash(metadataJson);
      const computedHash = Array.from(computedHashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      expect(computedHash).toBe(mintResult.metadataHash);
      expect(computedHash).toBe(retrievedNft.metadataHash);
      
      console.log('🔐 Metadata integrity verification:', {
        originalMetadata: mintResult.metadata.name,
        computedHash: computedHash.substring(0, 8) + '...',
        onChainHash: retrievedNft.metadataHash.substring(0, 8) + '...',
        integrityValid: computedHash === retrievedNft.metadataHash
      });
    }, TIMEOUT);

    it('should demonstrate current metadata limitations', async () => {
      console.log('⚠️ Testing current metadata limitations...');
      
      const response = await fetch(`${SERVER_URL}/api/nfts/${contractAddress}?includeMetadata=true`);
      const result: any = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      
      if (result.data.nfts.length > 0) {
        const nft = result.data.nfts[0];
        
        // Current limitations should be reflected in the response
        expect(nft.metadataVerified).toBe(false);
        expect(nft.metadata).toBeUndefined();
        expect(nft.metadataUri).toBeUndefined();
        
        console.log('📋 Current limitations confirmed:', {
          hasMetadataHash: !!nft.metadataHash,
          metadataVerified: nft.metadataVerified,
          hasActualMetadata: nft.metadata !== undefined,
          hasMetadataUri: nft.metadataUri !== undefined,
          limitation: 'IPFS CID not stored on-chain'
        });
      }
      
      console.log('⚠️ Limitations properly documented in response');
    }, TIMEOUT);

    // Skip the multiple NFTs test for now to avoid extra contract deployments
    it.skip('should handle multiple NFTs with different metadata hashes', async () => {
      // This test is skipped to optimize test performance
      // It would require deploying a fresh contract and minting multiple NFTs
      // The concept is already demonstrated in the other tests
      console.log('⏭️ Skipped: Multiple NFTs test (optimization)');
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This test assumes the server handles errors properly
      // Test with a contract address that will cause an error
      const invalidAddress = 'invalid-address';
      
      const response = await fetch(`${SERVER_URL}/api/nfts/${invalidAddress}`);
      
      expect(response.status).toBe(500);
      
      const result: any = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });
  });
}); 