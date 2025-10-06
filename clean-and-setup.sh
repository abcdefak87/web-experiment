#!/bin/bash

# Clean and Fresh Setup Script for Linux
echo "🧹 CLEAN AND FRESH SETUP SCRIPT"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Confirmation
echo -e "${RED}⚠️  WARNING: This will clean and reset everything!${NC}"
echo -e "${YELLOW}This script will:${NC}"
echo "  1. Stop all Node/NPM processes"
echo "  2. Clean npm cache and modules"
echo "  3. Reset git repository"
echo "  4. Setup fresh database"
echo "  5. Reinstall everything"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# STEP 1: Kill all processes
echo -e "\n${CYAN}STEP 1: Stopping all processes...${NC}"
pkill -f node
pkill -f npm
pkill -f "whatsapp"
killall node 2>/dev/null
killall npm 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null
fuser -k 5555/tcp 2>/dev/null
pm2 kill 2>/dev/null
echo -e "${GREEN}✅ All processes stopped${NC}"

# STEP 2: Clean NPM cache
echo -e "\n${CYAN}STEP 2: Cleaning NPM cache...${NC}"
npm cache clean --force
echo -e "${GREEN}✅ NPM cache cleaned${NC}"

# STEP 3: Navigate to project and pull latest
echo -e "\n${CYAN}STEP 3: Resetting git repository...${NC}"
cd /root/tahapdev || { echo "Error: /root/tahapdev not found"; exit 1; }

# Clean git
git reset --hard
git clean -fd
git pull origin main --force

echo -e "${GREEN}✅ Git repository reset${NC}"

# STEP 4: Remove old node_modules and locks
echo -e "\n${CYAN}STEP 4: Removing old dependencies...${NC}"
rm -rf node_modules
rm -f package-lock.json
rm -rf server/node_modules
rm -f server/package-lock.json
rm -rf client/node_modules
rm -f client/package-lock.json
rm -rf .next
rm -rf client/.next
rm -rf client/build
echo -e "${GREEN}✅ Old dependencies removed${NC}"

# STEP 5: Setup PostgreSQL database
echo -e "\n${CYAN}STEP 5: Setting up PostgreSQL database...${NC}"

# Ensure PostgreSQL is running
systemctl start postgresql 2>/dev/null || service postgresql start 2>/dev/null

# Create database and user
sudo -u postgres psql << EOF
-- Drop existing connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'isp_management' AND pid <> pg_backend_pid();

-- Drop and recreate database
DROP DATABASE IF EXISTS isp_management;
CREATE DATABASE isp_management;

-- Drop and recreate user
DROP USER IF EXISTS isp_user;
CREATE USER isp_user WITH PASSWORD 'isp_secure_password_2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE isp_management TO isp_user;
ALTER DATABASE isp_management OWNER TO isp_user;

-- Connect to database and grant schema privileges
\c isp_management
GRANT ALL ON SCHEMA public TO isp_user;
\q
EOF

echo -e "${GREEN}✅ Database setup complete${NC}"

# STEP 6: Create fresh .env for server
echo -e "\n${CYAN}STEP 6: Creating fresh environment configuration...${NC}"
cd server

cat > .env << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL="postgresql://isp_user:isp_secure_password_2024@localhost:5432/isp_management?schema=public"

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_change_this_in_production_$(openssl rand -hex 32)
JWT_REFRESH_EXPIRES_IN=30d

# CSRF Protection
CSRF_SECRET=csrf_secret_key_$(openssl rand -hex 16)

# Session Configuration
SESSION_SECRET=s3ss10n_s3cr3t_k3y_$(openssl rand -hex 16)
SESSION_MAX_AGE=86400000

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./auth_info_baileys
WHATSAPP_QR_PATH=./qr-codes
WHATSAPP_ENABLED=true

# CORS Settings
CLIENT_URL=http://172.17.2.3:3000
ALLOWED_ORIGINS=http://172.17.2.3:3000,http://172.17.2.3:3001,http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Feature Flags
ENABLE_WHATSAPP=true
DEBUG_MODE=false
SHOW_SQL_LOGS=false
EOF

