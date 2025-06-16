# Testing Guide

## Quick Start

### 1. Start the Server
```bash
npm run dev
```

### 2. Run Tests

#### Using the Test Runner Script (Recommended)
```bash
# Run specific tests with logging
./run-tests.sh list           # NFT listing tests
./run-tests.sh metadata       # Metadata decoding tests
./run-tests.sh mint           # NFT minting tests
./run-tests.sh all            # All tests

# Run tests without logging (faster)
./run-tests.sh list-only      # No log file
./run-tests.sh metadata-only  # No log file
./run-tests.sh mint-only      # No log file
```

#### Using NPM Scripts Directly
```bash
# With automatic logging to files
npm run test:list      # Logs to logs/list-test-YYYYMMDD-HHMMSS.log
npm run test:metadata  # Logs to logs/metadata-test-YYYYMMDD-HHMMSS.log
npm run test:mint      # Logs to logs/mint-test-YYYYMMDD-HHMMSS.log
npm run test           # Logs to logs/all-tests-YYYYMMDD-HHMMSS.log

# Without logging (faster)
npm run test:list-only
npm run test:metadata-only
npm run test:mint-only
```

## Test Categories

### 1. **NFT Listing Tests** (`test:list`)
Tests the `/api/nfts/:contractAddress` endpoint:
- ✅ Empty contract handling
- ✅ Single NFT listing
- ✅ Multiple NFTs listing
- ✅ Metadata functionality (`?includeMetadata=true`)
- ✅ Error handling
- ✅ Consistency across calls

**Optimized Features:**
- Reuses single contract deployment
- Efficient NFT ID management
- Skips resource-heavy tests for performance

### 2. **Metadata Decoding Tests** (`test:metadata`)
Tests metadata hash generation and verification:
- ✅ Hash generation consistency
- ✅ Metadata integrity verification
- ✅ IPFS URI handling
- ✅ Unicode character support
- ✅ Real-world examples

**Key Concepts Demonstrated:**
- Metadata hash ≠ actual metadata
- SHA-256 verification process
- IPFS integration patterns

### 3. **NFT Minting Tests** (`test:mint`)
Tests the `/api/mint-nft` endpoint:
- ✅ Successful minting
- ✅ Parameter validation
- ✅ Error handling
- ✅ Multiple NFT minting

## Log Management

### View Recent Logs
```bash
./run-tests.sh logs
```

### View Specific Log File
```bash
cat logs/list-test-20241215-143022.log
```

### Follow Running Test
```bash
tail -f logs/list-test-20241215-143022.log
```

### Clean Old Logs
```bash
./run-tests.sh clean
```

### Manual Log Cleanup
```bash
# Remove logs older than 7 days
find logs/ -name "*.log" -mtime +7 -delete

# Remove all logs
rm logs/*.log
```

## Log File Format

Each log file contains:
- **Timestamp**: When the test was run
- **Test Output**: All console output from tests
- **Error Messages**: Both stdout and stderr
- **Test Results**: Pass/fail status for each test
- **Debug Information**: Detailed execution logs

Example log filename: `list-test-20241215-143022.log`
- `list-test`: Test type
- `20241215`: Date (YYYY-MM-DD)
- `143022`: Time (HH-MM-SS)

## Troubleshooting

### Server Not Running
```bash
❌ Server is not running on localhost:3001
ℹ️  Start the server with: npm run dev
```

**Solution**: Start the server in another terminal:
```bash
npm run dev
```

### Test Failures
1. Check the log file for detailed error messages
2. Ensure the blockchain services are running
3. Verify the ZK config path is correct
4. Check wallet initialization

### Performance Issues
- Use `-only` versions for faster execution without logging
- Clean old log files regularly
- Skip resource-heavy tests when not needed

## Advanced Usage

### Custom Test Runs
```bash
# Run specific test file directly
npx vitest tests/list-nfts.test.ts

# Run with specific reporter
npx vitest tests/list-nfts.test.ts --reporter=verbose

# Run in watch mode
npx vitest tests/list-nfts.test.ts --watch
```

### Environment Variables
```bash
# Custom server URL for tests
SERVER_URL=http://localhost:3002 npm run test:list-only

# Custom timeout
TIMEOUT=180000 npm run test:list-only
```

## Test Development

### Adding New Tests
1. Create test file in `tests/` directory
2. Add npm script in `package.json`
3. Update `run-tests.sh` if needed
4. Document in this guide

### Best Practices
- ✅ Reuse contracts when possible
- ✅ Use realistic test data
- ✅ Include proper error handling
- ✅ Add descriptive console logs
- ✅ Skip resource-heavy tests for optimization

## Examples

### Run List Tests with Metadata
```bash
# With logging
./run-tests.sh list

# Without logging (faster)
./run-tests.sh list-only
```

### Check Test Results
```bash
# View recent logs
./run-tests.sh logs

# View specific test log
cat logs/list-test-20241215-143022.log | grep "✅\|❌"
```

### Development Workflow
```bash
# 1. Start server
npm run dev

# 2. Run tests (in another terminal)
./run-tests.sh metadata-only

# 3. Check results
./run-tests.sh logs
``` 