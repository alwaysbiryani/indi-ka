#!/bin/bash

# Setup script for running Indi-ka QA Agent on a fresh Ubuntu VM

set -e

echo "🚀 Setting up Indi-ka QA Environment..."

# 1. Update system
sudo apt-get update
sudo apt-get upgrade -y

# 2. Install Node.js (LTS)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Clone Repo (If not already in a project dir)
# git clone <your-repo-url>
# cd indi-ka

# 4. Install Dependencies
echo "Installing project dependencies..."
npm install

# 5. Install Playwright Browsers and System Dependencies
echo "Installing Playwright browsers..."
sudo npx playwright install-deps
npx playwright install chromium webkit firefox

# 6. Build App
echo "Building application..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "To run the QA Agent, use:"
echo "LINEAR_API_KEY=your_key npm run qa:post-deploy"
echo ""
echo "Note: For visual regressions to stay consistent, always use the same OS (e.g., Ubuntu) for baseline generation and testing."
