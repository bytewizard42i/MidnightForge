#!/bin/bash

# =============================================================================
# MIDNIGHT FORGE - PLATFORM SETUP SCRIPT
# =============================================================================
# This script automatically configures Docker Compose for the correct platform
# (macOS or Linux) by detecting the OS and updating the blockchain configuration.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}MIDNIGHT FORGE - PLATFORM CONFIGURATION${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

detect_platform() {
    local os=$(uname -s)
    local arch=$(uname -m)
    
    print_info "Detected OS: $os"
    print_info "Detected Architecture: $arch"
    
    case "$os" in
        Darwin)
            if [[ "$arch" == "arm64" ]]; then
                PLATFORM_CONFIG="# Native macOS Apple Silicon - no platform specification needed"
                PLATFORM_SPEC=""
                HEALTHCHECK_CONFIG="native"
                print_success "Configured for macOS Apple Silicon"
            else
                PLATFORM_CONFIG="    platform: linux/amd64"
                PLATFORM_SPEC="linux/amd64"
                HEALTHCHECK_CONFIG="emulated"
                print_warning "Intel Mac detected - using Linux emulation"
            fi
            ;;
        Linux)
            PLATFORM_CONFIG="    platform: linux/amd64"
            PLATFORM_SPEC="linux/amd64"
            HEALTHCHECK_CONFIG="native"
            print_success "Configured for Linux x86_64"
            ;;
        *)
            print_error "Unsupported operating system: $os"
            echo "Supported platforms: macOS (Apple Silicon/Intel), Linux (x86_64)"
            exit 1
            ;;
    esac
}

configure_docker_compose() {
    local compose_file="docker-compose.blockchain.yml"
    local backup_file="${compose_file}.backup"
    
    print_info "Configuring Docker Compose for detected platform..."
    
    # Check if this is Mac M3 - if so, do ABSOLUTELY NOTHING
    if [[ "$(uname -s)" == "Darwin" && "$(uname -m)" == "arm64" ]]; then
        print_info "Mac M3 detected - leaving Docker Compose file completely untouched"
        print_success "No configuration needed for native Apple Silicon"
        return 0
    fi
    
    # Only for non-Mac M3 platforms: Intel Mac and Linux
    # Create backup
    cp "$compose_file" "$backup_file"
    
    # Remove any existing platform specification or comments
    sed -i.tmp '/platform: linux\/amd64/d' "$compose_file"
    sed -i.tmp '/# Native macOS Apple Silicon/d' "$compose_file"
    
    # Add platform configuration (only for Intel Mac/Linux)
    if [[ -n "$PLATFORM_SPEC" ]]; then
        # Add platform specification after the image line for Intel Mac/Linux
        awk -v config="$PLATFORM_CONFIG" '
        /image: '\''midnightnetwork\/midnight-node:0.12.0'\''/ { 
            print; 
            print config; 
            next 
        } 
        1' "$compose_file" > "${compose_file}.new" && mv "${compose_file}.new" "$compose_file"
        print_info "Platform specification added to Docker Compose"
    fi
    
    # Configure healthcheck based on platform
    if [[ "$HEALTHCHECK_CONFIG" == "emulated" ]]; then
        # Increase timeouts for emulated environments
        sed -i.tmp 's/interval: 5s/interval: 10s/g' "$compose_file"
        sed -i.tmp 's/timeout: 10s/timeout: 15s/g' "$compose_file"
        sed -i.tmp 's/start_period: 120s/start_period: 180s/g' "$compose_file"
        print_info "Extended timeouts for emulated environment"
    fi
    
    # Clean up temp files
    rm -f "${compose_file}.tmp"
    
    print_success "Docker Compose configured successfully"
}

show_configuration() {
    print_info "Current configuration:"
    echo "  • Platform: $(uname -s) $(uname -m)"
    echo "  • Docker Platform: ${PLATFORM_SPEC:-"native"}"
    echo "  • Healthcheck: $HEALTHCHECK_CONFIG"
    echo ""
    
    if [[ -n "$PLATFORM_SPEC" ]]; then
        print_info "Platform specification added to docker-compose.blockchain.yml"
    else
        print_info "Using native platform (no specification needed)"
    fi
}

restore_backup() {
    local compose_file="docker-compose.blockchain.yml"
    local backup_file="${compose_file}.backup"
    
    if [[ -f "$backup_file" ]]; then
        mv "$backup_file" "$compose_file"
        print_success "Restored original configuration"
    else
        print_warning "No backup found to restore"
    fi
}

show_help() {
    print_header
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  configure - Auto-configure for current platform (default)"
    echo "  restore   - Restore original configuration"
    echo "  show      - Show current platform detection"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Auto-configure for current platform"
    echo "  $0 configure          # Same as above"
    echo "  $0 show               # Show platform info without changes"
    echo "  $0 restore            # Restore backup"
    echo ""
    echo "Supported platforms:"
    echo "  - macOS Apple Silicon (native)"
    echo "  - macOS Intel (emulated)"
    echo "  - Linux x86_64 (native)"
}

# Main script logic
case "${1:-configure}" in
    "configure")
        print_header
        detect_platform
        configure_docker_compose
        show_configuration
        ;;
    "show")
        print_header
        detect_platform
        show_configuration
        ;;
    "restore")
        print_header
        restore_backup
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 