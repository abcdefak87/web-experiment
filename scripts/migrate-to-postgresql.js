#!/usr/bin/env node

/**
 * Migration Script: SQLite to PostgreSQL
 * This script helps migrate data from SQLite to PostgreSQL
 */

const { PrismaClient: SQLiteClient } = require('@prisma/client');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('🔄 SQLite to PostgreSQL Migration Script');
console.log('========================================\n');

// Configuration
const config = {
  sqliteDb: path.join(__dirname, '..', 'server', 'dev.db'),
  postgresUrl: process.env.DATABASE_URL || 'postgresql://isp_user:isp_secure_password_2024@localhost:5432/isp_management?schema=public'
};

// Initialize clients
let sqliteClient;
let postgresClient;

async function initClients() {
  console.log('🔌 Initializing database connections...');
  
  try {
    // SQLite client (read-only)
    sqliteClient = new SQLiteClient({
      datasources: {
        db: {
          url: `file:${config.sqliteDb}`
        }
      }
    });
    
    // PostgreSQL client
    postgresClient = new Client({
      connectionString: config.postgresUrl
    });
    
    await postgresClient.connect();
    
    console.log('✅ Database connections established');
    
  } catch (error) {
    console.log('❌ Error connecting to databases:', error.message);
    process.exit(1);
  }
}

// Check if SQLite database exists
function checkSQLiteDatabase() {
  if (!fs.existsSync(config.sqliteDb)) {
    console.log('❌ SQLite database not found at:', config.sqliteDb);
    console.log('   Make sure you have existing data to migrate');
    return false;
  }
  console.log('✅ SQLite database found');
  return true;
}

// Get table row counts
async function getRowCounts() {
  console.log('\n📊 Current data counts:');
  
  try {
    const tables = [
      'User', 'Technician', 'Customer', 'Job', 'Item', 
      'InventoryLog', 'Notification', 'OTP', 'AuditLog'
    ];
    
    for (const table of tables) {
      try {
        const count = await sqliteClient[table.toLowerCase()].count();
        console.log(`   ${table}: ${count} records`);
      } catch (error) {
        console.log(`   ${table}: Error counting (${error.message})`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error getting row counts:', error.message);
  }
}

// Migrate data
async function migrateData() {
  console.log('\n🚀 Starting data migration...');
  
  const tables = [
    { model: 'User', table: 'users' },
    { model: 'Technician', table: 'technicians' },
    { model: 'Customer', table: 'customers' },
    { model: 'Item', table: 'items' },
    { model: 'Job', table: 'jobs' },
    { model: 'InventoryLog', table: 'inventory_logs' },
    { model: 'Notification', table: 'notifications' },
    { model: 'OTP', table: 'otps' },
    { model: 'AuditLog', table: 'audit_logs' }
  ];
  
  for (const { model, table } of tables) {
    try {
      console.log(`\n📦 Migrating ${model}...`);
      
      // Get all records from SQLite
      const records = await sqliteClient[model.toLowerCase()].findMany();
      
      if (records.length === 0) {
        console.log(`   ⏭️  No ${model} records to migrate`);
        continue;
      }
      
      // Insert into PostgreSQL
      for (const record of records) {
        const values = Object.values(record).map(value => 
          value === null ? null : 
          typeof value === 'object' ? JSON.stringify(value) :
          value
        );
        
        const columns = Object.keys(record);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `
          INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `;
        
        await postgresClient.query(query, values);
      }
      
      console.log(`   ✅ Migrated ${records.length} ${model} records`);
      
    } catch (error) {
      console.log(`   ❌ Error migrating ${model}:`, error.message);
    }
  }
}

// Verify migration
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    const result = await postgresClient.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as row_count
      FROM pg_stat_user_tables
      ORDER BY tablename
    `);
    
    console.log('📊 PostgreSQL table counts:');
    result.rows.forEach(row => {
      console.log(`   ${row.tablename}: ${row.row_count} records`);
    });
    
  } catch (error) {
    console.log('❌ Error verifying migration:', error.message);
  }
}

// Cleanup
async function cleanup() {
  console.log('\n🧹 Cleaning up connections...');
  
  if (sqliteClient) {
    await sqliteClient.$disconnect();
  }
  
  if (postgresClient) {
    await postgresClient.end();
  }
  
  console.log('✅ Cleanup completed');
}

// Main execution
async function main() {
  try {
    if (!checkSQLiteDatabase()) {
      process.exit(1);
    }
    
    await initClients();
    await getRowCounts();
    
    console.log('\n⚠️  WARNING: This will migrate data from SQLite to PostgreSQL');
    console.log('   Make sure PostgreSQL database is empty or you want to overwrite existing data');
    
    // Uncomment the line below to proceed with migration
    // await migrateData();
    // await verifyMigration();
    
    console.log('\n🔧 To proceed with migration, uncomment the migration lines in this script');
    console.log('   Then run: node scripts/migrate-to-postgresql.js');
    
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
  } finally {
    await cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { initClients, migrateData, verifyMigration };
