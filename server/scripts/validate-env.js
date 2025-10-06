#!/usr/bin/env node

/**
 * Script untuk validasi environment variables
 * Jalankan dengan: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

// Required environment variables
const requiredVars = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLIENT_URL'
];

// Optional but recommended
const recommendedVars = [
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
  'SESSION_SECRET',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS'
];

console.log('🔍 Validating environment variables...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('📝 Create .env file from .env.example:');
  console.log('   cp .env.example .env');
  process.exit(1);
}

// Load .env file
require('dotenv').config({ path: envPath });

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    hasErrors = true;
  }
});

console.log('\n📋 Recommended Variables:');
recommendedVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`⚠️  ${varName}: Not set (recommended)`);
    hasWarnings = true;
  }
});

// Validate JWT Secret strength
if (process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET.length < 32) {
    console.log('\n⚠️  JWT_SECRET is too short! Should be at least 32 characters.');
    console.log('   Generate a secure secret with: node scripts/generate-jwt-secret.js');
    hasWarnings = true;
  }
  if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_this_in_production') {
    console.log('\n⚠️  JWT_SECRET is using default value! This is insecure.');
    console.log('   Generate a secure secret with: node scripts/generate-jwt-secret.js');
    hasWarnings = true;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Environment validation failed!');
  console.log('   Please set all required variables in .env file');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Environment validation passed with warnings');
  console.log('   Consider setting recommended variables for production');
} else {
  console.log('✅ Environment validation passed!');
  console.log('   All variables are properly configured');
}
