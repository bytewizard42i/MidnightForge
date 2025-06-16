#!/bin/bash

echo "🔧 Fixing Architecture Mismatch Issue"
echo "===================================="

echo "🔍 Detected issue: Wrong platform specification for macOS Apple Silicon"
echo ""

echo "📋 Step 1: Stop current containers"
docker stop midnight-forge-node midnight-forge-indexer midnight-forge-proof-server

echo "📋 Step 2: Remove containers to force fresh start"
docker rm midnight-forge-node midnight-forge-indexer midnight-forge-proof-server

echo "📋 Step 3: Remove the problematic image"
docker rmi midnightnetwork/midnight-node:0.12.0 2>/dev/null || echo "Image not found, continuing..."

echo "📋 Step 4: Start containers with correct architecture"
cd /Users/norman/Development/midnight/test-mf
docker compose -f docker-compose.blockchain.yml up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🔍 Checking container status:"
docker ps | grep midnight-forge

echo ""
echo "🔍 Testing node health:"
for i in {1..12}; do
    if curl -s http://localhost:9944/health > /dev/null 2>&1; then
        echo "✅ Node is now healthy!"
        echo ""
        echo "🎉 Architecture fix successful!"
        echo "You can now run: npm run quickstart"
        exit 0
    fi
    echo "   • Attempt $i/12: Node starting..."
    sleep 10
done

echo ""
echo "❌ Node still not responding. Let's check logs:"
docker logs midnight-forge-node --tail=20

echo ""
echo "💡 If still having issues, the node version might be incompatible."
echo "   Try editing docker-compose.blockchain.yml and change to:"
echo "   image: 'midnightnetwork/midnight-node:0.11.0'" 