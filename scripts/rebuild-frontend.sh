#!/bin/bash

echo "🔄 Rebuilding frontend..."

# Navigate to client directory
cd client

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the frontend
echo "🏗️ Building frontend..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "🚀 Frontend rebuild completed!"
