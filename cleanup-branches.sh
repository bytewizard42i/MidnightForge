#!/bin/bash

# Fetch the latest changes from the remote
git fetch origin

# Get the list of remote branches
remote_branches=$(git branch -r | grep -v '\->' | sed 's/origin\///')

# Get the list of merged branches
merged_branches=$(git branch -r --merged origin/main | grep -v '\->' | grep 'dependabot' | sed 's/origin\///')

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
