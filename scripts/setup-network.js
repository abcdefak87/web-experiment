#!/usr/bin/env node

/**
 * Network Configuration Script
 * Configure ISP Management System for local network access
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🌐 ISP Management System - Network Configuration');
console.log('==============================================\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Get network IP address
function getNetworkIP() {
  try {
    // Try to get IP from network interfaces
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          // Check if it's a local network IP
          if (net.address.startsWith('192.168.') || 
              net.address.startsWith('10.') || 
              net.address.startsWith('172.')) {
            return net.address;
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Could not detect network IP automatically');
  }
  
  return null;
}

// Check if port is available
function checkPort(port) {
  try {
    execSync(`netstat -tlnp | grep :${port}`, { stdio: 'pipe' });
    return false; // Port is in use
  } catch (error) {
    return true; // Port is available
  }
}

// Update environment files
async function updateEnvironmentFiles(serverIp) {
  console.log('\n📝 Updating environment files...');
  
  // Update server .env
  const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
  if (fs.existsSync(serverEnvPath)) {
    let serverEnv = fs.readFileSync(serverEnvPath, 'utf8');
    
    // Update URLs
    serverEnv = serverEnv.replace(/FRONTEND_URL=.*/, `FRONTEND_URL=http://${serverIp}:3000`);
    serverEnv = serverEnv.replace(/CORS_ORIGIN=.*/, `CORS_ORIGIN=http://${serverIp}:3000`);
    
    // Add CORS_ORIGIN_ALLOWED if not exists
    if (!serverEnv.includes('CORS_ORIGIN_ALLOWED')) {
      serverEnv += `\nCORS_ORIGIN_ALLOWED=http://localhost:3000,http://127.0.0.1:3000,http://${serverIp}:3000,http://${serverIp}:3001\n`;
    } else {
      serverEnv = serverEnv.replace(/CORS_ORIGIN_ALLOWED=.*/, `CORS_ORIGIN_ALLOWED=http://localhost:3000,http://127.0.0.1:3000,http://${serverIp}:3000,http://${serverIp}:3001`);
    }
    
    fs.writeFileSync(serverEnvPath, serverEnv);
    console.log('   ✅ Server .env updated');
  }
  
  // Update client .env.local
  const clientEnvPath = path.join(__dirname, '..', 'client', '.env.local');
  const clientEnvContent = `# Network Configuration
NEXT_PUBLIC_API_URL=http://${serverIp}:3001
NEXT_PUBLIC_WS_URL=ws://${serverIp}:3001

# Application Settings
NEXT_PUBLIC_APP_NAME=ISP Management System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Development Settings
NODE_ENV=development
`;
  
  fs.writeFileSync(clientEnvPath, clientEnvContent);
  console.log('   ✅ Client .env.local updated');
  
  // Update client env.example
  const clientEnvExamplePath = path.join(__dirname, '..', 'client', 'env.example');
  let clientEnvExample = fs.readFileSync(clientEnvExamplePath, 'utf8');
  clientEnvExample = clientEnvExample.replace(/NEXT_PUBLIC_API_URL=.*/, `NEXT_PUBLIC_API_URL=http://${serverIp}:3001`);
  clientEnvExample = clientEnvExample.replace(/NEXT_PUBLIC_WS_URL=.*/, `NEXT_PUBLIC_WS_URL=ws://${serverIp}:3001`);
  fs.writeFileSync(clientEnvExamplePath, clientEnvExample);
  console.log('   ✅ Client env.example updated');
}

