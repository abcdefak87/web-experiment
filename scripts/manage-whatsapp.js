#!/usr/bin/env node

/**
 * WhatsApp Bot Management Script
 * Start, stop, restart, and monitor WhatsApp bot
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('📱 WhatsApp Bot Management');
console.log('=========================\n');

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

// Check if WhatsApp bot is running
function checkBotStatus() {
  return new Promise((resolve) => {
    exec('pgrep -f "whatsapp-bot-integrated"', (error, stdout) => {
      if (error) {
        resolve({ running: false, pid: null });
      } else {
        const pid = stdout.trim();
        resolve({ running: true, pid: pid });
      }
    });
  });
}

// Check WhatsApp status file
function checkStatusFile() {
  const statusFile = path.join(__dirname, 'whatsapp-status.json');
  if (fs.existsSync(statusFile)) {
    try {
      const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      return status;
    } catch (error) {
      return null;
    }
  }
  return null;
}

// Start WhatsApp bot
async function startBot() {
  const status = await checkBotStatus();
  
  if (status.running) {
    console.log('⚠️ WhatsApp bot is already running (PID: ' + status.pid + ')');
    const restart = await askQuestion('Do you want to restart it? (y/N): ');
    if (restart.toLowerCase() === 'y') {
      await stopBot();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      return;
    }
  }
  
  console.log('🚀 Starting WhatsApp bot...');
  
  const botProcess = spawn('node', ['scripts/whatsapp-bot-integrated.js'], {
    cwd: path.join(__dirname, '..'),
    detached: true,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  botProcess.unref();
  console.log('✅ WhatsApp bot started (PID: ' + botProcess.pid + ')');
  console.log('📱 Bot will generate QR code for WhatsApp connection');
  console.log('📁 QR code location: ./qr-codes/whatsapp-qr.png');
}

// Stop WhatsApp bot
async function stopBot() {
  const status = await checkBotStatus();
  
  if (!status.running) {
    console.log('⚠️ WhatsApp bot is not running');
    return;
  }
  
  console.log('🛑 Stopping WhatsApp bot...');
  
  try {
    process.kill(parseInt(status.pid), 'SIGTERM');
    console.log('✅ WhatsApp bot stopped');
  } catch (error) {
    console.log('❌ Error stopping bot:', error.message);
  }
}

// Restart WhatsApp bot
async function restartBot() {
  console.log('🔄 Restarting WhatsApp bot...');
  await stopBot();
  await new Promise(resolve => setTimeout(resolve, 3000));
  await startBot();
}

// Show bot status
async function showStatus() {
  const processStatus = await checkBotStatus();
  const fileStatus = checkStatusFile();
  
  console.log('\n📊 WhatsApp Bot Status:');
  console.log('======================');
  
  if (processStatus.running) {
    console.log('✅ Process Status: Running (PID: ' + processStatus.pid + ')');
  } else {
    console.log('❌ Process Status: Not Running');
  }
  
  if (fileStatus) {
    console.log('📱 Connection Status: ' + (fileStatus.connected ? 'Connected' : 'Disconnected'));
    if (fileStatus.user) {
      console.log('👤 Bot User: ' + fileStatus.user.name + ' (' + fileStatus.user.phone + ')');
    }
    console.log('⏱️ Last Update: ' + new Date(fileStatus.lastUpdate).toLocaleString());
    console.log('💬 Commands Processed: ' + fileStatus.commandCount);
  } else {
    console.log('📄 Status File: Not Available');
  }
  
  // Check QR code
  const qrPath = path.join(__dirname, '..', 'qr-codes', 'whatsapp-qr.png');
  if (fs.existsSync(qrPath)) {
    console.log('📁 QR Code: Available at ./qr-codes/whatsapp-qr.png');
  } else {
    console.log('📁 QR Code: Not available');
  }
}

// Monitor bot logs
function monitorLogs() {
  console.log('📋 Monitoring WhatsApp bot... (Press Ctrl+C to stop)');
  
  const statusFile = path.join(__dirname, 'whatsapp-status.json');
  let lastUpdate = null;
  
  const interval = setInterval(() => {
    if (fs.existsSync(statusFile)) {
      try {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        if (status.lastUpdate !== lastUpdate) {
          console.log(`[${new Date().toLocaleTimeString()}] Status: ${status.connected ? 'Connected' : 'Disconnected'} | Commands: ${status.commandCount}`);
          lastUpdate = status.lastUpdate;
        }
      } catch (error) {
        // Ignore read errors
      }
    }
  }, 5000);
  
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n✅ Monitoring stopped');
    rl.close();
  });
}

// Clean session
async function cleanSession() {
  const confirm = await askQuestion('⚠️ This will delete WhatsApp session and require re-authentication. Continue? (y/N): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Session cleanup cancelled');
    return;
  }
  
  const sessionPath = path.join(__dirname, '..', 'auth_info_baileys');
  
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log('✅ Session cleaned');
  } else {
    console.log('⚠️ No session found to clean');
  }
  
  // Also clean QR code
  const qrPath = path.join(__dirname, '..', 'qr-codes', 'whatsapp-qr.png');
  if (fs.existsSync(qrPath)) {
    fs.unlinkSync(qrPath);
    console.log('✅ QR code cleaned');
  }
}

// Main menu
async function showMenu() {
  console.log('\n📱 WhatsApp Bot Management Menu:');
  console.log('================================');
  console.log('1. Start Bot');
  console.log('2. Stop Bot');
  console.log('3. Restart Bot');
  console.log('4. Show Status');
  console.log('5. Monitor Logs');
  console.log('6. Clean Session');
  console.log('7. Exit');
  
  const choice = await askQuestion('\nSelect option (1-7): ');
  
  switch (choice) {
    case '1':
      await startBot();
      break;
    case '2':
      await stopBot();
      break;
    case '3':
      await restartBot();
      break;
    case '4':
      await showStatus();
      break;
    case '5':
      monitorLogs();
      return; // Don't show menu again
    case '6':
      await cleanSession();
      break;
    case '7':
      console.log('👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid option');
  }
  
  // Show menu again
  await showMenu();
}

// Main execution
async function main() {
  try {
    await showMenu();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { startBot, stopBot, restartBot, showStatus, cleanSession };
