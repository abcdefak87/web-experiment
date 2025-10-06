# Production Setup Guide

Panduan lengkap untuk setup production ISP Management System dengan PostgreSQL, JWT secrets, dan WhatsApp bot.

## 🎯 Overview

Sistem ini menggunakan:
- **Backend**: Node.js/Express dengan PostgreSQL
- **Frontend**: Next.js 14
- **Database**: PostgreSQL (production) / SQLite (development)
- **WhatsApp Bot**: Baileys v7.0.0+ dengan session persistence
- **Authentication**: JWT dengan secret otomatis

## 🚀 Quick Start

### 1. Automated Setup (Recommended)

```bash
# Jalankan setup otomatis
node scripts/setup-production.js
```

Script ini akan:
- ✅ Install PostgreSQL (jika belum ada)
- ✅ Setup database dan user
- ✅ Generate JWT secret otomatis
- ✅ Create .env dengan konfigurasi lengkap
- ✅ Install semua dependencies
- ✅ Setup database dengan Prisma
- ✅ Start semua services

### 2. Manual Setup

#### A. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
- Download dari: https://www.postgresql.org/download/windows/
- Install dengan default settings

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

#### B. Setup Database
```bash
sudo -u postgres psql
CREATE DATABASE isp_management;
CREATE USER isp_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE isp_management TO isp_user;
\q
```

#### C. Configure Environment
```bash
cp server/env.production.example server/.env
# Edit .env dengan database credentials
```

#### D. Install & Setup
```bash
cd server && npm install
cd ../client && npm install
cd ../server && npx prisma generate
cd ../server && npx prisma migrate deploy
cd ../server && npm run db:seed:prod
```

## 🎮 Production Commands

### Start All Services
```bash
# Start semua services (backend, frontend, WhatsApp bot)
npm run production:all
```

### Individual Services
```bash
# Backend server saja
cd server && npm run start:production

# Frontend client saja
cd client && npm run start

# WhatsApp bot saja
npm run whatsapp:start
```

### WhatsApp Bot Management
```bash
# Manage WhatsApp bot (menu interaktif)
npm run whatsapp:manage
```

## 📱 WhatsApp Bot Features

### Bot Commands
- `/menu` - Tampilkan semua perintah
- `/daftar [nama]` - Daftar sebagai teknisi
- `/jobs` - Lihat pekerjaan tersedia
- `/myjobs` - Lihat pekerjaan yang diambil
- `/ambil [job_id]` - Ambil pekerjaan
- `/mulai [job_id]` - Mulai pekerjaan
- `/selesai [job_id]` - Selesaikan pekerjaan
- `/batal [job_id]` - Batalkan pekerjaan
- `/stats` - Lihat statistik
- `/status` - Status bot
- `/ping` - Test bot

### Interactive Buttons
- `1` - Ambil/Mulai/Selesaikan Job
- `2` - Batal Notifikasi
- `3` - Mulai Job
- `4` - Batal Job

### Bot Features
- ✅ Session persistence (tidak perlu scan QR lagi)
- ✅ Auto-reconnect jika terputus
- ✅ Job management untuk teknisi
- ✅ Notifikasi real-time
- ✅ Admin notifications
- ✅ QR code generation dengan resolusi tinggi
- ✅ Status monitoring

## 🔧 Service Management

### Check Service Status
```bash
# Check semua proses
ps aux | grep -E "(node|npm)"

# Check WhatsApp bot status
cat scripts/whatsapp-status.json

# Check server logs
tail -f server/logs/app.log
```

### Stop Services
```bash
# Stop semua services
pkill -f "npm run start"
pkill -f "whatsapp-bot-integrated"

# Atau gunakan Ctrl+C jika menjalankan npm run production:all
```

### Restart Services
```bash
# Restart semua services
npm run production:all

# Restart WhatsApp bot saja
npm run whatsapp:manage
# Pilih option 3 (Restart Bot)
```

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js web application |
| Backend API | http://localhost:3001 | Express API server |
| Prisma Studio | http://localhost:5555 | Database management |
| QR Code | http://localhost:3001/qr/whatsapp-qr.png | WhatsApp QR code |

## 📁 Directory Structure

