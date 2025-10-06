#!/usr/bin/env node

/**
 * Production Startup Script
 * Starts all services for ISP Management System
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ISP Management System - Production Startup');
console.log('============================================\n');

// Configuration
const config = {
  serverPath: path.join(__dirname, 'server'),
  clientPath: path.join(__dirname, 'client'),
  whatsappScript: path.join(__dirname, 'scripts', 'whatsapp-bot-integrated.js'),
  ports: {
    frontend: 3000,
    backend: 3001,
    prisma: 5555
  }
};

// Kill processes running on specific ports
function killPortProcesses() {
  return new Promise((resolve) => {
    console.log('🔍 Checking for running processes on ports...');
    
    const ports = Object.values(config.ports);
    let completedChecks = 0;
    
    ports.forEach(port => {
      // Multiple methods to kill processes on port
      const killCommands = [];
      
      if (process.platform === 'win32') {
        // Windows methods
        killCommands.push(`netstat -ano | findstr :${port}`);
        killCommands.push(`taskkill /F /IM node.exe`);
        killCommands.push(`taskkill /F /IM npm.exe`);
      } else {
        // Linux/Unix methods - more aggressive
        killCommands.push(`lsof -ti:${port}`);
        killCommands.push(`fuser -k ${port}/tcp`);
        killCommands.push(`pkill -f "node.*${port}"`);
        killCommands.push(`pkill -f "npm.*start"`);
        killCommands.push(`pkill -f "next.*start"`);
        killCommands.push(`pkill -f "whatsapp-bot"`);
      }
      
      // Execute kill commands
      let killAttempts = 0;
      const maxAttempts = killCommands.length;
      
      const attemptKill = () => {
        if (killAttempts >= maxAttempts) {
          console.log(`   ✅ Port ${port} cleanup attempted`);
          completedChecks++;
          if (completedChecks === ports.length) {
            // Wait longer for processes to be killed
            setTimeout(() => {
              console.log('✅ Port cleanup completed\n');
              resolve();
            }, 5000); // Increased wait time
          }
          return;
        }
        
        const command = killCommands[killAttempts];
        exec(command, (error, stdout, stderr) => {
          if (stdout && stdout.trim()) {
            console.log(`⚠️  Port ${port} is in use, killing with method ${killAttempts + 1}...`);
            
            if (process.platform === 'win32') {
              // Windows: Extract PID and kill
              const lines = stdout.trim().split('\n');
              const pids = new Set();
              
              lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 5) {
                  const pid = parts[parts.length - 1];
                  if (pid && !isNaN(pid)) {
                    pids.add(pid);
                  }
                }
              });
              
              pids.forEach(pid => {
                exec(`taskkill /F /PID ${pid}`, (killError) => {
                  if (!killError) {
                    console.log(`   ✅ Killed process ${pid} on port ${port}`);
                  }
                });
              });
            } else {
              // Linux: Direct kill
              const pid = stdout.trim().split('\n')[0];
              if (pid) {
                exec(`kill -9 ${pid}`, (killError) => {
                  if (!killError) {
                    console.log(`   ✅ Killed process ${pid} on port ${port}`);
                  }
                });
              }
            }
          } else {
            console.log(`   ✅ Port ${port} is available (method ${killAttempts + 1})`);
          }
          
          killAttempts++;
          setTimeout(attemptKill, 1000); // Wait 1 second between attempts
        });
      };
      
      attemptKill();
    });
  });
}

// Check if .env exists
function checkEnvironment() {
  const envPath = path.join(config.serverPath, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('   Please run: node scripts/setup-production.js');
    process.exit(1);
  }
  console.log('✅ Environment configuration found');
}

// Build Frontend Client (following rebuild-frontend.sh pattern)
function buildFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Rebuilding frontend...');
    
    // Step 1: Install dependencies
    console.log('📦 Installing dependencies...');
    const installProcess = spawn('npm', ['install'], {
      cwd: config.clientPath,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let installOutput = '';
    installProcess.stdout.on('data', (data) => {
      installOutput += data.toString();
    });
    
    installProcess.stderr.on('data', (data) => {
      installOutput += data.toString();
    });
    
    installProcess.on('close', (installCode) => {
      if (installCode !== 0) {
        console.error('❌ npm install failed');
        console.error('Install output:', installOutput);
        reject(new Error(`npm install failed with code ${installCode}`));
        return;
      }
      
      console.log('✅ Dependencies installed');
      
      // Step 2: Build the frontend
      console.log('🏗️ Building frontend...');
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: config.clientPath,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let buildOutput = '';
      
      buildProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        buildOutput += output + '\n';
        
        // Show progress indicators
        if (output.includes('Creating optimized production build')) {
          console.log('   📦 Creating optimized production build...');
        } else if (output.includes('Compiled successfully')) {
          console.log('   ✅ Build completed successfully');
        } else if (output.includes('Failed to compile')) {
          console.log('   ❌ Build failed');
        }
      });
      
      buildProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        buildOutput += error + '\n';
        if (error.includes('Error') || error.includes('Failed')) {
          console.error(`   ❌ Build error: ${error}`);
        }
      });
      
      buildProcess.on('close', (buildCode) => {
        if (buildCode === 0) {
          console.log('✅ Frontend build successful!');
          console.log('🚀 Frontend rebuild completed!');
          resolve();
        } else {
          console.error('❌ Frontend build failed!');
          console.error('Build output:', buildOutput);
          reject(new Error(`Build process exited with code ${buildCode}`));
        }
      });
      
      buildProcess.on('error', (error) => {
        console.error('❌ Build process error:', error.message);
        reject(error);
      });
    });
    
    installProcess.on('error', (error) => {
      console.error('❌ Install process error:', error.message);
      reject(error);
    });
  });
}

// Start Backend Server
function startBackend() {
  console.log('🔧 Starting backend server...');
  
  const serverProcess = spawn('npm', ['run', 'start:production'], {
    cwd: config.serverPath,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.toString().trim()}`);
  });
  
  serverProcess.unref();
  console.log(`   ✅ Backend server started (PID: ${serverProcess.pid})`);
  return serverProcess;
}

// Start WhatsApp Bot
function startWhatsApp() {
  console.log('📱 Starting WhatsApp bot...');
  
  const whatsappProcess = spawn('node', [config.whatsappScript], {
    cwd: __dirname,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  whatsappProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('QR') || output.includes('connected') || output.includes('Bot')) {
      console.log(`[WHATSAPP] ${output}`);
    }
  });
  
  whatsappProcess.stderr.on('data', (data) => {
    console.error(`[WHATSAPP ERROR] ${data.toString().trim()}`);
  });
  
  whatsappProcess.unref();
  console.log(`   ✅ WhatsApp bot started (PID: ${whatsappProcess.pid})`);
  return whatsappProcess;
}

// Start Frontend Client
function startFrontend() {
  console.log('🌐 Starting frontend client...');
  
  const clientProcess = spawn('npm', ['run', 'start'], {
    cwd: config.clientPath,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  clientProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('ready') || output.includes('localhost:3000')) {
      console.log(`[CLIENT] ${output}`);
    }
  });
  
  clientProcess.stderr.on('data', (data) => {
    console.error(`[CLIENT ERROR] ${data.toString().trim()}`);
  });
  
  clientProcess.unref();
  console.log(`   ✅ Frontend client started (PID: ${clientProcess.pid})`);
  return clientProcess;
}

// Verify ports are free before starting services
function verifyPortsFree() {
  return new Promise((resolve) => {
    console.log('🔍 Verifying ports are free...');
    
    const ports = Object.values(config.ports);
    let freePorts = 0;
    
    ports.forEach(port => {
      const command = process.platform === 'win32' 
        ? `netstat -ano | findstr :${port}`
        : `lsof -ti:${port}`;
      
      exec(command, (error, stdout, stderr) => {
        if (stdout && stdout.trim()) {
          console.log(`❌ Port ${port} is still in use!`);
          console.log(`   Process: ${stdout.trim()}`);
        } else {
          console.log(`✅ Port ${port} is free`);
          freePorts++;
        }
        
        if (freePorts === ports.length) {
          console.log('✅ All ports are free\n');
          resolve();
        }
      });
    });
  });
}

// Main startup function
async function startAll() {
  try {
    checkEnvironment();
    
    // Kill any existing processes on required ports
    await killPortProcesses();
    
    // Verify ports are free before starting
    await verifyPortsFree();
    
    console.log('🚀 Starting production deployment...\n');
    
    // Build frontend first
    try {
      await buildFrontend();
      console.log('✅ Frontend build completed\n');
    } catch (error) {
      console.error('❌ Frontend build failed:', error.message);
      console.log('   Please check the build errors above and try again');
      process.exit(1);
    }
    
    console.log('Starting all services...\n');
    
    // Start services with delays
    const serverProcess = startBackend();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const whatsappProcess = startWhatsApp();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const clientProcess = startFrontend();
    
    console.log('\n🎉 All services started successfully!');
    console.log('\n📋 Service URLs:');
    console.log(`   Frontend: http://172.17.2.3:${config.ports.frontend}`);
    console.log(`   Backend API: http://172.17.2.3:${config.ports.backend}`);
    console.log(`   Prisma Studio: http://172.17.2.3:${config.ports.prisma}`);
    
    console.log('\n📱 WhatsApp Bot:');
    console.log('   QR Code: ./qr-codes/whatsapp-qr.png');
    console.log('   Web QR: http://172.17.2.3:3001/qr/whatsapp-qr.png');
    console.log('   Commands: /menu, /daftar, /jobs, /myjobs, /stats');
    
    console.log('\n🔧 Management:');
    console.log('   Stop all: Ctrl+C');
    console.log('   Logs: tail -f server/logs/app.log');
    console.log('   Status: cat scripts/whatsapp-status.json');
    console.log('   Port cleanup: Auto-kills processes on ports 3000, 3001, 5555');
    console.log('   Build: Frontend automatically built before start');
    console.log('   Backup: Original script saved as start-production-all.js.backup');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🔄 Shutting down services...');
      
      try {
        process.kill(serverProcess.pid, 'SIGTERM');
        process.kill(whatsappProcess.pid, 'SIGTERM');
        process.kill(clientProcess.pid, 'SIGTERM');
        console.log('✅ All services stopped');
      } catch (error) {
        console.log('⚠️ Some services may still be running');
      }
      
      process.exit(0);
    });
    
    // Keep the script running
    console.log('\n⏰ Services are running... Press Ctrl+C to stop all services');
    
  } catch (error) {
    console.error('❌ Error starting services:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  startAll().catch(console.error);
}

module.exports = { startAll };
