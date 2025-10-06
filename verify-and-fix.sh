#!/bin/bash

# Verify and Fix All Services
echo "🔍 VERIFY AND FIX ALL SERVICES"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Project directory
PROJECT_DIR="/root/tahapdev"
cd $PROJECT_DIR

# Function to check service
check_service() {
    local port=$1
    local name=$2
    
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is NOT running on port $port${NC}"
        return 1
    fi
}

# Function to test API
test_api() {
    local url=$1
    local name=$2
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null)
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "401" ]; then
        echo -e "${GREEN}✅ $name is responding (HTTP $RESPONSE)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name not responding (HTTP $RESPONSE)${NC}"
        return 1
    fi
}

# STEP 1: Check all services
echo -e "${CYAN}📊 Checking all services...${NC}"
echo ""

BACKEND_OK=false
FRONTEND_OK=false
WHATSAPP_OK=false

# Check Backend
if check_service 3001 "Backend"; then
    BACKEND_OK=true
    test_api "http://localhost:3001/api/health" "Backend API"
fi

# Check Frontend
if check_service 3000 "Frontend"; then
    FRONTEND_OK=true
else
    # Frontend not running, let's fix it
    echo -e "${YELLOW}🔧 Fixing Frontend...${NC}"
    
    # Kill any stuck processes
    fuser -k 3000/tcp 2>/dev/null
    pkill -f "npm.*start" 2>/dev/null
    pkill -f "next.*start" 2>/dev/null
    sleep 2
    
    cd $PROJECT_DIR/client
    
    # Check package.json scripts
    if grep -q '"start"' package.json; then
        # Try production start first
        echo -e "${YELLOW}Starting frontend in production mode...${NC}"
        PORT=3000 nohup npm run start > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        
        # Wait for startup
        for i in {1..10}; do
            if lsof -i:3000 > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Frontend started successfully!${NC}"
                FRONTEND_OK=true
                break
            fi
            sleep 2
        done
        
        # If failed, try dev mode
        if [ "$FRONTEND_OK" = false ]; then
            echo -e "${YELLOW}Production failed, trying dev mode...${NC}"
            kill $FRONTEND_PID 2>/dev/null
            
            PORT=3000 nohup npm run dev > ../frontend-dev.log 2>&1 &
            DEV_PID=$!
            
            for i in {1..10}; do
                if lsof -i:3000 > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ Frontend started in dev mode!${NC}"
                    FRONTEND_OK=true
                    break
                fi
                sleep 2
            done
        fi
    fi
fi

# Check WhatsApp Bot
echo -e "${CYAN}Checking WhatsApp bot...${NC}"
if pgrep -f "whatsapp-bot" > /dev/null; then
    echo -e "${GREEN}✅ WhatsApp bot is running${NC}"
    WHATSAPP_OK=true
else
    echo -e "${YELLOW}🔧 Starting WhatsApp bot...${NC}"
    cd $PROJECT_DIR
    if [ -f "scripts/whatsapp-bot-integrated.js" ]; then
        nohup node scripts/whatsapp-bot-integrated.js > whatsapp.log 2>&1 &
        echo -e "${GREEN}✅ WhatsApp bot started${NC}"
        WHATSAPP_OK=true
    fi
fi

# STEP 2: Fix Backend if needed
if [ "$BACKEND_OK" = false ]; then
    echo -e "${YELLOW}🔧 Fixing Backend...${NC}"
    
    pkill -f "node.*3001" 2>/dev/null
    sleep 2
    
    cd $PROJECT_DIR/server
    nohup npm run start:production > server.log 2>&1 &
    
    sleep 5
    if check_service 3001 "Backend"; then
        BACKEND_OK=true
    fi
fi

# STEP 3: Test authentication
echo ""
echo -e "${CYAN}🔐 Testing Authentication...${NC}"

if [ "$BACKEND_OK" = true ]; then
    # Test login
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{"username":"superadmin","password":"super123"}' 2>/dev/null)
    
    if [[ $LOGIN_RESPONSE == *"token"* ]]; then
        echo -e "${GREEN}✅ Authentication working - Login successful!${NC}"
        
        # Extract token and test API
        TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        
        if [ ! -z "$TOKEN" ]; then
            API_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
                -H "Authorization: Bearer $TOKEN" \
                http://localhost:3001/api/customers?page=1&limit=6 2>/dev/null)
            
            if [ "$API_TEST" = "200" ]; then
                echo -e "${GREEN}✅ API access working - Can fetch customers!${NC}"
            else
                echo -e "${YELLOW}⚠️ API returned: HTTP $API_TEST${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Authentication failed${NC}"
        echo "Response: $LOGIN_RESPONSE"
    fi
fi

# STEP 4: Database check
echo ""
echo -e "${CYAN}🗄️ Checking Database...${NC}"

cd $PROJECT_DIR/server
DB_TEST=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(count => console.log('✅ Database connected. Users: ' + count))
  .catch(err => console.log('❌ Database error: ' + err.message))
  .finally(() => prisma.\$disconnect());
" 2>&1)
echo -e "${GREEN}$DB_TEST${NC}"

# STEP 5: Final Summary
echo ""
echo -e "${MAGENTA}════════════════════════════════════${NC}"
echo -e "${MAGENTA}         FINAL STATUS               ${NC}"
echo -e "${MAGENTA}════════════════════════════════════${NC}"
echo ""

# Show status
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}🎉 ALL SERVICES RUNNING!${NC}"
else
    echo -e "${YELLOW}⚠️ Some services need attention:${NC}"
    [ "$BACKEND_OK" = false ] && echo -e "${RED}   - Backend not running${NC}"
    [ "$FRONTEND_OK" = false ] && echo -e "${RED}   - Frontend not running${NC}"
fi

echo ""
echo -e "${CYAN}📋 Access Information:${NC}"
echo -e "   Frontend: ${GREEN}http://172.17.2.3:3000${NC}"
echo -e "   Backend: ${GREEN}http://172.17.2.3:3001${NC}"
echo ""
echo -e "${CYAN}📋 Login Credentials:${NC}"
echo -e "   Username: ${GREEN}superadmin${NC}"
echo -e "   Password: ${GREEN}super123${NC}"
echo ""
echo -e "${CYAN}📋 Quick Commands:${NC}"
echo "   Check logs: tail -f server/server.log"
echo "   Frontend log: tail -f frontend.log"
echo "   WhatsApp log: tail -f whatsapp.log"
echo "   Check ports: lsof -i:3000,3001"
echo ""

# Provide troubleshooting if needed
if [ "$FRONTEND_OK" = false ]; then
    echo -e "${YELLOW}📝 Frontend Troubleshooting:${NC}"
    echo "   1. cd $PROJECT_DIR/client"
    echo "   2. npm run build"
    echo "   3. PORT=3000 npm run start"
    echo "   4. Check errors: tail -f ../frontend.log"
fi
