#!/bin/bash

set -e

echo "🚀 Starting Midnight Forge Hybrid Environment"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check and install Compact compiler if needed
echo "🔧 Checking Compact compiler..."
if [ -z "${COMPACT_HOME:-}" ] || [ ! -f "${COMPACT_HOME}/bin/compactc" ]; then
    echo "⚠️  Compact compiler not found or not properly configured"
    echo "🔧 Installing Compact compiler automatically..."
    ./setup-compact.sh install
    
    # Skip sourcing shell profiles to avoid hanging
    echo "ℹ️  Skipping shell profile sourcing to avoid conflicts..."
    
    # Set COMPACT_HOME for current session if not set
    if [ -z "${COMPACT_HOME:-}" ]; then
        if [ -d "./compactc_v0.23.0_aarch64-darwin" ]; then
            export COMPACT_HOME="$(pwd)/compactc_v0.23.0_aarch64-darwin"
        elif [ -d "./compactc_v0.23.0_x86_64-unknown-linux-musl" ]; then
            export COMPACT_HOME="$(pwd)/compactc_v0.23.0_x86_64-unknown-linux-musl"
        fi
    fi
else
    echo "✅ Compact compiler found at: $COMPACT_HOME"
fi

echo "🔧 Compact compiler setup completed, continuing with quickstart..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔗 Starting blockchain infrastructure with Docker..."
echo "⏱️  This may take a few moments for first-time setup..."

# Check if containers are already running
if docker ps --format "table {{.Names}}" | grep -q "midnight-forge"; then
    echo "ℹ️  Blockchain containers already running, skipping startup..."
else
    # Start blockchain infrastructure in background
    docker compose -f docker-compose.blockchain.yml up -d
fi

echo ""
echo "⏳ Waiting for blockchain services to be ready..."

# Wait for services to be healthy
echo "   Checking Node health..."
until curl -s http://localhost:9944/health > /dev/null 2>&1; do
    echo "   • Node starting up..."
    sleep 2
done

echo "   Checking Indexer health..."
until curl -s http://localhost:8088/health > /dev/null 2>&1; do
    echo "   • Indexer starting up..."
    sleep 2
done

echo "✅ Blockchain infrastructure is ready!"
echo ""
echo "🏗️  Building contracts and starting applications..."
echo ""

# Show service endpoints
echo "Services available at:"
echo "  • Frontend:     http://localhost:5173"
echo "  • Backend API:  http://localhost:3001"
echo "  • Indexer API:  http://localhost:8088"
echo "  • Proof Server: http://localhost:6300"
echo "  • Node RPC:     http://localhost:9944"
echo ""
echo "📝 To view blockchain logs:"
echo "  • All logs:     npm run blockchain:logs"
echo "  • Proof server: npm run blockchain:logs:proof-server"
echo "  • Indexer:      npm run blockchain:logs:indexer"
echo "  • Node:         npm run blockchain:logs:node"
echo ""
echo "Press Ctrl+C to stop applications (blockchain will keep running)"
echo "Use 'npm run blockchain:stop' to stop blockchain infrastructure"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping applications..."
    echo "ℹ️  Blockchain infrastructure is still running."
    echo "   Use 'npm run blockchain:stop' to stop it."
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Run applications in development mode
npm run apps:dev 