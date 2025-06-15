# Independent Blockchain Infrastructure

This file provides commands for managing the Midnight blockchain infrastructure (Node, Indexer, and Proof Server) independently from the MidnightForge applications.

## Services Included

- **Midnight Node**: Blockchain node running on port `9944`
- **Midnight Indexer**: Indexing service on port `8088`
- **Proof Server**: Zero-knowledge proof generation service on port `6300`

## Quick Start

### Start Blockchain Infrastructure
```bash
npm run blockchain:start
```

### Check Status
```bash
npm run blockchain:status
```

### View Logs
```bash
npm run blockchain:logs
```

### Stop Infrastructure
```bash
npm run blockchain:stop
```

## Development Workflow

### 1. Start blockchain infrastructure first
```bash
npm run blockchain:start
```

### 2. Run applications locally (recommended)
```bash
npm run apps:dev
```

This will:
- Build the contracts
- Start the server on port `3001`
- Start the webapp on port `5173`
- Connect to the blockchain infrastructure running in Docker

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run blockchain:start` | Start all blockchain services in background |
| `npm run blockchain:stop` | Stop all blockchain services |
| `npm run blockchain:restart` | Restart all blockchain services |
| `npm run blockchain:logs` | Follow logs from all services |
| `npm run blockchain:logs:proof-server` | Follow logs from proof server only |
| `npm run blockchain:logs:indexer` | Follow logs from indexer only |
| `npm run blockchain:logs:node` | Follow logs from node only |
| `npm run blockchain:status` | Show status of all services |
| `npm run blockchain:clean` | Stop and remove all volumes/data |
| `npm run apps:dev` | Run server + webapp locally with blockchain in Docker |

## Service Endpoints

- **Node WebSocket**: `ws://localhost:9944`
- **Indexer API**: `http://localhost:8088`
- **Proof Server**: `http://localhost:6300`

## Troubleshooting

### Port Conflicts
If you get port binding errors, check what's running on the ports:
```bash
lsof -i :9944  # Node
lsof -i :8088  # Indexer
lsof -i :6300  # Proof Server
```

### Clean Restart
To completely reset the blockchain state:
```bash
npm run blockchain:clean
npm run blockchain:start
```

### View Individual Service Logs
```bash
# Using npm scripts (recommended)
npm run blockchain:logs:proof-server
npm run blockchain:logs:indexer  
npm run blockchain:logs:node

# Or using docker directly
docker logs midnight-forge-proof-server -f
docker logs midnight-forge-indexer -f
docker logs midnight-forge-node -f
``` 