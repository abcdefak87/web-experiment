#!/usr/bin/env node

/**
 * Auto-rebuild production builds when files change
 * Uses chokidar to watch for changes and rebuild automatically
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Try to use chokidar if available, otherwise use built-in fs.watch
let chokidar;
try {
  chokidar = require('chokidar');
} catch (e) {
  console.log('Installing chokidar for better file watching...');
  const { execSync } = require('child_process');
  execSync('npm install chokidar', { stdio: 'inherit' });
  chokidar = require('chokidar');
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${colors.yellow}⚠${colors.reset} ${msg}`),
  building: (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${colors.blue}🔨${colors.reset} ${msg}`),
};

// Build status
let isBuilding = false;
let buildQueue = false;
let serverProcess = null;
let clientBuildProcess = null;

// Paths
const clientPath = path.join(__dirname, 'client');
const serverPath = path.join(__dirname, 'server');

// Build client
async function buildClient() {
  if (isBuilding) {
    buildQueue = true;
    return;
  }
  
  isBuilding = true;
  log.building('Building client...');
  
  return new Promise((resolve) => {
    clientBuildProcess = spawn('npm', ['run', 'build'], {
      cwd: clientPath,
      shell: true,
      stdio: 'pipe'
    });
    
    clientBuildProcess.stdout.on('data', (data) => {
      process.stdout.write(`${colors.blue}[Client Build]${colors.reset} ${data}`);
    });
    
    clientBuildProcess.stderr.on('data', (data) => {
      process.stderr.write(`${colors.red}[Client Build Error]${colors.reset} ${data}`);
    });
    
    clientBuildProcess.on('close', (code) => {
      isBuilding = false;
      if (code === 0) {
        log.success('Client build completed!');
        
        // Start client in production mode
        startClient();
      } else {
        log.error(`Client build failed with code ${code}`);
      }
      
      // Check if there's a queued build
      if (buildQueue) {
        buildQueue = false;
        buildClient();
      }
      
      resolve();
    });
  });
}

// Start client in production mode
function startClient() {
  log.info('Starting client in production mode...');
  
  // Kill existing client process if running
  if (global.clientProcess) {
    global.clientProcess.kill();
  }
  
  global.clientProcess = spawn('npm', ['start'], {
    cwd: clientPath,
    shell: true,
    stdio: 'pipe'
  });
  
  global.clientProcess.stdout.on('data', (data) => {
    process.stdout.write(`${colors.green}[Client]${colors.reset} ${data}`);
  });
  
  global.clientProcess.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[Client Error]${colors.reset} ${data}`);
  });
}

// Start server with nodemon
function startServer() {
  log.info('Starting server with nodemon...');
  
  serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: serverPath,
    shell: true,
    stdio: 'pipe'
  });
  
  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(`${colors.yellow}[Server]${colors.reset} ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(`${colors.red}[Server Error]${colors.reset} ${data}`);
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      log.warning(`Server exited with code ${code}`);
    }
  });
}

// Setup file watchers
function setupWatchers() {
  log.info('Setting up file watchers...');
  
  // Watch client files
  const clientWatcher = chokidar.watch([
    path.join(clientPath, 'pages/**/*.{js,jsx,ts,tsx}'),
    path.join(clientPath, 'components/**/*.{js,jsx,ts,tsx}'),
    path.join(clientPath, 'lib/**/*.{js,jsx,ts,tsx}'),
    path.join(clientPath, 'contexts/**/*.{js,jsx,ts,tsx}'),
    path.join(clientPath, 'styles/**/*.css'),
    path.join(clientPath, 'public/**/*'),
  ], {
    ignored: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });
  
  // Debounce function
  let debounceTimer;
  const debounce = (func, wait) => {
    return (...args) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), wait);
    };
  };
  
  const handleClientChange = debounce((path) => {
    log.warning(`Client file changed: ${path}`);
    buildClient();
  }, 1000);
  
  clientWatcher
    .on('change', handleClientChange)
    .on('add', handleClientChange)
    .on('unlink', handleClientChange);
  
  log.success('File watchers setup complete!');
}

// Cleanup
function cleanup() {
  log.info('Shutting down...');
  
  if (clientBuildProcess) clientBuildProcess.kill();
  if (serverProcess) serverProcess.kill();
  if (global.clientProcess) global.clientProcess.kill();
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Handle exit signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Main function
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}🚀 PRODUCTION BUILD WATCHER${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`${colors.cyan}Client:${colors.reset} Auto-rebuild on file changes`);
  console.log(`${colors.yellow}Server:${colors.reset} Nodemon auto-restart`);
  console.log('='.repeat(60) + '\n');
  
  // Initial build
  await buildClient();
  
  // Start server
  startServer();
  
  // Setup watchers
  setupWatchers();
  
  log.success('All services started! Watching for changes...');
  console.log('\nPress Ctrl+C to stop\n');
}

// Start
main().catch(console.error);
