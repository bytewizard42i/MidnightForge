#!/bin/bash

# =============================================================================
# MIDNIGHT FORGE - COMPACT COMPILER SETUP SCRIPT
# =============================================================================
# This script automatically downloads and sets up the Compact compiler
# for the Midnight blockchain development environment.
#
# Usage:
#   ./setup-compact.sh install    # Download and install Compact compiler
#   ./setup-compact.sh check      # Check if Compact compiler is available
#   ./setup-compact.sh unset      # Unset COMPACT_HOME for testing
#   ./setup-compact.sh help       # Show this help
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compact compiler configuration
COMPACT_VERSION="0.23.0"
COMPACT_DIR="compactc_v${COMPACT_VERSION}_aarch64-darwin"
COMPACT_ZIP="${COMPACT_DIR}.zip"

# Detect OS and architecture
detect_platform() {
    local os=$(uname -s)
    local arch=$(uname -m)
    
    case "$os" in
        Darwin)
            if [[ "$arch" == "arm64" ]]; then
                COMPACT_URL="https://d3fazakqrumx6p.cloudfront.net/artifacts/compiler/compactc_${COMPACT_VERSION}/compactc_v${COMPACT_VERSION}_aarch64-darwin.zip"
                COMPACT_DIR="compactc_v${COMPACT_VERSION}_aarch64-darwin"
            else
                echo -e "${RED}❌ Unsupported macOS architecture: $arch${NC}"
                echo "Only Apple Silicon (arm64) is supported for macOS"
                exit 1
            fi
            ;;
        Linux)
            COMPACT_URL="https://d3fazakqrumx6p.cloudfront.net/artifacts/compiler/compactc_${COMPACT_VERSION}/compactc_v${COMPACT_VERSION}_x86_64-unknown-linux-musl.zip"
            COMPACT_DIR="compactc_v${COMPACT_VERSION}_x86_64-unknown-linux-musl"
            ;;
        *)
            echo -e "${RED}❌ Unsupported operating system: $os${NC}"
            echo "Supported platforms: macOS (Apple Silicon), Linux (x86_64)"
            exit 1
            ;;
    esac
    
    COMPACT_ZIP="${COMPACT_DIR}.zip"
}

# Functions
print_header() {
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}MIDNIGHT FORGE - COMPACT COMPILER SETUP${NC}"
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

check_dependencies() {
    if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
        print_error "Neither curl nor wget is available. Please install one of them."
        exit 1
    fi
    
    if ! command -v unzip &> /dev/null; then
        print_error "unzip is not available. Please install unzip."
        exit 1
    fi
}

check_compact() {
    print_header
    print_info "Checking Compact compiler installation..."
    
    if [[ -n "${COMPACT_HOME:-}" ]]; then
        if [[ -f "$COMPACT_HOME/bin/compactc" ]]; then
            print_success "Compact compiler found at: $COMPACT_HOME"
            print_info "Version check:"
            "$COMPACT_HOME/bin/compactc" --version || true
            return 0
        else
            print_warning "COMPACT_HOME is set but compiler not found at: $COMPACT_HOME"
        fi
    else
        print_warning "COMPACT_HOME environment variable is not set"
    fi
    
    # Check if compiler exists in current directory
    if [[ -f "./$COMPACT_DIR/bin/compactc" ]]; then
        print_info "Compact compiler found in current directory: ./$COMPACT_DIR"
        print_info "You can set COMPACT_HOME with:"
        echo "export COMPACT_HOME=$(pwd)/$COMPACT_DIR"
        return 0
    fi
    
    print_error "Compact compiler not found"
    print_info "Run: ./setup-compact.sh install"
    return 1
}

