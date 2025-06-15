# Midnight Forge Server Tests

This directory contains comprehensive tests for the Midnight Forge Server API endpoints.

## Prerequisites

Before running tests, ensure you have:

1. **Docker services running** with the blockchain environment:
   ```bash
   # In the project root
   docker-compose -f docker-compose.blockchain.yml up -d
   ```

2. **Server running** in development mode:
   ```bash
   # In midnight-forge-server directory
   npm run quickstart
   ```

## Test Files

### `mint-nft.test.ts`
Comprehensive tests for the `/api/mint-nft` endpoint including:

- ✅ **Successful NFT minting** with valid parameters
- ❌ **Error handling** for missing required fields
- ❌ **Validation** for invalid parameter formats
- 🔄 **Multiple NFT minting** to verify unique IDs
- 🛡️ **Edge cases** like malformed JSON and empty requests

## Running Tests

### Run Mint NFT Tests
```bash
npm run test:mint
```

### Run All Tests
```bash
npm run test:all
```

### Run Tests with Verbose Output
```bash
npx vitest tests/mint-nft.test.ts --reporter=verbose
```

## Test Features

### 🚀 **Automatic Setup**
- Waits for server to be healthy before starting
- Automatically deploys a test contract for NFT operations
- Uses genesis wallet for reliable funding

### 🎯 **Comprehensive Coverage**
- Tests all required parameters validation
- Tests error responses and status codes
- Tests successful operations with real blockchain calls
- Tests multiple operations to verify state consistency

### ⏱️ **Blockchain-Aware Timeouts**
- 2-minute timeout for blockchain operations
- Automatic retry logic for server readiness
- Proper async/await handling for long-running operations

### 🔍 **Detailed Logging**
- Progress indicators for long operations
- Success confirmations with NFT IDs
- Error details for debugging

## Test Data

The tests use:
- **Random 32-byte hex strings** for metadata hashes and DIDs
- **Genesis wallet credentials** for reliable funding
- **Real contract deployment** for authentic testing environment

## Expected Output

Successful test run should show:
```
🚀 Starting mint-nft endpoint tests...
✅ Server is ready
📄 Test contract deployed at: 0x...
🎨 Minting NFT with metadata: a1b2c3d4...
✅ Mint result: { success: true, data: { nftId: 1, transactionId: "...", message: "NFT minted successfully" } }
🎉 Successfully minted NFT with ID: 1
...
🎉 Successfully minted 3 NFTs with IDs: 1, 2, 3
```

## Troubleshooting

### Server Not Ready
If tests fail with "Server failed to start", ensure:
- Docker services are running
- Server is started with `npm run quickstart`
- No port conflicts on 3001

### Wallet Funding Issues
If tests fail with wallet funding errors:
- Verify Docker is using `CFG_PRESET: "dev"`
- Check that genesis wallet is being used
- Ensure blockchain services are fully synced

### Timeout Issues
If tests timeout:
- Increase `TIMEOUT` constant in test file
- Check blockchain service health
- Verify network connectivity to indexer/node 