// Check firewall status
function checkFirewall() {
  console.log('\n🔥 Checking firewall configuration...');
  
  try {
    // Check if ufw is active (Ubuntu/Debian)
    const ufwStatus = execSync('ufw status', { stdio: 'pipe' }).toString();
    if (ufwStatus.includes('Status: active')) {
      console.log('   ⚠️  UFW firewall is active');
      console.log('   💡 You may need to allow ports 3000, 3001, 5555:');
      console.log('      sudo ufw allow 3000');
      console.log('      sudo ufw allow 3001');
      console.log('      sudo ufw allow 5555');
    }
  } catch (error) {
    // UFW not found or not active
  }
  
  try {
    // Check if firewalld is active (CentOS/RHEL)
    const firewalldStatus = execSync('firewall-cmd --state', { stdio: 'pipe' }).toString();
    if (firewalldStatus.includes('running')) {
      console.log('   ⚠️  Firewalld is active');
      console.log('   💡 You may need to allow ports 3000, 3001, 5555:');
      console.log('      sudo firewall-cmd --permanent --add-port=3000/tcp');
      console.log('      sudo firewall-cmd --permanent --add-port=3001/tcp');
      console.log('      sudo firewall-cmd --permanent --add-port=5555/tcp');
      console.log('      sudo firewall-cmd --reload');
    }
  } catch (error) {
    // Firewalld not found or not active
  }
}

// Display network information
function displayNetworkInfo(serverIp) {
  console.log('\n📋 Network Configuration Summary:');
  console.log('==================================');
  console.log(`🌐 Server IP: ${serverIp}`);
  console.log(`🔗 Frontend URL: http://${serverIp}:3000`);
  console.log(`🔗 Backend API: http://${serverIp}:3001`);
  console.log(`🔗 Prisma Studio: http://${serverIp}:5555`);
  console.log(`🔗 WhatsApp QR: http://${serverIp}:3001/qr/whatsapp-qr.png`);
  
  console.log('\n📱 Access from other devices:');
  console.log(`   - Desktop/Laptop: http://${serverIp}:3000`);
  console.log(`   - Mobile Browser: http://${serverIp}:3000`);
  console.log(`   - API Testing: http://${serverIp}:3001/api/health`);
  
  console.log('\n🔧 Network Requirements:');
  console.log('   - All devices must be on the same network');
  console.log('   - Ports 3000, 3001, 5555 must be accessible');
  console.log('   - Firewall rules may need to be configured');
}

// Main execution
async function main() {
  try {
    console.log('Starting network configuration...\n');
    
    // Get server IP
    let serverIp = getNetworkIP();
    
    if (serverIp) {
      console.log(`🔍 Detected network IP: ${serverIp}`);
    } else {
      console.log('❌ Could not detect network IP automatically');
    }
    
    const inputIp = await askQuestion(`Enter server IP address ${serverIp ? `(default: ${serverIp})` : ''}: `);
    if (inputIp) {
      serverIp = inputIp;
    }
    
    if (!serverIp) {
      console.log('❌ Server IP address is required');
      process.exit(1);
    }
    
    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(serverIp)) {
      console.log('❌ Invalid IP address format');
      process.exit(1);
    }
    
    console.log(`\n✅ Using server IP: ${serverIp}`);
    
    // Check ports
    console.log('\n🔍 Checking port availability...');
    const ports = [3000, 3001, 5555];
    let allPortsAvailable = true;
    
    for (const port of ports) {
      if (checkPort(port)) {
        console.log(`   ✅ Port ${port}: Available`);
      } else {
        console.log(`   ⚠️  Port ${port}: In use`);
        allPortsAvailable = false;
      }
    }
    
    if (!allPortsAvailable) {
      console.log('\n⚠️  Some ports are in use. You may need to stop existing services.');
      const continueAnyway = await askQuestion('Continue anyway? (y/N): ');
      if (continueAnyway.toLowerCase() !== 'y') {
        process.exit(1);
      }
    }
    
    // Update environment files
    await updateEnvironmentFiles(serverIp);
    
    // Check firewall
    checkFirewall();
    
    // Display network information
    displayNetworkInfo(serverIp);
    
    console.log('\n🎉 Network configuration completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start services: npm run production:all');
    console.log('   2. Access from other devices using the URLs above');
    console.log('   3. Configure firewall if needed');
    console.log('   4. Test access from different devices');
    
  } catch (error) {
    console.log('❌ Network configuration failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateEnvironmentFiles, getNetworkIP, checkPort };