install_compact() {
    print_header
    print_info "Installing Compact compiler v${COMPACT_VERSION}..."
    
    detect_platform
    check_dependencies
    
    # Check if already installed
    if [[ -d "$COMPACT_DIR" ]]; then
        print_warning "Compact compiler directory already exists: $COMPACT_DIR"
        print_info "Checking if installation is complete..."
        
        if [[ -f "$COMPACT_DIR/bin/compactc" ]]; then
            print_success "Compact compiler is already installed!"
            print_info "Setting COMPACT_HOME environment variable..."
            export COMPACT_HOME="$(pwd)/$COMPACT_DIR"
            
            print_success "Installation complete!"
            return 0
        else
            print_warning "Directory exists but installation seems incomplete. Removing..."
            rm -rf "$COMPACT_DIR"
        fi
    fi
    
    print_info "Downloading Compact compiler from: $COMPACT_URL"
    
    # Download the compiler
    if command -v curl &> /dev/null; then
        curl -L -o "$COMPACT_ZIP" "$COMPACT_URL"
    else
        wget -O "$COMPACT_ZIP" "$COMPACT_URL"
    fi
    
    print_info "Extracting compiler..."
    
    # Create directory and extract into it
    mkdir -p "$COMPACT_DIR/bin"
    unzip -q "$COMPACT_ZIP" -d "$COMPACT_DIR"
    
    # Move files to proper locations
    if [[ -f "$COMPACT_DIR/compactc" ]]; then
        mv "$COMPACT_DIR/compactc" "$COMPACT_DIR/bin/"
        chmod +x "$COMPACT_DIR/bin/compactc"
    fi
    if [[ -f "$COMPACT_DIR/compactc.bin" ]]; then
        mv "$COMPACT_DIR/compactc.bin" "$COMPACT_DIR/bin/"
    fi
    if [[ -f "$COMPACT_DIR/zkir" ]]; then
        mv "$COMPACT_DIR/zkir" "$COMPACT_DIR/bin/"
        chmod +x "$COMPACT_DIR/bin/zkir"
    fi
    
    # Verify installation
    if [[ -f "$COMPACT_DIR/bin/compactc" ]]; then
        print_success "Compact compiler extracted successfully!"
        
        # Set environment variable
        export COMPACT_HOME="$(pwd)/$COMPACT_DIR"
        
        # Add to shell profiles
        print_info "Adding COMPACT_HOME to shell profiles..."
        local compact_export="export COMPACT_HOME=\"$(pwd)/$COMPACT_DIR\""
        
        # Check if already in shell profiles to avoid duplicates
        if [[ -f ~/.bashrc ]] && ! grep -q "COMPACT_HOME.*$COMPACT_DIR" ~/.bashrc 2>/dev/null; then
            echo "$compact_export" >> ~/.bashrc 2>/dev/null || true
        fi
        if [[ -f ~/.zshrc ]] && ! grep -q "COMPACT_HOME.*$COMPACT_DIR" ~/.zshrc 2>/dev/null; then
            echo "$compact_export" >> ~/.zshrc 2>/dev/null || true
        fi
        
        print_success "Installation complete!"
        print_info "COMPACT_HOME set to: $COMPACT_HOME"
        print_info "Compiler version:"
        "$COMPACT_HOME/bin/compactc" --version
        
        # Clean up
        rm -f "$COMPACT_ZIP"
        
    else
        print_error "Installation failed - compiler binary not found"
        exit 1
    fi
}

unset_compact() {
    print_header
    print_info "Unsetting COMPACT_HOME for testing purposes..."
    
    unset COMPACT_HOME
    print_success "COMPACT_HOME has been unset in current session"
    print_warning "Note: This only affects the current shell session"
    print_info "To permanently remove from shell profiles, edit ~/.bashrc and ~/.zshrc manually"
}

show_help() {
    print_header
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  install   - Download and install Compact compiler"
    echo "  check     - Check if Compact compiler is available"
    echo "  unset     - Unset COMPACT_HOME for testing"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install                  # Install Compact compiler"
    echo "  $0 check                    # Check installation"
    echo "  $0 unset                    # Unset for testing"
    echo ""
    echo "Environment:"
    echo "  COMPACT_HOME - Path to Compact compiler installation"
    echo ""
    echo "Supported platforms:"
    echo "  - macOS (Apple Silicon)"
    echo "  - Linux (x86_64)"
}

# Main script logic
case "${1:-help}" in
    "install")
        install_compact
        ;;
    "check")
        check_compact
        ;;
    "unset")
        unset_compact
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