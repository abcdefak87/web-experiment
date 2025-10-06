#!/usr/bin/env node

/**
 * PostgreSQL Setup Script
 * This script helps set up PostgreSQL database for the ISP Management System
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 PostgreSQL Setup Script for ISP Management System');
console.log('====================================================\n');

// Check if PostgreSQL is installed
function checkPostgreSQL() {
  try {
    execSync('psql --version', { stdio: 'pipe' });
    console.log('✅ PostgreSQL is installed');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL is not installed');
    console.log('\n📦 Please install PostgreSQL first:');
    console.log('   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib');
    console.log('   CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib');
    console.log('   Windows: Download from https://www.postgresql.org/download/windows/');
    console.log('   macOS: brew install postgresql');
    return false;
  }
}

// Create database and user
function setupDatabase() {
  console.log('\n🔧 Setting up database...');
  
  const dbName = 'isp_management';
  const dbUser = 'isp_user';
  const dbPassword = process.env.DB_PASSWORD || 'isp_secure_password_2024';
  
  try {
    // Create database
    execSync(`sudo -u postgres createdb ${dbName}`, { stdio: 'pipe' });
    console.log(`✅ Database '${dbName}' created`);
    
    // Create user
    execSync(`sudo -u postgres psql -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}';"`, { stdio: 'pipe' });
    console.log(`✅ User '${dbUser}' created`);
    
    // Grant privileges
    execSync(`sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`, { stdio: 'pipe' });
    console.log(`✅ Privileges granted to '${dbUser}'`);
    
    // Update .env file
    updateEnvFile(dbUser, dbPassword, dbName);
    
  } catch (error) {
    console.log('❌ Error setting up database:', error.message);
    console.log('\n🔧 Manual setup required:');
    console.log(`   1. sudo -u postgres createdb ${dbName}`);
    console.log(`   2. sudo -u postgres psql -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}';"`);
    console.log(`   3. sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`);
  }
}

// Update .env file with database URL
function updateEnvFile(user, password, database) {
  const envPath = path.join(__dirname, '..', 'server', '.env');
  const envExamplePath = path.join(__dirname, '..', 'server', 'env.production.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    // Copy from example
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    const updatedContent = envContent.replace(
      'postgresql://isp_user:your_secure_password@localhost:5432/isp_management?schema=public',
      `postgresql://${user}:${password}@localhost:5432/${database}?schema=public`
    );
    
    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ .env file created with database configuration');
  } else if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists. Please update DATABASE_URL manually:');
    console.log(`   DATABASE_URL="postgresql://${user}:${password}@localhost:5432/${database}?schema=public"`);
  }
}

// Run Prisma commands
function runPrismaSetup() {
  console.log('\n🔧 Running Prisma setup...');
  
  const serverPath = path.join(__dirname, '..', 'server');
  
  try {
    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { cwd: serverPath, stdio: 'inherit' });
    
    // Generate Prisma client
    console.log('🔨 Generating Prisma client...');
    execSync('npx prisma generate', { cwd: serverPath, stdio: 'inherit' });
    
    // Run migrations
    console.log('🚀 Running database migrations...');
    execSync('npx prisma migrate dev --name init', { cwd: serverPath, stdio: 'inherit' });
    
    console.log('✅ Prisma setup completed successfully!');
    
  } catch (error) {
    console.log('❌ Error during Prisma setup:', error.message);
    console.log('\n🔧 Manual commands:');
    console.log('   cd server');
    console.log('   npm install');
    console.log('   npx prisma generate');
    console.log('   npx prisma migrate dev --name init');
  }
}

// Main execution
async function main() {
  console.log('Starting PostgreSQL setup...\n');
  
  if (!checkPostgreSQL()) {
    process.exit(1);
  }
  
  setupDatabase();
  runPrismaSetup();
  
  console.log('\n🎉 PostgreSQL setup completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Update your .env file with correct database credentials');
  console.log('   2. Run: cd server && npm run dev');
  console.log('   3. Test the application');
  console.log('\n🔧 Database connection string:');
  console.log('   postgresql://isp_user:isp_secure_password_2024@localhost:5432/isp_management?schema=public');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkPostgreSQL, setupDatabase, runPrismaSetup };
