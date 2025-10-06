#!/usr/bin/env node

/**
 * Quick WebSocket Environment Setup
 * This script automatically sets up default development environment variables
 * without user interaction.
 */

const fs = require('fs');
const path = require('path');

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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf8');
    return true;
  }
  return false;
}

function addOrUpdateEnvVariable(filePath, key, value, comment = null) {
  ensureFileExists(filePath);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Check if variable already exists
  const existingIndex = lines.findIndex(line => line.startsWith(`${key}=`));
  
  if (existingIndex !== -1) {
    // Check if value is different
    const existingValue = lines[existingIndex].split('=')[1];
    if (existingValue === value) {
      log(`  ✓ ${key} already configured in ${path.basename(filePath)}`, colors.green);
      return;
    }
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

function quickSetup() {
  log('\n⚡ Quick WebSocket Environment Setup', colors.bright + colors.cyan);
  log('=====================================\n', colors.cyan);
  
  // Paths
  const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
  const clientEnvPath = path.join(__dirname, '..', 'client', '.env.local');
  
  // Check if we're in the right directory
  if (!fs.existsSync(path.join(__dirname, '..', 'server')) || 
      !fs.existsSync(path.join(__dirname, '..', 'client'))) {
    log('❌ Error: This script must be run from the project root directory', colors.red);
    log('   Please navigate to the HAHAHA directory and run: node scripts/quick-websocket-setup.js', colors.yellow);
    process.exit(1);
  }
  
  log('📝 Setting up default development environment...', colors.blue);
  
  // Server configuration
  log('\n1. Server Configuration (.env):', colors.bright);
  
  // Add CLIENT_URL
  addOrUpdateEnvVariable(
    serverEnvPath,
    'CLIENT_URL',
    'http://localhost:3000',
    'WebSocket CORS configuration'
  );
  
  // Add commented REDIS_URL for reference
  const serverContent = fs.readFileSync(serverEnvPath, 'utf8');
  if (!serverContent.includes('REDIS_URL')) {
    const lines = serverContent.split('\n');
    lines.push('');
    lines.push('# Optional: Redis for WebSocket scaling (uncomment to enable)');
    lines.push('# REDIS_URL=redis://localhost:6379');
    fs.writeFileSync(serverEnvPath, lines.join('\n'), 'utf8');
    log('  ✓ Added REDIS_URL reference (commented)', colors.green);
  }
  
  // Client configuration
  log('\n2. Client Configuration (.env.local):', colors.bright);
  
  // Add NEXT_PUBLIC_WS_URL
  addOrUpdateEnvVariable(
    clientEnvPath,
    'NEXT_PUBLIC_WS_URL',
    'http://localhost:3001',
    'WebSocket server URL'
  );
  
  // Summary
  log('\n✅ Quick setup completed!', colors.bright + colors.green);
  log('\n📋 Configuration:', colors.bright);
  log('   Server CLIENT_URL: http://localhost:3000', colors.reset);
  log('   Client NEXT_PUBLIC_WS_URL: http://localhost:3001', colors.reset);
  log('   Redis: Not configured (optional)', colors.gray);
  
  // Create a status file to track setup
  const statusFile = path.join(__dirname, '..', '.websocket-setup');
  fs.writeFileSync(statusFile, JSON.stringify({
    setupDate: new Date().toISOString(),
    type: 'quick-setup',
    config: {
      CLIENT_URL: 'http://localhost:3000',
      NEXT_PUBLIC_WS_URL: 'http://localhost:3001',
      REDIS_URL: null
    }
  }, null, 2));
  
  // Next steps
  log('\n🎯 Next Steps:', colors.bright + colors.blue);
  log('   1. Restart your server:', colors.reset);
  log('      cd server && npm run dev', colors.gray);
  log('   2. Restart your client:', colors.reset);
  log('      cd client && npm run dev', colors.gray);
  log('   3. Check the WebSocket indicator in the app header', colors.reset);
  
  log('\n💡 Tip: For production setup, run: node scripts/setup-websocket-env.js', colors.yellow);
  log('\n🚀 WebSocket is ready for development!', colors.bright + colors.green);
}

// Run the quick setup
try {
  quickSetup();
  process.exit(0);
} catch (error) {
  log(`\n❌ Error: ${error.message}`, colors.red);
  process.exit(1);
}
