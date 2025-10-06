#!/usr/bin/env node

/**
 * Git Helper Script
 * Helper untuk membuat branch dan commit dengan format yang benar
 * 
 * Usage:
 * node scripts/git-helper.js branch <type> <name>
 * node scripts/git-helper.js commit <type> <message>
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Definisi tipe branch
const BRANCH_TYPES = {
  feature: { prefix: 'feature/', description: 'Fitur baru' },
  bugfix: { prefix: 'bugfix/', description: 'Perbaikan bug' },
  hotfix: { prefix: 'hotfix/', description: 'Perbaikan urgent' },
  release: { prefix: 'release/', description: 'Release version' },
  chore: { prefix: 'chore/', description: 'Maintenance' },
  docs: { prefix: 'docs/', description: 'Dokumentasi' },
  test: { prefix: 'test/', description: 'Testing' },
  refactor: { prefix: 'refactor/', description: 'Refaktor kode' }
};

// Definisi tipe commit dengan emoji
const COMMIT_TYPES = {
  feat: { emoji: '✨', description: 'Fitur baru' },
  fix: { emoji: '🐛', description: 'Perbaikan bug' },
  docs: { emoji: '📝', description: 'Update dokumentasi' },
  style: { emoji: '🎨', description: 'Format kode' },
  refactor: { emoji: '♻️', description: 'Refaktor kode' },
  perf: { emoji: '⚡', description: 'Peningkatan performa' },
  test: { emoji: '✅', description: 'Menambah test' },
  chore: { emoji: '🔧', description: 'Maintenance' },
  deploy: { emoji: '🚀', description: 'Deploy production' },
  merge: { emoji: '🔀', description: 'Merge branch' },
  revert: { emoji: '⏪', description: 'Revert commit' },
  wip: { emoji: '🚧', description: 'Work in progress' },
  security: { emoji: '🔐', description: 'Perbaikan keamanan' },
  remove: { emoji: '🗑️', description: 'Hapus file/kode' },
  deps: { emoji: '📦', description: 'Update dependencies' },
  docker: { emoji: '🐳', description: 'Docker changes' },
  hotfix: { emoji: '🔥', description: 'Hotfix critical' },
  ui: { emoji: '💄', description: 'Update UI/UX' },
  responsive: { emoji: '📱', description: 'Responsive design' },
  log: { emoji: '🔊', description: 'Add/update logging' },
  arch: { emoji: '🏗️', description: 'Perubahan arsitektur' }
};

// Helper function untuk eksekusi git command
function executeGitCommand(command) {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Fungsi untuk membuat branch baru
function createBranch(type, name) {
  if (!BRANCH_TYPES[type]) {
    console.error(`❌ Tipe branch tidak valid: ${type}`);
    console.log('📋 Tipe yang tersedia:');
    Object.keys(BRANCH_TYPES).forEach(t => {
      console.log(`  - ${t}: ${BRANCH_TYPES[t].description}`);
    });
    return;
  }

  const branchName = `${BRANCH_TYPES[type].prefix}${name}`;
  
  console.log(`\n🌿 Membuat branch: ${branchName}`);
  
  // Check current branch
  const currentBranch = executeGitCommand('git branch --show-current');
  console.log(`📍 Branch saat ini: ${currentBranch}`);
  
  // Prompt untuk pull latest
  console.log('\n⚠️  Pastikan Anda sudah pull latest dari branch utama!');
  
  // Create and checkout new branch
  try {
    executeGitCommand(`git checkout -b ${branchName}`);
    console.log(`✅ Branch '${branchName}' berhasil dibuat dan checkout!`);
    
    // Info untuk push
    console.log(`\n📤 Untuk push ke remote, gunakan:`);
    console.log(`   git push -u origin ${branchName}`);
  } catch (error) {
    console.error(`❌ Gagal membuat branch: ${error.message}`);
  }
}

// Fungsi untuk membuat commit dengan format yang benar
function createCommit(type, message) {
  if (!COMMIT_TYPES[type]) {
    console.error(`❌ Tipe commit tidak valid: ${type}`);
    console.log('📋 Tipe yang tersedia:');
    Object.keys(COMMIT_TYPES).forEach(t => {
      console.log(`  ${COMMIT_TYPES[t].emoji} ${t}: ${COMMIT_TYPES[t].description}`);
    });
    return;
  }

  const commitMessage = `${COMMIT_TYPES[type].emoji} ${type}: ${message}`;
  
  console.log(`\n💬 Commit message: ${commitMessage}`);
  
  // Check status
  const status = executeGitCommand('git status --porcelain');
  if (!status) {
    console.log('⚠️  Tidak ada perubahan untuk di-commit');
    return;
  }
  
  console.log('\n📝 File yang berubah:');
  console.log(status);
  
  // Create interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n❓ Lanjutkan commit? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      try {
        // Stage all changes
        executeGitCommand('git add .');
        
        // Commit with message
        executeGitCommand(`git commit -m "${commitMessage}"`);
        console.log('✅ Commit berhasil!');
        
        // Show commit info
        const lastCommit = executeGitCommand('git log -1 --oneline');
        console.log(`\n📌 Commit terakhir: ${lastCommit}`);
        
        console.log('\n📤 Untuk push ke remote, gunakan:');
        console.log('   git push');
      } catch (error) {
        console.error(`❌ Gagal commit: ${error.message}`);
      }
    } else {
      console.log('❌ Commit dibatalkan');
    }
    rl.close();
  });
}

// Fungsi untuk menampilkan help
function showHelp() {
  console.log(`
📚 Git Helper - ISP Management System
=====================================

🌿 BRANCH COMMANDS:
  node scripts/git-helper.js branch <type> <name>
  
  Contoh:
  node scripts/git-helper.js branch feature dashboard-baru
  node scripts/git-helper.js branch bugfix form-validation
  node scripts/git-helper.js branch hotfix login-crash

  Tipe branch yang tersedia:
${Object.entries(BRANCH_TYPES).map(([key, val]) => 
  `    ${key.padEnd(10)} - ${val.description}`
).join('\n')}

💬 COMMIT COMMANDS:
  node scripts/git-helper.js commit <type> "<message>"
  
  Contoh:
  node scripts/git-helper.js commit feat "tambah dashboard pelanggan"
  node scripts/git-helper.js commit fix "perbaiki validasi form"
  node scripts/git-helper.js commit docs "update README"

  Tipe commit yang tersedia:
${Object.entries(COMMIT_TYPES).map(([key, val]) => 
  `    ${val.emoji} ${key.padEnd(10)} - ${val.description}`
).join('\n')}

📊 INFORMASI:
  node scripts/git-helper.js status    - Lihat git status
  node scripts/git-helper.js log       - Lihat git log dengan format bagus
  node scripts/git-helper.js branches  - Lihat semua branches

🔗 QUICK ACTIONS:
  node scripts/git-helper.js push      - Push branch saat ini
  node scripts/git-helper.js pull      - Pull dari origin
  node scripts/git-helper.js sync      - Sync dengan branch utama
  `);
}

// Fungsi untuk menampilkan status
function showStatus() {
  console.log('\n📊 Git Status:');
  console.log('==============');
  const branch = executeGitCommand('git branch --show-current');
  console.log(`🌿 Branch: ${branch}`);
  
  const status = executeGitCommand('git status --short');
  if (status) {
    console.log('\n📝 Perubahan:');
    console.log(status);
  } else {
    console.log('✨ Working directory clean');
  }
  
  const lastCommit = executeGitCommand('git log -1 --oneline');
  console.log(`\n📌 Last commit: ${lastCommit}`);
}

// Fungsi untuk menampilkan log dengan format bagus
function showLog() {
  console.log('\n📜 Git Log (10 commits terakhir):');
  console.log('===================================');
  const log = executeGitCommand('git log --oneline --graph --decorate -10');
  console.log(log);
}

// Fungsi untuk menampilkan semua branches
function showBranches() {
  console.log('\n🌿 Git Branches:');
  console.log('================');
  const branches = executeGitCommand('git branch -a');
  console.log(branches);
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];
const param1 = args[1];
const param2 = args.slice(2).join(' ');

switch(command) {
  case 'branch':
    if (!param1 || !param2) {
      console.error('❌ Usage: node scripts/git-helper.js branch <type> <name>');
      console.log('Contoh: node scripts/git-helper.js branch feature dashboard-baru');
    } else {
      createBranch(param1, param2);
    }
    break;
    
  case 'commit':
    if (!param1 || !param2) {
      console.error('❌ Usage: node scripts/git-helper.js commit <type> "<message>"');
      console.log('Contoh: node scripts/git-helper.js commit feat "tambah fitur baru"');
    } else {
      createCommit(param1, param2);
    }
    break;
    
  case 'status':
    showStatus();
    break;
    
  case 'log':
    showLog();
    break;
    
  case 'branches':
    showBranches();
    break;
    
  case 'push':
    console.log('📤 Pushing to remote...');
    try {
      const output = executeGitCommand('git push');
      console.log('✅ Push berhasil!');
    } catch (error) {
      // Try push with upstream
      console.log('⚠️  Setting upstream and pushing...');
      const branch = executeGitCommand('git branch --show-current');
      executeGitCommand(`git push -u origin ${branch}`);
      console.log('✅ Push berhasil dengan upstream!');
    }
    break;
    
  case 'pull':
    console.log('📥 Pulling from remote...');
    const pullOutput = executeGitCommand('git pull');
    console.log(pullOutput);
    console.log('✅ Pull berhasil!');
    break;
    
  case 'sync':
    console.log('🔄 Syncing dengan main/develop...');
    const currentBranch = executeGitCommand('git branch --show-current');
    
    // Check if main or develop exists
    const branches = executeGitCommand('git branch -a');
    const baseBranch = branches.includes('develop') ? 'develop' : 'main';
    
    console.log(`📍 Branch saat ini: ${currentBranch}`);
    console.log(`🎯 Sync dengan: ${baseBranch}`);
    
    executeGitCommand(`git fetch origin ${baseBranch}`);
    executeGitCommand(`git merge origin/${baseBranch}`);
    console.log('✅ Sync berhasil!');
    break;
    
  case 'help':
  default:
    showHelp();
}
