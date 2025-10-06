#!/bin/bash

# Quick Start Script - Start all services quickly
echo "⚡ QUICK START - ISP Management System"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Kill existing processes
echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
pkill -f "node.*3001" 2>/dev/null
pkill -f "node.*3000" 2>/dev/null
pkill -f "whatsapp-bot" 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null
sleep 2

# Start Backend
echo -e "${CYAN}🚀 Starting Backend...${NC}"
cd /root/tahapdev/server
nohup npm run start:production > server.log 2>&1 &
echo -e "${GREEN}✅ Backend started${NC}"

# Start WhatsApp Bot
echo -e "${CYAN}📱 Starting WhatsApp Bot...${NC}"
cd /root/tahapdev
if [ -f "scripts/whatsapp-bot-integrated.js" ]; then
    nohup node scripts/whatsapp-bot-integrated.js > whatsapp.log 2>&1 &
    echo -e "${GREEN}✅ WhatsApp bot started${NC}"
fi

# Start Frontend (try production first, fallback to dev)
echo -e "${CYAN}🌐 Starting Frontend...${NC}"
cd /root/tahapdev/client

# Check if build exists
if [ -d ".next" ]; then
    # Try production
    PORT=3000 nohup npm run start > ../frontend.log 2>&1 &
    echo -e "${GREEN}✅ Frontend started (production)${NC}"
else
    # Need to build or use dev
    echo -e "${YELLOW}No build found, starting in dev mode...${NC}"
    PORT=3000 nohup npm run dev > ../frontend-dev.log 2>&1 &
    echo -e "${GREEN}✅ Frontend started (development)${NC}"
fi

# Wait and verify
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 8

# Check status
echo ""
echo -e "${CYAN}📊 Service Status:${NC}"
lsof -i:3001 > /dev/null 2>&1 && echo -e "${GREEN}✅ Backend: Running${NC}" || echo -e "${RED}❌ Backend: Not running${NC}"
lsof -i:3000 > /dev/null 2>&1 && echo -e "${GREEN}✅ Frontend: Running${NC}" || echo -e "${RED}❌ Frontend: Not running${NC}"
pgrep -f "whatsapp-bot" > /dev/null && echo -e "${GREEN}✅ WhatsApp: Running${NC}" || echo -e "${YELLOW}⚠️ WhatsApp: Not running${NC}"

echo ""
echo -e "${GREEN}🎉 System Started!${NC}"
echo ""
echo "📋 Access:"
echo "   Frontend: http://172.17.2.3:3000"
echo "   Backend: http://172.17.2.3:3001"
echo ""
echo "🔐 Login:"
echo "   superadmin / super123"
echo ""
echo "📝 Logs:"
echo "   tail -f server/server.log"
echo "   tail -f frontend.log"
