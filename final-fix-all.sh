#!/bin/bash

# Final Fix All Issues After Fresh Setup
echo "🔧 FINAL FIX - ALL ISSUES"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

cd /root/tahapdev

# FIX 1: WhatsApp Bot Dependencies
echo -e "${CYAN}📱 FIX 1: WhatsApp Bot Dependencies${NC}"
echo -e "${YELLOW}Installing missing dependencies...${NC}"

# Create package.json in root if not exists
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "isp-management-root",
  "version": "1.0.0",
  "scripts": {
    "whatsapp": "node scripts/whatsapp-bot-integrated.js",
    "start-all": "node start-production-all.js"
  }
}
EOF
fi

# Install WhatsApp dependencies
npm install @whiskeysockets/baileys @hapi/boom qrcode-terminal pino

# Kill old WhatsApp process
pkill -f "whatsapp-bot" 2>/dev/null

# Start WhatsApp bot
nohup node scripts/whatsapp-bot-integrated.js > whatsapp.log 2>&1 &
WA_PID=$!
echo -e "${GREEN}✅ WhatsApp bot fixed and restarted (PID: $WA_PID)${NC}"

# FIX 2: Frontend Not Running
echo ""
echo -e "${CYAN}🌐 FIX 2: Frontend Service${NC}"

# Kill any process on port 3000
fuser -k 3000/tcp 2>/dev/null
lsof -ti:3000 | xargs -r kill -9 2>/dev/null
sleep 2

cd client

# Make sure we have dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing client dependencies...${NC}"
    npm install
fi

# Make sure we have a build
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}Building client...${NC}"
    npm run build
fi

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
PORT=3000 nohup npm run start > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
for i in {1..15}; do
    if lsof -i:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
        break
    fi
    sleep 2
done

# If production fails, try dev
if ! lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Production failed, trying dev mode...${NC}"
    kill $FRONTEND_PID 2>/dev/null
    PORT=3000 nohup npm run dev > ../frontend-dev.log 2>&1 &
    DEV_PID=$!
    sleep 10
    
    if lsof -i:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend running in dev mode (PID: $DEV_PID)${NC}"
    fi
fi

# FIX 3: Verify Backend
echo ""
echo -e "${CYAN}🔧 FIX 3: Verify Backend${NC}"

if ! lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}Backend not running, starting...${NC}"
    cd ../server
    nohup npm run start:production > server.log 2>&1 &
    BACKEND_PID=$!
    sleep 5
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${GREEN}✅ Backend already running${NC}"
fi

# FIX 4: Test Everything
echo ""
echo -e "${CYAN}🔍 Testing All Services...${NC}"

cd /root/tahapdev

# Test Backend
BACKEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)
if [ "$BACKEND_TEST" = "200" ] || [ "$BACKEND_TEST" = "404" ]; then
    echo -e "${GREEN}✅ Backend API: Responding (HTTP $BACKEND_TEST)${NC}"
else
    echo -e "${RED}❌ Backend API: Not responding${NC}"
fi

# Test Frontend
if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend: Running on port 3000${NC}"
else
    echo -e "${RED}❌ Frontend: Not running${NC}"
fi

# Test WhatsApp
if pgrep -f "whatsapp-bot" > /dev/null; then
    echo -e "${GREEN}✅ WhatsApp Bot: Running${NC}"
else
    echo -e "${RED}❌ WhatsApp Bot: Not running${NC}"
fi

# Test Authentication
echo ""
echo -e "${CYAN}🔐 Testing Authentication...${NC}"
LOGIN_TEST=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"superadmin","password":"super123"}' 2>/dev/null)

if [[ $LOGIN_TEST == *"token"* ]]; then
    echo -e "${GREEN}✅ Authentication: Working${NC}"
    
    # Extract token and test API
    TOKEN=$(echo $LOGIN_TEST | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$TOKEN" ]; then
        API_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $TOKEN" \
            http://localhost:3001/api/customers?page=1&limit=6 2>/dev/null)
        
        if [ "$API_TEST" = "200" ]; then
            echo -e "${GREEN}✅ API Access: Working${NC}"
        else
            echo -e "${YELLOW}⚠️ API Access: HTTP $API_TEST${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Authentication: Failed${NC}"
fi

# Final Summary
echo ""
echo -e "${MAGENTA}════════════════════════════════════════${NC}"
echo -e "${MAGENTA}           FINAL STATUS                 ${NC}"
echo -e "${MAGENTA}════════════════════════════════════════${NC}"
echo ""

# Check all services
ALL_OK=true
if ! lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend not running${NC}"
    ALL_OK=false
else
    echo -e "${GREEN}✅ Backend running on port 3001${NC}"
fi

if ! lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Frontend not running${NC}"
    ALL_OK=false
else
    echo -e "${GREEN}✅ Frontend running on port 3000${NC}"
fi

if ! pgrep -f "whatsapp-bot" > /dev/null; then
    echo -e "${YELLOW}⚠️ WhatsApp bot not running${NC}"
else
    echo -e "${GREEN}✅ WhatsApp bot running${NC}"
fi

if [ "$ALL_OK" = true ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL SERVICES RUNNING SUCCESSFULLY!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️ Some services need attention${NC}"
fi

echo ""
echo -e "${CYAN}📋 Access Information:${NC}"
echo -e "   Frontend: ${GREEN}http://172.17.2.3:3000${NC}"
echo -e "   Backend: ${GREEN}http://172.17.2.3:3001${NC}"
echo ""
echo -e "${CYAN}🔐 Login:${NC}"
echo -e "   Username: ${GREEN}superadmin${NC}"
echo -e "   Password: ${GREEN}super123${NC}"
echo ""
echo -e "${CYAN}📝 Monitoring:${NC}"
echo "   Backend log: tail -f server/server.log"
echo "   Frontend log: tail -f frontend.log"
echo "   WhatsApp log: tail -f whatsapp.log"
echo ""
echo -e "${GREEN}✅ System is ready to use!${NC}"
