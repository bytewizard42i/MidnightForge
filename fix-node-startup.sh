#!/bin/bash

echo "🔧 Midnight Node Startup Fix Script"
echo "==================================="

# Function to test if node is responding
test_node() {
    curl -s http://localhost:9944/health > /dev/null 2>&1
    return $?
}

# Function to wait for node with timeout
wait_for_node() {
    local timeout=$1
    local elapsed=0
    echo "⏳ Waiting for node (timeout: ${timeout}s)..."
    
    while [ $elapsed -lt $timeout ]; do
        if test_node; then
            echo "✅ Node is responding!"
            return 0
        fi
        echo "   • Waiting... (${elapsed}s elapsed)"
        sleep 5
        elapsed=$((elapsed + 5))
    done
    
    echo "❌ Node failed to respond within ${timeout}s"
    return 1
}

echo ""
echo "🔍 Current node status:"
docker ps | grep midnight-forge-node || echo "Node container not running"

echo ""
echo "📋 Trying Fix #1: Restart node container"
docker restart midnight-forge-node
if wait_for_node 60; then
    echo "🎉 Fix #1 worked! Node is now running."
    exit 0
fi

echo ""
echo "📋 Trying Fix #2: Stop and start with clean state"
docker stop midnight-forge-node
docker rm midnight-forge-node
cd /Users/norman/Development/midnight/test-mf
docker compose -f docker-compose.blockchain.yml up -d node
if wait_for_node 120; then
    echo "🎉 Fix #2 worked! Node is now running."
    exit 0
fi

echo ""
echo "📋 Trying Fix #3: Use older node version"
docker stop midnight-forge-node
docker rm midnight-forge-node

# Backup current compose file
cp docker-compose.blockchain.yml docker-compose.blockchain.yml.backup

# Try with older node version
sed -i.tmp 's/midnight-node:0.12.0/midnight-node:0.11.0/g' docker-compose.blockchain.yml
echo "   Trying with node version 0.11.0..."
docker compose -f docker-compose.blockchain.yml up -d node
if wait_for_node 120; then
    echo "🎉 Fix #3 worked! Older node version is running."
    echo "💡 You may want to keep this version in your docker-compose.blockchain.yml"
    exit 0
fi

# Restore original version
mv docker-compose.blockchain.yml.backup docker-compose.blockchain.yml

echo ""
echo "📋 Trying Fix #4: Remove platform specification"
sed -i.tmp '/platform: linux\/amd64/d' docker-compose.blockchain.yml
echo "   Trying without platform specification..."
docker stop midnight-forge-node
docker rm midnight-forge-node
docker compose -f docker-compose.blockchain.yml up -d node
if wait_for_node 120; then
    echo "🎉 Fix #4 worked! Node running without platform spec."
    exit 0
fi

# Restore original
mv docker-compose.blockchain.yml.backup docker-compose.blockchain.yml

echo ""
echo "❌ All automated fixes failed. Manual intervention needed."
echo ""
echo "🔍 Debug Information:"
echo "Run this to see what's happening:"
echo "   chmod +x debug-node.sh && ./debug-node.sh"
echo ""
echo "💡 Manual steps to try:"
echo "1. Check Docker memory allocation (needs 4GB+)"
echo "2. Try: docker system prune -f"
echo "3. Try: docker pull midnightnetwork/midnight-node:0.11.0"
echo "4. Check system logs: sudo journalctl -u docker.service --since '10 minutes ago'" 