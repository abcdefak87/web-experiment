# PostgreSQL Setup Guide

Panduan lengkap untuk setup PostgreSQL pada ISP Management System.

## 🎯 Overview

Aplikasi ini telah dimigrasikan dari SQLite ke PostgreSQL untuk production environment. PostgreSQL memberikan performa dan skalabilitas yang lebih baik untuk aplikasi enterprise.

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm atau yarn

## 🚀 Quick Setup

### 1. Install PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### CentOS/RHEL
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
1. Download dari: https://www.postgresql.org/download/windows/
2. Install dengan default settings
3. Set password untuk postgres user

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

### 2. Setup Database

#### Manual Setup
```bash
# Login sebagai postgres user
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE isp_management;
CREATE USER isp_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE isp_management TO isp_user;
\q
```

#### Automated Setup
```bash
# Jalankan script setup otomatis
node scripts/setup-postgresql.js
```

### 3. Configure Environment

```bash
# Copy environment template
cp server/env.production.example server/.env

# Edit .env file
nano server/.env
```

Update `DATABASE_URL`:
```
DATABASE_URL="postgresql://isp_user:your_secure_password@localhost:5432/isp_management?schema=public"
```

### 4. Install Dependencies & Migrate

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed Data (Optional)

```bash
npm run db:seed
```

## 🔄 Migration dari SQLite

Jika Anda memiliki data existing di SQLite:

### 1. Backup Data Existing
```bash
# Backup SQLite database
cp server/dev.db server/dev.db.backup
```

### 2. Run Migration Script
```bash
# Jalankan migration script
node scripts/migrate-to-postgresql.js
```

### 3. Verify Migration
```bash
# Check data di PostgreSQL
psql -U isp_user -d isp_management -c "SELECT COUNT(*) FROM users;"
```

## 🐳 Docker Setup (Alternative)

### 1. Create docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: isp_management
      POSTGRES_USER: isp_user
      POSTGRES_PASSWORD: isp_secure_password_2024
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

### 2. Start PostgreSQL
```bash
docker-compose up -d postgres
```

## 🔧 Configuration

### Database Connection Pool
```javascript
// server/utils/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Performance Tuning
```sql
-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

## 📊 Monitoring

### Database Size
```sql
SELECT pg_size_pretty(pg_database_size('isp_management'));
```

### Connection Status
```sql
SELECT * FROM pg_stat_activity WHERE datname = 'isp_management';
```

### Slow Queries
```sql
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## 🔒 Security

### 1. Database User Permissions
```sql
-- Create read-only user untuk reporting
CREATE USER isp_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE isp_management TO isp_readonly;
GRANT USAGE ON SCHEMA public TO isp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO isp_readonly;
```

### 2. SSL Configuration
```bash
# Enable SSL di postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

### 3. Firewall Rules
```bash
# Allow only local connections
# Edit pg_hba.conf
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

## 🚨 Backup & Recovery

### Daily Backup
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U isp_user -h localhost isp_management > backup_${DATE}.sql
gzip backup_${DATE}.sql
```

### Restore
```bash
# Restore dari backup
gunzip backup_20240101_120000.sql.gz
psql -U isp_user -d isp_management < backup_20240101_120000.sql
```

### Automated Backup
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Connection Refused
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if port is listening
netstat -tlnp | grep 5432
```

#### 2. Authentication Failed
```bash
# Reset password
sudo -u postgres psql
ALTER USER isp_user WITH PASSWORD 'new_password';
```

#### 3. Permission Denied
```bash
# Grant permissions
sudo -u postgres psql -d isp_management
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO isp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO isp_user;
```

#### 4. Migration Errors
```bash
# Reset database
npx prisma migrate reset

# Or manual reset
sudo -u postgres psql
DROP DATABASE isp_management;
CREATE DATABASE isp_management;
GRANT ALL PRIVILEGES ON DATABASE isp_management TO isp_user;
```

## 📈 Performance Monitoring

### 1. Enable Query Statistics
```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 2. Index Usage
```sql
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;
```

## 🔄 Rollback Plan

Jika perlu rollback ke SQLite:

1. **Stop Application**
```bash
pm2 stop isp-management
```

2. **Revert Prisma Schema**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

3. **Update Environment**
```bash
DATABASE_URL="file:./dev.db"
```

4. **Restore Data**
```bash
cp server/dev.db.backup server/dev.db
```

5. **Restart Application**
```bash
pm2 start isp-management
```

## 📞 Support

Jika mengalami masalah:
1. Check logs: `tail -f server/logs/app.log`
2. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
3. Verify connection: `psql -U isp_user -d isp_management -c "SELECT 1;"`

---

**Happy Coding! 🚀**
