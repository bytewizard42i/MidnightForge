# Midnight Forge TypeScript Server

## Overview

This is a TypeScript Express server for handling Midnight blockchain contract deployments and NFT operations. The server provides REST API endpoints for the MidnightForge frontend application.

## Project Structure

```
src/
├── config.ts           # Server configuration and environment setup
├── index.ts            # Main Express server with API endpoints
├── logger.ts           # Pino logger configuration
├── types.ts            # TypeScript type definitions
└── services/
    └── contractService.ts  # Contract operation service (needs work)
```

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   NODE_ENV=development
   MIDNIGHT_INDEXER_URL=https://indexer.testnet-02.midnight.network/api/v1/graphql
   MIDNIGHT_INDEXER_WS_URL=wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws
   MIDNIGHT_NODE_URL=https://rpc.testnet-02.midnight.network
   MIDNIGHT_PROOF_SERVER_URL=http://127.0.0.1:6300
   WALLET_SEED=your_wallet_seed_here
   WALLET_FILENAME=server_wallet.dat
   CORS_ORIGIN=http://localhost:5173
   LOG_LEVEL=info
   ```

3. **Build and Run**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## API Endpoints

### Health Check
- **GET** `/health` - Server health status and configuration

### Contract Operations
- **POST** `/api/deploy-contract` - Deploy a new contract
  ```json
  {
    "ownerSecretKey": "hex_string",
    "ownerAddress": "hex_string"
  }
  ```

- **POST** `/api/mint-nft` - Mint a new NFT
  ```json
  {
    "contractAddress": "contract_address",
    "metadataHash": "hex_string",
    "did": "hex_string"
  }
  ```

- **GET** `/api/nft/:contractAddress/:nftId` - Get NFT details

- **GET** `/api/contract-status/:contractAddress` - Get contract status

## Current Status

### ✅ Completed
- Basic Express server setup with TypeScript
- Configuration management with environment variables
- Request logging and error handling
- API endpoint structure with proper typing
- CORS configuration
- Graceful shutdown handling

### 🚧 TODO - Implementation Needed

1. **Fix Import Issues**
   - Express and CORS types need to be properly imported
   - The TypeScript configuration may need adjustment

2. **Wallet Integration**
   - The contractService.ts has import path issues that need fixing
   - Need to create a proper wallet initialization service
   - Integrate with the counter-cli functions for actual contract operations

3. **Complete Implementation Steps**
   ```typescript
   // In index.ts, replace placeholder endpoints with:
   
   // 1. Initialize wallet service on startup
   const walletService = new WalletService();
   await walletService.initialize(config);
   
   // 2. Create contract service
   const contractService = new ContractService(
     walletService.getProviders(),
     walletService.getWallet()
   );
   
   // 3. Use contractService in endpoints instead of placeholder responses
   ```

4. **Path Resolution**
   - Fix the import paths in contractService.ts to properly reference counter-cli functions
   - Consider copying necessary functions locally if import path issues persist

## Integration with Frontend

Once implemented, the frontend `DeployContract.tsx` component should call:

```typescript
// Instead of direct contract calls, call the server:
const response = await fetch('http://localhost:3001/api/deploy-contract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ownerSecretKey: hexSeed, // from wallet
    ownerAddress: ownerAddress // from wallet
  })
});
```

## Development Notes

- The server uses ES modules (type: "module" in package.json)
- All imports should use .js extensions for local files
- TypeScript strict mode is enabled
- The server is designed to run alongside the Vite frontend on different ports 