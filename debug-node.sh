#!/bin/bash

echo "🔍 Debugging Midnight Node Startup Issue"
echo "========================================"

echo ""
echo "📊 Docker System Info:"
docker system info | grep -E "(Total Memory|CPUs|Operating System|Architecture)"

echo ""
echo "📋 Container Status:"
docker ps -a | grep midnight-forge

echo ""
echo "🔍 Node Container Logs (last 50 lines):"
docker logs midnight-forge-node --tail=50

echo ""
echo "🌐 Network Connectivity Test:"
echo "Testing if node port is accessible..."
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/localhost/9944' && echo "✅ Port 9944 is open" || echo "❌ Port 9944 is not accessible"

echo ""
echo "🔍 Node Health Check Test:"
echo "Testing health endpoint directly..."
curl -v http://localhost:9944/health 2>&1 | head -20

echo ""
echo "📈 Container Resource Usage:"
docker stats midnight-forge-node --no-stream

echo ""
echo "🔍 Container Inspect (key info):"
docker inspect midnight-forge-node | jq -r '.[] | {State: .State, Config: .Config.Env, NetworkSettings: .NetworkSettings.Ports}'

echo ""
echo "💡 Suggested Actions:"
echo "1. Check the node logs above for error messages"
echo "2. Try restarting: docker restart midnight-forge-node"
echo "3. Try different node version: edit docker-compose.blockchain.yml"
echo "4. Check system resources (memory should be 4GB+)" 