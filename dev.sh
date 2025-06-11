#!/bin/bash

# MidnightForge Development Helper Script
# This script automates common development tasks

# Function to display help
show_help() {
    echo "MidnightForge Development Helper"
    echo "==============================="
    echo "This script automates common development tasks for the MidnightForge project."
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup        - Set up the development environment"
    echo "  build        - Build the project"
    echo "  test         - Run tests"
    echo "  clean        - Clean build artifacts"
    echo "  new-branch   - Create a new branch"
    echo "  pr           - Create a pull request"
    echo "  help         - Show this help message"
    echo ""
}

# Function to set up the development environment
setup_environment() {
    echo "Setting up development environment"
    echo "================================="
    echo ""
    
    echo "Installing dependencies..."
    npm install
    echo ""
    
    echo "Setting up Compact compiler..."
    if [ -d "/home/js/utils_Midnight/my-binaries/compactc" ]; then
        echo "Compact compiler found at /home/js/utils_Midnight/my-binaries/compactc"
        echo "Adding to PATH..."
        export PATH="/home/js/utils_Midnight/my-binaries/compactc:$PATH"
        echo "export PATH=\"/home/js/utils_Midnight/my-binaries/compactc:\$PATH\"" >> ~/.bashrc
        echo "Compact compiler added to PATH."
    else
        echo "Compact compiler not found at /home/js/utils_Midnight/my-binaries/compactc"
        echo "Please install the Compact compiler and update COMPILER_SETUP.md accordingly."
    fi
    echo ""
    
    echo "Creating managed directory..."
    mkdir -p contract/src/managed/counter
    echo ""
    
    echo "Setup complete!"
    echo ""
}

# Function to build the project
build_project() {
    echo "Building project"
    echo "==============="
    echo ""
    
    echo "Compiling contracts..."
    cd contract && npm run compact
    
    echo "Building TypeScript code..."
    npm run build
    cd ..
    echo ""
    
    echo "Build complete!"
    echo ""
}

# Function to run tests
run_tests() {
    echo "Running tests"
    echo "============"
    echo ""
    
    echo "Running contract tests..."
    cd contract && npm test
    cd ..
    echo ""
    
    echo "Tests complete!"
    echo ""
}

# Function to clean build artifacts
clean_artifacts() {
    echo "Cleaning build artifacts"
    echo "======================="
    echo ""
    
    echo "Removing managed directory..."
    rm -rf contract/src/managed
    
    echo "Removing dist directory..."
    rm -rf contract/dist
    
    echo "Removing reports directory..."
    rm -rf contract/reports
    
    echo "Removing node_modules..."
    rm -rf node_modules
    rm -rf contract/node_modules
    rm -rf counter-cli/node_modules
    
    echo "Clean complete!"
    echo ""
}

# Function to create a new branch
create_branch() {
    echo "Creating new branch"
    echo "=================="
    echo ""
    
    echo "Enter branch type (feature, fix, docs, chore):"
    read -r branch_type
    
    echo "Enter branch name (e.g., add-wallet-support):"
    read -r branch_name
    
    branch="${branch_type}/${branch_name}"
    
    echo "Creating branch ${branch}..."
    git checkout -b "${branch}"
    
    echo "Branch created successfully!"
    echo ""
}

# Function to create a pull request
create_pr() {
    echo "Creating pull request"
    echo "===================="
    echo ""
    
    echo "Enter pull request title:"
    read -r pr_title
    
    echo "Enter pull request description:"
    read -r pr_description
    
    echo "Pushing branch..."
    git push -u origin "$(git branch --show-current)"
    
    echo "Pull request URL:"
    echo "https://github.com/bytewizard42i/MidnightForge/pull/new/$(git branch --show-current)"
    echo ""
    
    echo "Please visit the URL above to create the pull request."
    echo ""
}

# Main script
case "$1" in
    setup)
        setup_environment
        ;;
    build)
        build_project
        ;;
    test)
        run_tests
        ;;
    clean)
        clean_artifacts
        ;;
    new-branch)
        create_branch
        ;;
    pr)
        create_pr
        ;;
    help|*)
        show_help
        ;;
esac
