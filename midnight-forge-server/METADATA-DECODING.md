# NFT Metadata Decoding Guide

## Overview

This guide explains how NFT metadata works in the MidnightForge system, including how metadata is encoded, stored, and decoded.

## Key Concepts

### 1. Metadata Structure

NFT metadata follows the standard JSON structure:

```typescript
interface NFTMetadata {
  name: string;
  description: string;
  image: string; // IPFS URI like "ipfs://Qm..."
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}
```

### 2. Metadata Hash vs. Metadata Content

**Important**: The `metadataHash` stored on-chain is **NOT** the actual metadata. It's a SHA-256 hash used for verification.

- **On-chain**: Only the hash is stored (32 bytes)
- **Off-chain**: The actual metadata JSON is stored on IPFS
- **Purpose**: The hash ensures metadata integrity and immutability

### 3. The Minting Process

Here's how metadata flows through the system:

```
1. User creates metadata → 2. Upload to IPFS → 3. Calculate hash → 4. Store hash on-chain
   {                        ipfs://QmABC...      SHA-256 hash      metadataHash: 0x123...
     "name": "My NFT",                          (32 bytes)
     "image": "ipfs://...",
     ...
   }
```

## Code Examples

### Generating Metadata Hash

```typescript
import { generateMetadataHash } from './utils.js';

const metadata = {
  name: "Midnight Warrior #1337",
  description: "A legendary warrior from the Midnight blockchain",
  image: "ipfs://QmWarriorImage1337HashExample",
  attributes: [
    { trait_type: "Class", value: "Warrior" },
    { trait_type: "Level", value: 85 },
    { trait_type: "Weapon", value: "ZK Sword" }
  ]
};

const metadataJson = JSON.stringify(metadata);
const hashBytes = await generateMetadataHash(metadataJson);
const hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');

console.log('Metadata Hash:', hashHex);
// Output: 4cfeeeaa8eb6cc1d38def776098a75ca704ecbfe0ff6676583596224a9a124a7
```

### Verifying Metadata Integrity

```typescript
import { verifyMetadataHash } from './utils.js';

// Retrieved from IPFS
const retrievedMetadata = await fetchFromIPFS('ipfs://QmABC...');
const retrievedJson = JSON.stringify(retrievedMetadata);

// Hash from blockchain
const onChainHash = '4cfeeeaa8eb6cc1d38def776098a75ca704ecbfe0ff6676583596224a9a124a7';

// Verify integrity
const isValid = await verifyMetadataHash(retrievedJson, onChainHash);
console.log('Metadata is valid:', isValid);
```

## Current Limitations

### 1. No IPFS CID Storage

The current contract version only stores the metadata hash, not the IPFS CID. This means:

- ✅ We can verify metadata integrity
- ❌ We cannot automatically retrieve metadata from IPFS
- ❌ The `/api/nfts/:contractAddress?includeMetadata=true` parameter doesn't work yet

### 2. Metadata Retrieval Challenges

To retrieve actual metadata, you need:

1. The IPFS CID (not stored on-chain currently)
2. Access to IPFS gateways
3. A mapping service or external database

## Test Results

The metadata decoding tests demonstrate the functionality:

```bash
npm run test:metadata
```

**Sample Output:**
```
📄 Metadata JSON: {"name":"Test NFT #1","description":"A test NFT..."}
🔍 Generated hash (hex): 62197e9069fbec120001849d271ed81db02b3ebb5149c9429f50f470a563755a
🔍 Hash length: 64 characters (should be 64)

⚔️ Warrior NFT Metadata:
   📄 JSON: {"name":"Midnight Warrior #1337",...}
   🔍 Hash: 4cfeeeaa8eb6cc1d38def776098a75ca704ecbfe0ff6676583596224a9a124a7
   📏 Hash length: 64

🔄 Minting Process:
   📤 Metadata uploaded to IPFS CID: QmMockMetadataCidExample123
   🔍 Metadata hash for contract: 0d3cf5aa3bd847b59c287b9dc312120f89f2b7823fd62f14882c3004a805495e
```

## API Endpoints

### List NFTs with Metadata (Partial Support)

```bash
GET /api/nfts/:contractAddress?includeMetadata=true
```

**Current Response:**
```json
{
  "success": true,
  "data": {
    "nfts": [
      {
        "nftId": 1,
        "ownerAddress": "0x...",
        "metadataHash": "4cfeeeaa8eb6cc1d38def776098a75ca704ecbfe0ff6676583596224a9a124a7",
        "did": "0x...",
        "metadataVerified": false
        // metadata and metadataUri are undefined (not available)
      }
    ]
  }
}
```

## Future Enhancements

### 1. Store IPFS CIDs On-Chain

Modify the contract to store both hash and CID:

```compact
export ledger nftMetadataCID: Map<Field, Opaque<"string">>;
```

### 2. Enhanced API Response

With CID storage, the API could return:

```json
{
  "nftId": 1,
  "metadataHash": "4cfeeeaa...",
  "metadataUri": "ipfs://QmABC...",
  "metadata": {
    "name": "Midnight Warrior #1337",
    "description": "A legendary warrior...",
    "image": "ipfs://QmWarriorImage...",
    "attributes": [...]
  },
  "metadataVerified": true
}
```

### 3. Metadata Caching

Implement caching for frequently accessed metadata to improve performance.

## Security Considerations

### 1. Hash Verification

Always verify metadata integrity:

```typescript
const isValid = await verifyMetadataHash(metadataJson, onChainHash);
if (!isValid) {
  throw new Error('Metadata has been tampered with!');
}
```

### 2. IPFS Gateway Reliability

Use multiple IPFS gateways for redundancy:

```typescript
const gateways = [
  'https://ipfs.io/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];
```

### 3. Content Validation

Validate metadata structure before processing:

```typescript
function isValidNFTMetadata(obj: any): obj is NFTMetadata {
  return obj && 
         typeof obj.name === 'string' &&
         typeof obj.description === 'string' &&
         typeof obj.image === 'string' &&
         Array.isArray(obj.attributes);
}
```

## Debugging Tips

### 1. Check Hash Length

Metadata hashes should always be 64 hex characters (32 bytes):

```typescript
if (hashHex.length !== 64) {
  console.error('Invalid hash length:', hashHex.length);
}
```

### 2. JSON Consistency

Ensure consistent JSON serialization:

```typescript
// Use the same serialization method everywhere
const metadataJson = JSON.stringify(metadata);
```

### 3. Test with Known Values

Use the test examples to verify your implementation:

```bash
npm run test:metadata
```

## Conclusion

The metadata system provides a secure way to store NFT metadata off-chain while maintaining integrity through on-chain hashes. While the current implementation has limitations, it provides a solid foundation for future enhancements.

For questions or improvements, refer to the test files in `tests/metadata-decoding.test.ts`. 