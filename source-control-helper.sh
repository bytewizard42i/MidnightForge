#!/bin/bash

# Function to display help
show_help() {
    echo "Source Control Helper"
    echo "====================="
    echo "This script helps manage the source control setup for the MidnightForge project."
    echo ""
    echo "Usage: ./source-control-helper.sh [command]"
    echo ""
    echo "Commands:"
    echo "  status        - Show the current status of the repository"
    echo "  cleanup       - Clean up stale branches and prune remote branches"
    echo "  ignore        - Update .gitignore files to ignore generated files"
    echo "  sync          - Sync with the remote repository"
    echo "  help          - Show this help message"
    echo ""
}

# Function to show the current status of the repository
show_status() {
    echo "Repository Status"
    echo "================="
    echo ""
    
    echo "Current branch:"
    git branch --show-current
    echo ""
    
    echo "Local branches:"
    git branch
    echo ""
    
    echo "Remote branches:"
    git branch -r
    echo ""
    
    echo "Git status:"
    git status -s
    echo ""
    
    echo "Unpushed commits:"
    git log --branches --not --remotes
    echo ""
}

# Function to clean up stale branches and prune remote branches
cleanup_branches() {
    echo "Cleaning up branches"
    echo "===================="
    echo ""
    
    echo "Pruning remote branches..."
    git remote prune origin
    echo ""
    
    echo "Checking for merged branches..."
    merged_branches=$(git branch -r --merged origin/main | grep -v '\->' | grep 'dependabot' | sed 's/origin\///')
    
    if [ -n "$merged_branches" ]; then
        echo "The following branches have been merged into main and can be deleted:"
        echo "$merged_branches"
        echo ""
        echo "Do you want to delete these branches? (y/n)"
        read -r answer
        
        if [[ $answer =~ ^[Yy]$ ]]; then
            for branch in $merged_branches; do
                echo "Deleting branch $branch..."
                git push origin --delete "$branch"
            done
            echo "Branches deleted successfully."
        else
            echo "No branches were deleted."
        fi
    else
        echo "No merged branches found."
    fi
    echo ""
    
    echo "Checking for branches that are not tracking a remote branch..."
    gone_branches=$(git branch -vv | grep ': gone]' | awk '{print $1}')
    
    if [ -n "$gone_branches" ]; then
        echo "The following branches are not tracking a remote branch and can be deleted:"
        echo "$gone_branches"
        echo ""
        echo "Do you want to delete these branches? (y/n)"
        read -r answer
        
        if [[ $answer =~ ^[Yy]$ ]]; then
            for branch in $gone_branches; do
                echo "Deleting branch $branch..."
                git branch -D "$branch"
            done
            echo "Branches deleted successfully."
        else
            echo "No branches were deleted."
        fi
    else
        echo "No branches without tracking found."
    fi
    echo ""
}

# Function to update .gitignore files to ignore generated files
update_ignore_files() {
    echo "Updating .gitignore files"
    echo "========================="
    echo ""
    
    echo "Updating root .gitignore file..."
    cat > .gitignore << EOF
# Node.js
node_modules/
dist/
build/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo

# Logs
logs
*.log
logs/*.log
midnight-level-db
coverage

# Test reports
**/reports

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# MacOS
.DS_Store

# VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# IDEs and editors
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln

# Compact
managed/
EOF
    echo "Root .gitignore file updated."
    echo ""
    
    echo "Updating contract/.gitignore file..."
    cat > contract/.gitignore << EOF
# Ignore managed directory - generated files from Compact compiler
src/managed/

# Ignore dist directory - build output
dist/

# Ignore reports directory - test reports
reports/

# Ignore test files we created
src/test.compact
src/minimal.compact

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo

# Logs
logs
*.log
EOF
    echo "Contract .gitignore file updated."
    echo ""
    
    echo "Updating .git/info/exclude file..."
    cat > .git/info/exclude << EOF
# git ls-files --others --exclude-from=.git/info/exclude
# Lines that start with '#' are comments.
# For a project mostly in C, the following would be a good set of
# exclude patterns (uncomment them if you want to use them):
# *.[oa]
# *~

# Ignore managed directory
contract/src/managed/

# Ignore dist directory
contract/dist/

# Ignore reports directory
contract/reports/
EOF
    echo ".git/info/exclude file updated."
    echo ""
    
    echo "Do you want to commit these changes? (y/n)"
    read -r answer
    
    if [[ $answer =~ ^[Yy]$ ]]; then
        git add .gitignore contract/.gitignore
        git commit -m "chore: update .gitignore files to ignore generated files"
        echo "Changes committed successfully."
    else
        echo "Changes not committed."
    fi
    echo ""
}

# Function to sync with the remote repository
sync_with_remote() {
    echo "Syncing with remote repository"
    echo "=============================="
    echo ""
    
    echo "Fetching from remote..."
    git fetch origin
    echo ""
    
    echo "Pulling changes..."
    git pull
    echo ""
    
    echo "Pushing changes..."
    git push
    echo ""
}

# Main script
case "$1" in
    status)
        show_status
        ;;
    cleanup)
        cleanup_branches
        ;;
    ignore)
        update_ignore_files
        ;;
    sync)
        sync_with_remote
        ;;
    help|*)
        show_help
        ;;
esac
