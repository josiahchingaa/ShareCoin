#!/bin/bash

# ========================================
# CoinShares One-Click Deploy Script
# ========================================
# Usage: bash deploy.sh
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY="/c/Users/Admin/.ssh/id_ed25519"
SERVER="root@147.93.123.174"
REMOTE_PATH="/var/www/coinshares"
LOCAL_PATH="/c/Users/Admin/Desktop/Coinshares/ShareCoin"

echo ""
echo "=========================================="
echo "   CoinShares Deployment Script"
echo "=========================================="
echo ""

# Step 1: Test SSH Connection
echo -e "${YELLOW}[1/6]${NC} Testing SSH connection..."
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER "echo 'connected'" > /dev/null 2>&1; then
    echo -e "${GREEN}       SSH connection OK${NC}"
else
    echo -e "${RED}       SSH connection FAILED${NC}"
    echo "       Please check your SSH key and server status."
    exit 1
fi

# Step 2: Create archive
echo -e "${YELLOW}[2/6]${NC} Creating deployment archive..."
cd "$LOCAL_PATH"
tar --exclude=node_modules \
    --exclude=.git \
    --exclude=.next \
    --exclude=CREDENTIALS_SECURE.md \
    --exclude=DEPLOYMENT_GUIDE.md \
    --exclude='*.tar.gz' \
    -czf ../coinshares-deploy.tar.gz .
echo -e "${GREEN}       Archive created${NC}"

# Step 3: Upload to server
echo -e "${YELLOW}[3/6]${NC} Uploading to server..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no ../coinshares-deploy.tar.gz $SERVER:/var/www/
echo -e "${GREEN}       Upload complete${NC}"

# Step 4: Extract files
echo -e "${YELLOW}[4/6]${NC} Extracting files on server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER "cd $REMOTE_PATH && tar -xzf ../coinshares-deploy.tar.gz"
echo -e "${GREEN}       Files extracted${NC}"

# Step 5: Build application
echo -e "${YELLOW}[5/6]${NC} Building application (this may take a minute)..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER "cd $REMOTE_PATH && npm run build" > /dev/null 2>&1
echo -e "${GREEN}       Build complete${NC}"

# Step 6: Restart PM2
echo -e "${YELLOW}[6/6]${NC} Restarting application..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER "pm2 restart coinshares" > /dev/null 2>&1
echo -e "${GREEN}       Application restarted${NC}"

# Cleanup
rm -f ../coinshares-deploy.tar.gz

echo ""
echo "=========================================="
echo -e "${GREEN}   DEPLOYMENT SUCCESSFUL!${NC}"
echo "=========================================="
echo ""
echo "   Live URL: https://coinshares.app"
echo ""
echo "   Useful commands:"
echo "   - Check status: ssh -i \"$SSH_KEY\" $SERVER \"pm2 status\""
echo "   - View logs:    ssh -i \"$SSH_KEY\" $SERVER \"pm2 logs coinshares\""
echo ""
