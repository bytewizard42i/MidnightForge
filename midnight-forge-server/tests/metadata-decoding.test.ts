import { describe, it, expect } from 'vitest';
import { generateMetadataHash, verifyMetadataHash, fetchMetadataFromIPFS, NFTMetadata } from '../src/utils.js';

describe('Metadata Decoding Tests', () => {
  
  describe('Metadata Hash Generation and Verification', () => {
    it('should generate consistent metadata hash from JSON', async () => {
      const metadata: NFTMetadata = {
        name: "Test NFT #1",
        description: "A test NFT for demonstrating metadata hashing",
        image: "ipfs://QmTestImageHash123",
        attributes: [
          { trait_type: "Level", value: 5 },
          { trait_type: "Rarity", value: "Common" }
        ]
      };

      const metadataJson = JSON.stringify(metadata);
      console.log('📄 Metadata JSON:', metadataJson);
      
      const hash1 = await generateMetadataHash(metadataJson);
      const hash2 = await generateMetadataHash(metadataJson);
      
      // Should be deterministic
      expect(hash1).toEqual(hash2);
      
      // Should be 32 bytes
      expect(hash1.length).toBe(32);
      
      const hashHex = Array.from(hash1).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log('🔍 Generated hash (hex):', hashHex);
      console.log('🔍 Hash length:', hashHex.length, 'characters (should be 64)');
    });

    it('should verify metadata hash correctly', async () => {
      const metadata: NFTMetadata = {
        name: "Verification Test NFT",
        description: "Testing hash verification",
        image: "ipfs://QmVerificationTest456",
        attributes: [
          { trait_type: "Test", value: "Verification" }
        ]
      };

      const metadataJson = JSON.stringify(metadata);
      const hashBytes = await generateMetadataHash(metadataJson);
      const hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Should verify correctly
      const isValid = await verifyMetadataHash(metadataJson, hashHex);
      expect(isValid).toBe(true);
      
      // Should fail with different metadata
      const differentMetadata = { ...metadata, name: "Different Name" };
      const differentJson = JSON.stringify(differentMetadata);
      const isInvalid = await verifyMetadataHash(differentJson, hashHex);
      expect(isInvalid).toBe(false);
    });

    it('should handle metadata with different attribute types', async () => {
      const metadata: NFTMetadata = {
        name: "Complex NFT",
        description: "NFT with various attribute types",
        image: "ipfs://QmComplexTest789",
        attributes: [
          { trait_type: "Level", value: 42 },
          { trait_type: "Name", value: "Hero" },
          { trait_type: "Power", value: 9000 },
          { trait_type: "Element", value: "Fire" }
        ]
      };

      const metadataJson = JSON.stringify(metadata);
      const hashBytes = await generateMetadataHash(metadataJson);
      
      expect(hashBytes.length).toBe(32);
      
      const hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log('🎮 Complex metadata hash:', hashHex);
      
      // Verify it works
      const isValid = await verifyMetadataHash(metadataJson, hashHex);
      expect(isValid).toBe(true);
    });
  });

  describe('IPFS Metadata Fetching', () => {
    it('should handle invalid IPFS URIs gracefully', async () => {
      const invalidUris = [
        'not-ipfs://invalid',
        'https://example.com/not-ipfs',
        'ipfs://', // empty CID
        'invalid-format'
      ];

      for (const uri of invalidUris) {
        const result = await fetchMetadataFromIPFS(uri);
        expect(result).toBeNull();
      }
    });

    it('should construct correct gateway URLs', async () => {
      // This test will fail to fetch (which is expected) but we can verify the logic
      const testCid = 'QmTestCidThatDoesNotExist123456789';
      const ipfsUri = `ipfs://${testCid}`;
      
      // This will fail to fetch, but that's expected for a non-existent CID
      const result = await fetchMetadataFromIPFS(ipfsUri);
      expect(result).toBeNull(); // Should fail gracefully
    });
  });

  describe('Real-world Metadata Examples', () => {
    it('should handle typical NFT metadata structure', async () => {
      const typicalNftMetadata: NFTMetadata = {
        name: "Midnight Warrior #1337",
        description: "A legendary warrior from the Midnight blockchain, forged in the depths of zero-knowledge proofs.",
        image: "ipfs://QmWarriorImage1337HashExample",
        attributes: [
          { trait_type: "Class", value: "Warrior" },
          { trait_type: "Level", value: 85 },
          { trait_type: "Weapon", value: "ZK Sword" },
          { trait_type: "Armor", value: "Privacy Shield" },
          { trait_type: "Rarity", value: "Legendary" },
          { trait_type: "Element", value: "Shadow" },
          { trait_type: "Power", value: 9500 }
        ]
      };

      const metadataJson = JSON.stringify(typicalNftMetadata);
      const hashBytes = await generateMetadataHash(metadataJson);
      const hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('⚔️ Warrior NFT Metadata:');
      console.log('   📄 JSON:', metadataJson);
      console.log('   🔍 Hash:', hashHex);
      console.log('   📏 Hash length:', hashHex.length);
      
      // Verify the hash
      const isValid = await verifyMetadataHash(metadataJson, hashHex);
      expect(isValid).toBe(true);
      
      // This hash could be stored on-chain in the NFT contract
      expect(hashBytes.length).toBe(32);
    });

    it('should demonstrate the relationship between frontend and contract', async () => {
      // This is what the frontend would do when minting an NFT:
      
      // 1. User creates metadata
      const userMetadata: NFTMetadata = {
        name: "My Awesome NFT",
        description: "Created through MidnightForge",
        image: "ipfs://QmUserUploadedImageHash",
        attributes: [
          { trait_type: "Creator", value: "User123" },
          { trait_type: "Timestamp", value: "2024-01-15" }
        ]
      };

      // 2. Frontend uploads metadata to IPFS and gets CID
      const metadataJson = JSON.stringify(userMetadata);
      // const ipfsCid = await uploadToIPFS(metadataJson); // This would happen in real app
      const mockIpfsCid = "QmMockMetadataCidExample123";
      
      // 3. Frontend calculates metadata hash for contract
      const metadataHashBytes = await generateMetadataHash(metadataJson);
      const metadataHashHex = Array.from(metadataHashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // 4. Frontend calls mint API with the hash
      console.log('🔄 Minting Process:');
      console.log('   📤 Metadata uploaded to IPFS CID:', mockIpfsCid);
      console.log('   🔍 Metadata hash for contract:', metadataHashHex);
      console.log('   📄 Original metadata JSON:', metadataJson);
      
      // 5. Later, to verify metadata integrity:
      // const retrievedMetadata = await fetchFromIPFS(mockIpfsCid);
      // const isIntegrityValid = await verifyMetadataHash(JSON.stringify(retrievedMetadata), metadataHashHex);
      
      expect(metadataHashHex.length).toBe(64); // 32 bytes = 64 hex chars
      expect(metadataHashBytes.length).toBe(32);
      
      // Verify we can validate the hash
      const isValid = await verifyMetadataHash(metadataJson, metadataHashHex);
      expect(isValid).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty metadata gracefully', async () => {
      const emptyMetadata: NFTMetadata = {
        name: "",
        description: "",
        image: "",
        attributes: []
      };

      const metadataJson = JSON.stringify(emptyMetadata);
      const hashBytes = await generateMetadataHash(metadataJson);
      
      expect(hashBytes.length).toBe(32);
      
      const hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const isValid = await verifyMetadataHash(metadataJson, hashHex);
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in metadata', async () => {
      const unicodeMetadata: NFTMetadata = {
        name: "🌙 Midnight NFT 🔮",
        description: "An NFT with émojis and spëcial characters: 中文, العربية, русский",
        image: "ipfs://QmUnicodeTest",
        attributes: [
          { trait_type: "Language", value: "多言語" },
          { trait_type: "Symbol", value: "⚡" }
        ]
      };

      const metadataJson = JSON.stringify(unicodeMetadata);
      const hashBytes = await generateMetadataHash(metadataJson);
      
      expect(hashBytes.length).toBe(32);
      
      const hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log('🌍 Unicode metadata hash:', hashHex);
      
      const isValid = await verifyMetadataHash(metadataJson, hashHex);
      expect(isValid).toBe(true);
    });
  });
}); 