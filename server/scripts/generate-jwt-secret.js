#!/usr/bin/env node

/**
 * Script untuk generate JWT Secret yang aman
 * Jalankan dengan: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

console.log('🔐 Generating secure JWT secrets...\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log();

// Generate JWT Refresh Secret
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_REFRESH_SECRET:');
console.log(jwtRefreshSecret);
console.log();

// Generate Session Secret
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET:');
console.log(sessionSecret);
console.log();

console.log('✅ Secrets generated successfully!');
console.log('📋 Copy these values to your .env file');
console.log('⚠️  Keep these secrets secure and never commit them to git');
