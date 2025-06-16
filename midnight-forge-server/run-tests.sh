#!/bin/bash

# Test Runner Script for MidnightForge Server
# Usage: ./run-tests.sh [test-type]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}🧪 MidnightForge Test Runner${NC}"
    echo ""
    echo "Usage: $0 [test-type]"
    echo ""
    echo "Available test types:"
    echo "  mint      - Run NFT minting tests (with logging)"
    echo "  list      - Run NFT listing tests (with logging)"
    echo "  metadata  - Run metadata decoding tests (with logging)"
    echo "  all       - Run all tests (with logging)"
    echo ""
    echo "Specific test sections:"
    echo "  list-metadata  - Run only 'Metadata Functionality' from list tests"
    echo ""
    echo "No-logging versions (faster, no file output):"
    echo "  mint-only      - Run minting tests without logging"
    echo "  list-only      - Run listing tests without logging"
    echo "  metadata-only  - Run metadata tests without logging"
    echo "  list-metadata-only - Run only 'Metadata Functionality' without logging"
    echo ""
    echo "Utility commands:"
    echo "  logs      - Show recent log files"
    echo "  clean     - Clean old log files"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 list           # Run list tests with logging"
    echo "  $0 list-only      # Run list tests without logging (faster)"
    echo "  $0 list-metadata  # Run only metadata functionality from list tests"
    echo "  $0 metadata       # Run metadata tests with logging"
    echo "  $0 logs           # Show recent logs"
}

# Function to show recent logs
show_logs() {
    print_info "Recent test log files:"
    if ls logs/*.log 1> /dev/null 2>&1; then
        ls -la logs/*.log | tail -10
        echo ""
        print_info "To view a log file: cat logs/[filename]"
        print_info "To follow a running test: tail -f logs/[filename]"
    else
        print_warning "No log files found in logs/ directory"
    fi
}

# Function to clean old logs
clean_logs() {
    print_info "Cleaning log files older than 7 days..."
    if find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null; then
        print_success "Old log files cleaned"
    else
        print_warning "No old log files to clean"
    fi
    
    print_info "Current log files:"
    ls -la logs/ || print_info "Logs directory is empty"
}

# Function to check if server is running
check_server() {
    print_info "Checking if server is running on localhost:3001..."
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Server is running"
        return 0
    else
        print_warning "Server is not running on localhost:3001"
        print_info "Start the server with: npm run dev"
        return 1
    fi
}

# Main script logic
case "${1:-help}" in
    "mint")
        print_info "Running NFT minting tests with logging..."
        check_server || exit 1
        npm run test:mint
        print_success "Minting tests completed. Check logs/ for detailed output."
        ;;
    "list")
        print_info "Running NFT listing tests with logging..."
        check_server || exit 1
        npm run test:list
        print_success "Listing tests completed. Check logs/ for detailed output."
        ;;
    "metadata")
        print_info "Running metadata decoding tests with logging..."
        check_server || exit 1
        npm run test:metadata
        print_success "Metadata tests completed. Check logs/ for detailed output."
        ;;
    "all")
        print_info "Running all tests with logging..."
        check_server || exit 1
        npm run test
        print_success "All tests completed. Check logs/ for detailed output."
        ;;
    "mint-only")
        print_info "Running NFT minting tests (no logging)..."
        check_server || exit 1
        npm run test:mint-only
        ;;
    "list-only")
        print_info "Running NFT listing tests (no logging)..."
        check_server || exit 1
        npm run test:list-only
        ;;
    "metadata-only")
        print_info "Running metadata decoding tests (no logging)..."
        check_server || exit 1
        npm run test:metadata-only
        ;;
    "list-metadata")
        print_info "Running 'Metadata Functionality' tests from list tests (with logging)..."
        check_server || exit 1
        npx vitest tests/list-nfts.test.ts -t "Metadata Functionality" 2>&1 | tee logs/list-metadata-test-$(date +%Y%m%d-%H%M%S).log
        print_success "Metadata functionality tests completed. Check logs/ for detailed output."
        ;;
    "list-metadata-only")
        print_info "Running 'Metadata Functionality' tests from list tests (no logging)..."
        check_server || exit 1
        npx vitest tests/list-nfts.test.ts -t "Metadata Functionality"
        ;;
    "logs")
        show_logs
        ;;
    "clean")
        clean_logs
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        print_error "Unknown test type: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac 