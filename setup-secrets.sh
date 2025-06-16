#!/bin/bash

# =============================================================================
# MIDNIGHT FORGE - SECRETS MANAGEMENT SCRIPT
# =============================================================================
# This script helps manage encrypted environment variables using SOPS + age
#
# Usage:
#   ./setup-secrets.sh encrypt    # Encrypt .env.secrets -> .env.secrets.enc
#   ./setup-secrets.sh decrypt    # Decrypt .env.secrets.enc -> .env.secrets
#   ./setup-secrets.sh edit       # Edit encrypted secrets directly
#   ./setup-secrets.sh setup      # Initial setup for new developers
#   ./setup-secrets.sh help       # Show this help
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Files
SECRETS_FILE=".env.secrets"
ENCRYPTED_FILE=".env.secrets.enc"
EXAMPLE_FILE=".env.example"
KEY_FILE="key.txt"
SOPS_CONFIG=".sops.yaml"

# Functions
print_header() {
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}MIDNIGHT FORGE - SECRETS MANAGEMENT${NC}"
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
    if ! command -v sops &> /dev/null; then
        print_error "SOPS is not installed. Please install it first:"
        echo "  macOS: brew install sops"
        echo "  Linux: https://github.com/getsops/sops/releases"
        exit 1
    fi

    if ! command -v age &> /dev/null; then
        print_error "age is not installed. Please install it first:"
        echo "  macOS: brew install age"
        echo "  Linux: https://github.com/FiloSottile/age/releases"
        exit 1
    fi
}

setup_initial() {
    print_header
    print_info "Setting up secrets management for new developers..."
    
    check_dependencies
    
    # Check if key file exists
    if [[ ! -f "$KEY_FILE" ]]; then
        print_error "Encryption key file '$KEY_FILE' not found!"
        print_info "Please ask a team member for the key file, or generate a new one:"
        echo "  age-keygen -o $KEY_FILE"
        exit 1
    fi
    
    # Check if encrypted secrets exist
    if [[ ! -f "$ENCRYPTED_FILE" ]]; then
        print_error "Encrypted secrets file '$ENCRYPTED_FILE' not found!"
        print_info "Please make sure the encrypted secrets are committed to the repository."
        exit 1
    fi
    
    # Decrypt secrets for local development
    decrypt_secrets
    
    print_success "Setup complete! You can now run the project."
    print_info "Remember: Never commit the unencrypted '$SECRETS_FILE' file!"
}

encrypt_secrets() {
    print_header
    print_info "Encrypting secrets..."
    
    check_dependencies
    
    if [[ ! -f "$SECRETS_FILE" ]]; then
        print_error "Secrets file '$SECRETS_FILE' not found!"
        print_info "Create it first by copying from the example:"
        echo "  cp $EXAMPLE_FILE $SECRETS_FILE"
        exit 1
    fi
    
    if [[ ! -f "$KEY_FILE" ]]; then
        print_error "Encryption key file '$KEY_FILE' not found!"
        exit 1
    fi
    
    # Encrypt the file
    sops --encrypt --input-type dotenv --output-type dotenv "$SECRETS_FILE" > "$ENCRYPTED_FILE"
    
    print_success "Secrets encrypted to '$ENCRYPTED_FILE'"
    print_warning "You can now safely commit '$ENCRYPTED_FILE' to version control"
    print_warning "DO NOT commit the unencrypted '$SECRETS_FILE' file!"
}

decrypt_secrets() {
    print_header
    print_info "Decrypting secrets..."
    
    check_dependencies
    
    if [[ ! -f "$ENCRYPTED_FILE" ]]; then
        print_error "Encrypted secrets file '$ENCRYPTED_FILE' not found!"
        exit 1
    fi
    
    if [[ ! -f "$KEY_FILE" ]]; then
        print_error "Encryption key file '$KEY_FILE' not found!"
        print_info "Please ask a team member for the key file."
        exit 1
    fi
    
    # Set the age key environment variable
    export SOPS_AGE_KEY_FILE="$KEY_FILE"
    
    # Decrypt the file
    sops --decrypt --input-type dotenv --output-type dotenv "$ENCRYPTED_FILE" > "$SECRETS_FILE"
    
    print_success "Secrets decrypted to '$SECRETS_FILE'"
    print_warning "Remember: This file contains sensitive data and should not be committed!"
}

edit_secrets() {
    print_header
    print_info "Editing encrypted secrets..."
    
    check_dependencies
    
    if [[ ! -f "$ENCRYPTED_FILE" ]]; then
        print_error "Encrypted secrets file '$ENCRYPTED_FILE' not found!"
        exit 1
    fi
    
    if [[ ! -f "$KEY_FILE" ]]; then
        print_error "Encryption key file '$KEY_FILE' not found!"
        exit 1
    fi
    
    # Set the age key environment variable
    export SOPS_AGE_KEY_FILE="$KEY_FILE"
    
    # Edit the encrypted file directly
    sops --input-type dotenv --output-type dotenv "$ENCRYPTED_FILE"
    
    print_success "Encrypted secrets updated!"
}

show_help() {
    print_header
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Initial setup for new developers (decrypt secrets)"
    echo "  encrypt   - Encrypt .env.secrets -> .env.secrets.enc"
    echo "  decrypt   - Decrypt .env.secrets.enc -> .env.secrets"
    echo "  edit      - Edit encrypted secrets directly"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup                    # First time setup"
    echo "  $0 encrypt                  # After editing secrets"
    echo "  $0 decrypt                  # To get latest secrets"
    echo "  $0 edit                     # Quick edit encrypted file"
    echo ""
    echo "Files:"
    echo "  $SECRETS_FILE      - Unencrypted secrets (DO NOT COMMIT)"
    echo "  $ENCRYPTED_FILE    - Encrypted secrets (safe to commit)"
    echo "  $EXAMPLE_FILE       - Example/template file"
    echo "  $KEY_FILE           - Encryption key (DO NOT COMMIT)"
    echo "  $SOPS_CONFIG        - SOPS configuration"
}

# Main script logic
case "${1:-help}" in
    "setup")
        setup_initial
        ;;
    "encrypt")
        encrypt_secrets
        ;;
    "decrypt")
        decrypt_secrets
        ;;
    "edit")
        edit_secrets
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