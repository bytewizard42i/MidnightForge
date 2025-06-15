#!/bin/bash

set -e

echo "🚀 Starting Midnight Forge Standalone Environment"
echo "================================================="

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

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🐳 Starting services with Docker Compose..."
echo ""
echo "Services will be available at:"
echo "  • Frontend:     http://localhost:5173"
echo "  • Backend API:  http://localhost:3001"
echo "  • Indexer API:  http://localhost:8088"
echo "  • Proof Server: http://localhost:6300"
echo "  • Node RPC:     http://localhost:9944"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Run Docker Compose
docker compose -f docker-compose.standalone.yml up --build 