echo -e "${GREEN}✅ Environment configuration created${NC}"

# STEP 7: Install server dependencies
echo -e "\n${CYAN}STEP 7: Installing server dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Server dependencies installed${NC}"

# STEP 8: Setup Prisma and migrate database
echo -e "\n${CYAN}STEP 8: Setting up database schema...${NC}"
npx prisma generate
npx prisma db push --accept-data-loss
echo -e "${GREEN}✅ Database schema created${NC}"

# STEP 9: Create default users
echo -e "\n${CYAN}STEP 9: Creating default users...${NC}"
node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createUsers() {
  try {
    const users = [
      { username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'superadmin' },
      { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
      { username: 'gudang', password: 'gudang123', name: 'Gudang', role: 'gudang' },
      { username: 'teknisi', password: 'teknisi123', name: 'Teknisi', role: 'teknisi' }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await prisma.user.upsert({
        where: { username: user.username },
        update: { 
          password: hashedPassword, 
          isActive: true,
          isVerified: true 
        },
        create: {
          username: user.username,
          password: hashedPassword,
          name: user.name,
          role: user.role,
          isActive: true,
          isVerified: true
        }
      });
      
      console.log(`✅ User created: ${user.username} / ${user.password}`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createUsers();
EOF

# STEP 10: Install client dependencies
echo -e "\n${CYAN}STEP 10: Installing client dependencies...${NC}"
cd ../client
npm install
echo -e "${GREEN}✅ Client dependencies installed${NC}"

# STEP 11: Build client
echo -e "\n${CYAN}STEP 11: Building client application...${NC}"
npm run build
echo -e "${GREEN}✅ Client built successfully${NC}"

# STEP 12: Start all services
echo -e "\n${CYAN}STEP 12: Starting all services...${NC}"
cd ..

# Start backend
cd server
nohup npm run start:production > server.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Start WhatsApp bot
cd ..
if [ -f "scripts/whatsapp-bot-integrated.js" ]; then
    nohup node scripts/whatsapp-bot-integrated.js > whatsapp.log 2>&1 &
    WA_PID=$!
    echo -e "${GREEN}✅ WhatsApp bot started (PID: $WA_PID)${NC}"
fi

# Start frontend
cd client
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for services to start
echo -e "\n${YELLOW}⏳ Waiting for services to initialize...${NC}"
sleep 10

# STEP 13: Verify setup
echo -e "\n${CYAN}STEP 13: Verifying setup...${NC}"

# Check if services are running
if lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 3001${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
fi

if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"
else
    echo -e "${RED}❌ Frontend is not running${NC}"
fi

# Test backend API
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
    echo -e "${GREEN}✅ Backend API is responding${NC}"
else
    echo -e "${YELLOW}⚠️ Backend API response: $RESPONSE${NC}"
fi

# Final summary
echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}       SETUP COMPLETED SUCCESSFULLY!     ${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📋 Access URLs:${NC}"
echo -e "   Frontend: ${GREEN}http://172.17.2.3:3000${NC}"
echo -e "   Backend API: ${GREEN}http://172.17.2.3:3001${NC}"
echo ""
echo -e "${CYAN}📋 Login Credentials:${NC}"
echo -e "   Username: ${GREEN}superadmin${NC}"
echo -e "   Password: ${GREEN}super123${NC}"
echo ""
echo -e "${CYAN}📋 Alternative Logins:${NC}"
echo "   admin / admin123"
echo "   gudang / gudang123"
echo "   teknisi / teknisi123"
echo ""
echo -e "${CYAN}📋 Logs:${NC}"
echo "   Backend: tail -f server/server.log"
echo "   Frontend: tail -f frontend.log"
echo "   WhatsApp: tail -f whatsapp.log"
echo ""
echo -e "${MAGENTA}🎉 System is ready to use!${NC}"
