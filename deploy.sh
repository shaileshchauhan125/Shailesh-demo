#!/bin/bash

# Quick deployment script for Ludo PWA
echo "🎲 Deploying Ludo PWA..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git branch -M main
fi

# Add all files
echo "Adding files to git..."
git add .

# Commit with timestamp
echo "Committing changes..."
git commit -m "PWA Update - $(date '+%Y-%m-%d %H:%M:%S')"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "⚠️  No GitHub remote found!"
    echo "Please:"
    echo "1. Create a new repository on GitHub"
    echo "2. Run: git remote add origin https://github.com/yourusername/yourrepo.git"
    echo "3. Run this script again"
    echo ""
    exit 1
fi

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "🚀 Next steps:"
echo "1. Go to netlify.com"
echo "2. Click 'New site from Git'"
echo "3. Connect your GitHub repository"
echo "4. Set publish directory to: public"
echo "5. Deploy!"
echo ""
echo "Your PWA will be available at: https://yoursite.netlify.app"
echo "🎮 Happy gaming!"
