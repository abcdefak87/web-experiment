#!/bin/bash

# Fix Frontend Start Script
echo "🔧 FIX FRONTEND START"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check current status
echo -e "${CYAN}📊 Checking current status...${NC}"

# Check backend
if lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 3001${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    cd /root/tahapdev/server
    nohup npm run start:production > server.log 2>&1 &
    echo -e "${GREEN}✅ Backend restarted${NC}"
fi

# Check frontend
if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Port 3000 is in use, killing process...${NC}"
    fuser -k 3000/tcp 2>/dev/null
    lsof -ti:3000 | xargs -r kill -9 2>/dev/null
    sleep 2
fi

# Navigate to client directory
cd /root/tahapdev/client || { echo "Error: client directory not found"; exit 1; }

# Check if build exists
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}🔨 Building frontend...${NC}"
    npm run build
fi

# Start frontend with different methods
echo -e "${CYAN}🚀 Starting frontend...${NC}"

# Method 1: Try production start
echo -e "${YELLOW}Trying production start...${NC}"
PORT=3000 nohup npm run start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to initialize...${NC}"
for i in {1..15}; do
    if lsof -i:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is running!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# If still not running, try development mode
if ! lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Production start failed, trying development mode...${NC}"
    
    # Kill previous attempt
    kill $FRONTEND_PID 2>/dev/null
    
    # Try dev mode
    PORT=3000 nohup npm run dev > ../frontend-dev.log 2>&1 &
    DEV_PID=$!
    echo -e "${GREEN}Frontend started in dev mode with PID: $DEV_PID${NC}"
    
    # Wait again
    for i in {1..15}; do
        if lsof -i:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is running in dev mode!${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
fi

# Final check
echo ""
echo -e "${CYAN}📊 Final Status:${NC}"

if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"
    FRONTEND_PROCESS=$(lsof -i:3000 | grep LISTEN | awk '{print $1, $2}')
    echo -e "   Process: $FRONTEND_PROCESS"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    tail -20 ../frontend.log 2>/dev/null || tail -20 ../frontend-dev.log 2>/dev/null
fi

if lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 3001${NC}"
fi

# Show access URLs
echo ""
echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}         SYSTEM STATUS              ${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📋 Access URLs:${NC}"
echo -e "   Frontend: ${GREEN}http://172.17.2.3:3000${NC}"
echo -e "   Backend API: ${GREEN}http://172.17.2.3:3001${NC}"
echo ""
echo -e "${CYAN}📋 Login:${NC}"
echo -e "   Username: ${GREEN}superadmin${NC}"
echo -e "   Password: ${GREEN}super123${NC}"
echo ""
echo -e "${CYAN}📋 Monitor Logs:${NC}"
echo "   tail -f frontend.log      # Frontend production"
echo "   tail -f frontend-dev.log  # Frontend development"
echo "   tail -f server/server.log  # Backend"
echo "   tail -f whatsapp.log      # WhatsApp bot"
