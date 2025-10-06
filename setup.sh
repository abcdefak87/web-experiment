#!/bin/bash

# ISP Management System Setup Script
# This script sets up the development environment

echo "🚀 Setting up ISP Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Create environment files if they don't exist
echo "🔧 Setting up environment files..."

if [ ! -f "client/.env.local" ]; then
    cp client/env.example client/.env.local
    echo "✅ Created client/.env.local from example"
else
    echo "⚠️  client/.env.local already exists"
fi

if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env from example"
else
    echo "⚠️  server/.env already exists"
fi

# Setup database
echo "🗄️  Setting up database..."
cd server
npx prisma generate
npx prisma db push
cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p server/logs
mkdir -p server/uploads
mkdir -p qr-codes
mkdir -p auth_info_baileys

echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit client/.env.local and server/.env with your configuration"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Scan QR code at http://localhost:3001/qr/whatsapp-qr.png for WhatsApp bot"
echo ""
echo "🔧 Available commands:"
echo "  npm run dev          - Start development servers"
echo "  npm run build        - Build for production"
echo "  npm run start        - Start production servers"
echo "  npm run db:migrate   - Run database migrations"
echo "  npm run db:seed      - Seed database"
echo "  npm run db:studio    - Open Prisma Studio"
echo ""
echo "📚 For more information, see README.md"
