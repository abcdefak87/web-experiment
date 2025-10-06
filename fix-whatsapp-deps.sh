#!/bin/bash

# Fix WhatsApp Bot Dependencies
echo "🔧 FIX WHATSAPP BOT DEPENDENCIES"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Navigate to project root
cd /root/tahapdev || exit 1

# Stop WhatsApp bot if running
echo -e "${YELLOW}🛑 Stopping WhatsApp bot...${NC}"
pkill -f "whatsapp-bot" 2>/dev/null
sleep 2

# Install dependencies in root directory
echo -e "${CYAN}📦 Installing WhatsApp dependencies in root...${NC}"

# Check if package.json exists in root
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Creating package.json in root...${NC}"
    cat > package.json << 'EOF'
{
  "name": "isp-management-root",
  "version": "1.0.0",
  "description": "ISP Management System Root",
  "scripts": {
    "whatsapp": "node scripts/whatsapp-bot-integrated.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.8",
    "@hapi/boom": "^10.0.1",
    "qrcode-terminal": "^0.12.0",
    "pino": "^9.5.0"
  }
}
EOF
fi

# Install dependencies
npm install @whiskeysockets/baileys @hapi/boom qrcode-terminal pino

echo -e "${GREEN}✅ WhatsApp dependencies installed${NC}"

# Alternative: Create symlinks to server's node_modules
echo -e "${CYAN}🔗 Creating symlinks as backup...${NC}"

# Check if server has the modules
if [ -d "server/node_modules/@whiskeysockets" ]; then
    # Create symlinks from server's node_modules
    if [ ! -d "node_modules" ]; then
        mkdir -p node_modules
    fi
    
    # Link required modules
    ln -sf $(pwd)/server/node_modules/@whiskeysockets node_modules/ 2>/dev/null
    ln -sf $(pwd)/server/node_modules/@hapi node_modules/ 2>/dev/null
    ln -sf $(pwd)/server/node_modules/qrcode-terminal node_modules/ 2>/dev/null
    ln -sf $(pwd)/server/node_modules/pino node_modules/ 2>/dev/null
    
    echo -e "${GREEN}✅ Symlinks created${NC}"
fi

# Start WhatsApp bot
echo -e "${CYAN}📱 Starting WhatsApp bot...${NC}"
nohup node scripts/whatsapp-bot-integrated.js > whatsapp.log 2>&1 &
WA_PID=$!

echo -e "${GREEN}✅ WhatsApp bot started (PID: $WA_PID)${NC}"

# Wait and check
sleep 5

# Check if running
if pgrep -f "whatsapp-bot" > /dev/null; then
    echo -e "${GREEN}✅ WhatsApp bot is running!${NC}"
    echo ""
    echo "📝 Check logs: tail -f whatsapp.log"
else
    echo -e "${YELLOW}⚠️ WhatsApp bot may have issues, checking log...${NC}"
    tail -10 whatsapp.log
fi
