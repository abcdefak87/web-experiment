#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf8');
    return true; // File was created
  }
  return false; // File already existed
}

function addOrUpdateEnvVariable(filePath, key, value, comment = null) {
  ensureFileExists(filePath);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Check if variable already exists
  const existingIndex = lines.findIndex(line => line.startsWith(`${key}=`));
  
  if (existingIndex !== -1) {
    // Update existing variable
    lines[existingIndex] = `${key}=${value}`;
    log(`  ✓ Updated ${key} in ${path.basename(filePath)}`, colors.yellow);
  } else {
    // Add new variable
    const newLines = [];
    
    // Add comment if provided
    if (comment) {
      newLines.push('');
      newLines.push(`# ${comment}`);
    }
    newLines.push(`${key}=${value}`);
    
    // Add to end of file
    if (lines[lines.length - 1] === '') {
      lines.splice(lines.length - 1, 0, ...newLines);
    } else {
      lines.push(...newLines);
    }
    
    log(`  ✓ Added ${key} to ${path.basename(filePath)}`, colors.green);
  }
  
  // Write back to file
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

async function setupWebSocketEnv() {
  log('\n🚀 WebSocket Environment Setup Script', colors.bright + colors.cyan);
  log('=====================================\n', colors.cyan);
  
  // Paths
  const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
  const clientEnvPath = path.join(__dirname, '..', 'client', '.env.local');
  
  // Check if we're in the right directory
  if (!fs.existsSync(path.join(__dirname, '..', 'server')) || 
      !fs.existsSync(path.join(__dirname, '..', 'client'))) {
    log('❌ Error: This script must be run from the project root directory', colors.red);
    log('   Please navigate to the HAHAHA directory and run: node scripts/setup-websocket-env.js', colors.yellow);
    process.exit(1);
  }
  
  log('This script will configure WebSocket environment variables for:', colors.blue);
  log(`  • Server: ${serverEnvPath}`, colors.reset);
  log(`  • Client: ${clientEnvPath}\n`, colors.reset);
  
  // Ask for confirmation
  const proceed = await question(`${colors.yellow}Do you want to continue? (y/n): ${colors.reset}`);
  
  if (proceed.toLowerCase() !== 'y') {
    log('\n❌ Setup cancelled', colors.red);
    rl.close();
    return;
  }
  
  log('\n📝 Configuring environment variables...', colors.blue);
  
  // Server configuration
  log('\n1. Server Configuration (.env):', colors.bright);
  
  // Ask for custom CLIENT_URL or use default
  const customClientUrl = await question(
    `${colors.cyan}   Enter CLIENT_URL (press Enter for default http://localhost:3000): ${colors.reset}`
  );
  const clientUrl = customClientUrl.trim() || 'http://localhost:3000';
  
  // Add CLIENT_URL
  addOrUpdateEnvVariable(
    serverEnvPath,
    'CLIENT_URL',
    clientUrl,
    'WebSocket CORS configuration'
  );
  
  // Ask about Redis
  const useRedis = await question(
    `${colors.cyan}   Do you want to configure Redis for scaling? (y/n): ${colors.reset}`
  );
  
  if (useRedis.toLowerCase() === 'y') {
    const redisUrl = await question(
      `${colors.cyan}   Enter REDIS_URL (press Enter for default redis://localhost:6379): ${colors.reset}`
    );
    addOrUpdateEnvVariable(
      serverEnvPath,
      'REDIS_URL',
      redisUrl.trim() || 'redis://localhost:6379',
      'Optional: Redis for WebSocket scaling'
    );
  }
  
  // Client configuration
  log('\n2. Client Configuration (.env.local):', colors.bright);
  
  // Ask for custom WS_URL or use default
  const customWsUrl = await question(
    `${colors.cyan}   Enter WebSocket URL (press Enter for default http://localhost:3001): ${colors.reset}`
  );
  const wsUrl = customWsUrl.trim() || 'http://localhost:3001';
  
  // Add NEXT_PUBLIC_WS_URL
  addOrUpdateEnvVariable(
    clientEnvPath,
    'NEXT_PUBLIC_WS_URL',
    wsUrl,
    'WebSocket server URL'
  );
  
  // Production configuration tips
  log('\n📌 Production Configuration Tips:', colors.bright + colors.yellow);
  log('   For production deployment, update these values:', colors.yellow);
  log('   • CLIENT_URL: https://yourdomain.com', colors.reset);
  log('   • NEXT_PUBLIC_WS_URL: wss://yourdomain.com or wss://ws.yourdomain.com', colors.reset);
  log('   • REDIS_URL: Your production Redis URL (if using scaling)', colors.reset);
  
  // Summary
  log('\n✅ WebSocket environment setup completed!', colors.bright + colors.green);
  log('\n📋 Configuration Summary:', colors.bright);
  log(`   Server CLIENT_URL: ${clientUrl}`, colors.reset);
  if (useRedis.toLowerCase() === 'y') {
    log(`   Server REDIS_URL: ${redisUrl?.trim() || 'redis://localhost:6379'}`, colors.reset);
  }
  log(`   Client NEXT_PUBLIC_WS_URL: ${wsUrl}`, colors.reset);
  
  // Next steps
  log('\n🎯 Next Steps:', colors.bright + colors.blue);
  log('   1. Restart your server: npm run dev (in server directory)', colors.reset);
  log('   2. Restart your client: npm run dev (in client directory)', colors.reset);
  log('   3. Check the WebSocket indicator in the app header', colors.reset);
  log('   4. Monitor WebSocket metrics at: /api/websocket/metrics (admin only)', colors.reset);
  
  log('\n🚀 Your WebSocket enhancement is ready to use!', colors.bright + colors.green);
  
  rl.close();
}

// Run the setup
setupWebSocketEnv().catch(error => {
  log(`\n❌ Error: ${error.message}`, colors.red);
  rl.close();
  process.exit(1);
});
