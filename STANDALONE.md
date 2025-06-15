# Midnight Forge Standalone Setup

This guide explains how to run the complete Midnight Forge application stack, including the blockchain infrastructure, backend server, and frontend web app.

## Overview

The standalone setup includes:
- **Midnight Node**: Local blockchain node
- **Indexer**: Blockchain indexer for querying data
- **Proof Server**: Zero-knowledge proof generation service
- **Backend Server**: Express.js API server (Port 3001)
- **Frontend Web App**: React/Vite application (Port 5173)

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

## Quick Start (Recommended)

### Option 1: Full Docker Setup

This runs everything in Docker containers:

```bash
# Install dependencies
npm install

# Start the complete stack
npm run standalone

# Or run in detached mode (background)
npm run standalone:detached
```

The services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Indexer API**: http://localhost:8088
- **Proof Server**: http://localhost:6300
- **Node RPC**: http://localhost:9944

### Option 2: Hybrid Setup (Infrastructure + Local Development)

This runs the blockchain infrastructure in Docker and the apps locally for faster development:

```bash
# Install dependencies
npm install

# Start blockchain infrastructure
npm run standalone:infra

# Start apps in development mode (separate terminal)
npm run standalone:dev
```

## Managing the Standalone Environment

### Stop Services

```bash
# Stop all services
npm run standalone:stop

# For hybrid setup, stop infrastructure
cd counter-cli && docker compose -f standalone.yml down
```

### Clean Up

```bash
# Stop and remove all containers, volumes, and networks
npm run standalone:clean
```

### View Logs

```bash
# View all logs
docker compose -f docker-compose.standalone.yml logs -f

# View specific service logs
docker compose -f docker-compose.standalone.yml logs -f midnight-forge-server
docker compose -f docker-compose.standalone.yml logs -f midnight-forge-webapp
```

## Development

### Local Development Setup

For faster development with hot reloading:

1. Start the blockchain infrastructure:
   ```bash
   npm run standalone:infra
   ```

2. In separate terminals, start the services:
   ```bash
   # Terminal 1: Backend server
   npm run server:dev
   
   # Terminal 2: Frontend app
   npm run webapp:dev
   ```

### Building for Production

```bash
# Build all services
npm run build:all

# Build individually
npm run server:build
npm run webapp:build
```

## Configuration

### Environment Variables

The Docker Compose setup uses these environment variables:

**Server**:
- `NODE_ENV=development`
- `PORT=3001`
- `INDEXER_URL=http://indexer:8088`
- `PROOF_SERVER_URL=http://proof-server:6300`
- `NODE_URL=ws://node:9944`

**Frontend**:
- `VITE_SERVER_URL=http://localhost:3001`
- `VITE_INDEXER_URL=http://localhost:8088`

### Network Configuration

All services run on a custom Docker network called `midnight-network` for internal communication.

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3001, 5173, 8088, 6300, and 9944 are not in use
2. **Docker memory**: Ensure Docker has sufficient memory allocated (recommended: 4GB+)
3. **Node startup**: The blockchain node takes ~40 seconds to fully initialize

### Health Checks

Check if services are running:

```bash
# Check all containers
docker compose -f docker-compose.standalone.yml ps

# Check specific service health
curl http://localhost:9944/health  # Node health
curl http://localhost:8088/health  # Indexer health (if available)
curl http://localhost:3001/health  # Server health (if implemented)
```

### Debugging

Enable debug logging:

```bash
DEBUG=* npm run standalone:dev
```

Or check Docker logs:

```bash
docker compose -f docker-compose.standalone.yml logs --tail=100 -f
```

## Service Architecture

```
Frontend (React/Vite) :5173
           ↓
Backend Server (Express) :3001
           ↓
Indexer API :8088 ←→ Midnight Node :9944
           ↓
Proof Server :6300
```

## Next Steps

1. Open http://localhost:5173 to access the web interface
2. The frontend connects to the backend API at http://localhost:3001
3. Deploy and interact with smart contracts through the interface
4. Monitor blockchain activity through the indexer API

For more detailed development information, see the individual README files in the `midnight-forge-server` and `midnight-forge-webapp-vite` directories. 