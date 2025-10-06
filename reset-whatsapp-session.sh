#!/bin/bash

# Reset WhatsApp Session Script
echo "🔄 RESET WHATSAPP SESSION"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Step 1: Stop all services
echo -e "${RED}🛑 Stopping all services...${NC}"
pkill -f node
pkill -f npm
pkill -f whatsapp
fuser -k 3000/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null
sleep 3
echo -e "${GREEN}✅ All services stopped${NC}"

# Step 2: Navigate to project
cd /root/tahapdev || exit 1

# Step 3: Delete WhatsApp session files
echo -e "${YELLOW}🗑️ Deleting WhatsApp session files...${NC}"

# Remove all possible session locations
rm -rf auth_info_baileys
rm -rf server/auth_info_baileys
rm -rf scripts/auth_info_baileys
rm -rf whatsapp_auth_info
rm -rf .wwebjs_auth
rm -rf .wwebjs_cache

# Remove QR codes
rm -rf qr-codes/*
rm -f whatsapp-qr.png
rm -f server/qr-codes/*

# Remove status files
rm -f scripts/whatsapp-status.json
rm -f whatsapp-status.json

echo -e "${GREEN}✅ WhatsApp session cleared${NC}"

# Step 4: Create QR code directory
echo -e "${CYAN}📁 Creating QR code directory...${NC}"
mkdir -p qr-codes
mkdir -p server/qr-codes
echo -e "${GREEN}✅ QR directories created${NC}"

# Step 5: Check dependencies
echo -e "${CYAN}📦 Checking WhatsApp dependencies...${NC}"
if [ ! -d "node_modules/@whiskeysockets" ]; then
    echo -e "${YELLOW}Installing WhatsApp dependencies...${NC}"
    npm install @whiskeysockets/baileys @hapi/boom qrcode-terminal pino
fi
echo -e "${GREEN}✅ Dependencies ready${NC}"

# Step 6: Start with start-production-all.js
echo -e "${CYAN}🚀 Starting system with start-production-all.js...${NC}"
echo ""
echo -e "${YELLOW}📱 IMPORTANT: Watch for QR Code below!${NC}"
echo -e "${YELLOW}   Scan with WhatsApp -> Linked Devices -> Link a Device${NC}"
echo ""
echo "=========================================="
echo ""

# Run start-production-all.js
node start-production-all.js