```
├── server/                 # Backend API
│   ├── .env               # Environment variables
│   ├── logs/              # Application logs
│   ├── uploads/           # File uploads
│   └── prisma/            # Database schema
├── client/                # Frontend Next.js
├── scripts/               # Utility scripts
│   ├── setup-production.js    # Production setup
│   ├── whatsapp-bot-integrated.js  # WhatsApp bot
│   └── manage-whatsapp.js     # Bot management
├── auth_info_baileys/     # WhatsApp session
├── qr-codes/              # QR code files
└── start-production-all.js # Production startup
```

## 🔐 Security Features

### JWT Authentication
- ✅ Secret otomatis generated (64 karakter)
- ✅ Expiration: 7 hari
- ✅ Secure token validation

### Database Security
- ✅ PostgreSQL dengan user terpisah
- ✅ Password otomatis generated (16 karakter)
- ✅ Connection pooling
- ✅ SSL ready

### WhatsApp Security
- ✅ Session encryption
- ✅ Admin notifications
- ✅ Rate limiting
- ✅ Input validation

## 📊 Monitoring & Logs

### Application Logs
```bash
# Server logs
tail -f server/logs/app.log

# Real-time monitoring
npm run production:all
# Lihat output di terminal
```

### WhatsApp Bot Status
```bash
# Check bot status
cat scripts/whatsapp-status.json

# Monitor bot
npm run whatsapp:manage
# Pilih option 5 (Monitor Logs)
```

### Database Monitoring
```bash
# Prisma Studio
cd server && npm run db:studio

# Database size
psql -U isp_user -d isp_management -c "SELECT pg_size_pretty(pg_database_size('isp_management'));"
```

## 🚨 Troubleshooting

### Common Issues

#### 1. PostgreSQL Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U isp_user -d isp_management -c "SELECT 1;"

# Reset password
sudo -u postgres psql
ALTER USER isp_user WITH PASSWORD 'new_password';
```

#### 2. WhatsApp Bot Not Connecting
```bash
# Check bot status
cat scripts/whatsapp-status.json

# Clean session dan restart
npm run whatsapp:manage
# Pilih option 6 (Clean Session)
# Kemudian option 1 (Start Bot)
```

#### 3. Frontend Build Error
```bash
# Clean build
npm run clean

# Reinstall dependencies
npm run install:all

# Rebuild
npm run build:all
```

#### 4. Port Already in Use
```bash
# Check port usage
netstat -tlnp | grep -E "(3000|3001|5555)"

# Kill process
sudo kill -9 <PID>
```

### Performance Issues

#### 1. Database Slow
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### 2. High Memory Usage
```bash
# Check memory usage
ps aux --sort=-%mem | head

# Restart services
npm run production:all
```

## 🔄 Backup & Recovery

### Database Backup
```bash
# Daily backup
pg_dump -U isp_user -h localhost isp_management > backup_$(date +%Y%m%d).sql

# Restore
psql -U isp_user -d isp_management < backup_20240101.sql
```

### WhatsApp Session Backup
```bash
# Backup session
cp -r auth_info_baileys auth_info_baileys_backup

# Restore session
cp -r auth_info_baileys_backup auth_info_baileys
```

## 📈 Scaling & Production

### Environment Variables
```bash
# Production .env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-64-char-secret
FRONTEND_URL=https://yourdomain.com
```

### Process Management
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

### SSL/HTTPS
```bash
# Add SSL certificates
cp your-cert.crt server/ssl/certificate.crt
cp your-key.key server/ssl/private.key

# Update .env
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt
```

## 📞 Support

### Logs Location
- Server: `server/logs/app.log`
- WhatsApp: `scripts/whatsapp-status.json`
- System: `/var/log/syslog`

### Debug Commands
```bash
# Full system check
npm run setup:production

# Database check
cd server && npx prisma studio

# WhatsApp bot check
npm run whatsapp:manage
```

### Emergency Commands
```bash
# Stop all
pkill -f node

# Reset database
cd server && npx prisma migrate reset

# Clean everything
npm run clean && npm run install:all
```

---

**🎉 Production setup siap! Semua services akan berjalan otomatis dengan PostgreSQL, JWT secrets, dan WhatsApp bot terintegrasi.**
