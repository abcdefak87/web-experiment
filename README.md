# 🌐 ISP Management System

Sistem manajemen ISP (Internet Service Provider) terintegrasi dengan WhatsApp Bot untuk otomasi layanan pelanggan.

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Teknologi](#-teknologi)
- [Instalasi](#-instalasi)
- [Git Convention](#-git-convention)
- [Struktur Project](#-struktur-project)
- [Development](#-development)
- [Production](#-production)

## ✨ Fitur

### Customer Management
- Registrasi dan manajemen pelanggan
- Tracking status pelanggan (aktif/nonaktif)
- Riwayat pembayaran
- Dashboard pelanggan

### Billing System
- Generate invoice otomatis
- Multiple payment methods
- Payment tracking
- Laporan keuangan

### WhatsApp Integration
- Bot otomatis untuk customer service
- Notifikasi tagihan via WhatsApp
- Cek status layanan via WhatsApp
- Request support ticket

### Network Monitoring
- Monitoring bandwidth usage
- Status koneksi real-time
- Alert system untuk downtime

## 🛠 Teknologi

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui components

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL/MySQL
- JWT Authentication

### WhatsApp Bot
- @whiskeysockets/baileys
- QR Code authentication
- Session management

## 📦 Instalasi

### Prerequisites
- Node.js 18+ 
- PostgreSQL/MySQL
- Git

### Setup Environment

1. Clone repository:
```bash
git clone [repository-url]
cd web-siap-experiment
```

2. Setup backend:
```bash
cd server
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database Anda
npx prisma migrate dev
npm run seed
```

3. Setup frontend:
```bash
cd ../client
npm install
cp .env.example .env
# Edit .env dengan API URL
```

4. Setup Git Convention:
```bash
# Di root directory
setup-git-convention.bat
```

## 🚀 Quick Update Workflow

### Update Cepat (Recommended)
```bash
# Edit files, lalu:
update-quick.bat "deskripsi update"

# Contoh:
update-quick.bat "perbaiki bug login"
update-quick.bat "tambah fitur export PDF"
```

### Update Commands
| Command | Fungsi |
|---------|--------|
| `update-quick.bat` | All-in-one: commit & push |
| `update-start.bat` | Mulai session update |
| `update-commit.bat` | Commit perubahan |
| `update-push.bat` | Push ke remote |
| `update-status.bat` | Cek status |

📖 Baca [UPDATE-GUIDE.md](./UPDATE-GUIDE.md) untuk panduan lengkap.

## 🔀 Git Convention

Project ini menggunakan conventional commits dengan branch naming yang terstruktur. Visual commit akan tampil menarik di GitHub dengan emoji dan format yang konsisten.

### 🌿 Branch Naming

| Prefix | Penggunaan | Contoh |
|--------|------------|--------|
| `feature/` | Fitur baru | `feature/dashboard-pelanggan` |
| `bugfix/` | Perbaikan bug | `bugfix/validasi-form` |
| `hotfix/` | Fix urgent production | `hotfix/crash-login` |
| `release/` | Release version | `release/v1.2.0` |

### 📝 Commit Format

Format: `<emoji> <type>: <deskripsi>`

| Emoji | Type | Penggunaan |
|-------|------|------------|
| ✨ | feat | Fitur baru |
| 🐛 | fix | Perbaikan bug |
| 📝 | docs | Update dokumentasi |
| 🎨 | style | Format kode |
| ♻️ | refactor | Refaktor kode |
| ⚡ | perf | Peningkatan performa |
| 🔥 | hotfix | Hotfix critical |

### 🛠️ Helper Commands

**Membuat branch baru:**
```bash
git-branch.bat feature dashboard-baru
```

**Membuat commit:**
```bash
git-commit.bat feat "tambah halaman dashboard"
```

**Lihat panduan lengkap:**
```bash
node scripts\git-helper.js help
```

📖 Baca [GIT_CONVENTION.md](./GIT_CONVENTION.md) untuk panduan lengkap.

## 📁 Struktur Project

```
web-siap-experiment/
├── client/                 # Frontend Next.js
│   ├── components/        # React components
│   ├── pages/            # Page routes
│   ├── lib/              # Utility functions
│   └── styles/           # CSS styles
│
├── server/                # Backend Express
│   ├── routes/           # API endpoints
│   ├── middleware/       # Express middleware
│   ├── prisma/          # Database schema
│   └── services/        # Business logic
│
├── scripts/              # Utility scripts
│   ├── whatsapp-bot-integrated.js  # WhatsApp bot
│   ├── git-helper.js              # Git helper
│   └── rebuild-frontend.bat      # Build script
│
└── auth_info_baileys/    # WhatsApp session
```

## 🚀 Development

### Start Development Server

**Windows:**
```bash
start-dev.bat
```

Atau manual:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- WhatsApp Bot: Running in background

## 📦 Production

### Build & Deploy

**Windows:**
```bash
start-production.bat
```

### Environment Production

Pastikan environment variables production sudah di-set:
- Database production
- JWT secrets
- API keys
- WhatsApp credentials

## 🐛 Troubleshooting

### WhatsApp Bot Issues
1. Hapus folder `auth_info_baileys` untuk reset session
2. Scan ulang QR code
3. Pastikan nomor WhatsApp aktif

### Database Issues
```bash
# Reset database
cd server
npx prisma migrate reset

# Update schema
npx prisma migrate dev
```

### Build Issues
```bash
# Rebuild frontend
scripts\rebuild-frontend.bat

# Clear cache
npm cache clean --force
```

## 📊 Git Workflow Example

### 1. Mulai fitur baru:
```bash
# Create branch
git-branch.bat feature payment-gateway

# Work on feature...

# Commit changes
git-commit.bat feat "integrasi payment gateway midtrans"

# Push to remote
git push -u origin feature/payment-gateway
```

### 2. Fix bug:
```bash
# Create bugfix branch
git-branch.bat bugfix form-validation

# Fix the bug...

# Commit
git-commit.bat fix "validasi email format di form registrasi"

# Push
git push
```

### 3. Hotfix production:
```bash
# Switch to main
git checkout main
git pull

# Create hotfix
git-branch.bat hotfix payment-crash

# Fix critical issue...

# Commit
git-commit.bat hotfix "perbaiki crash saat proses payment"

# Push and create PR to main
git push
```

## 🤝 Contributing

1. Fork repository
2. Buat branch fitur (`git-branch.bat feature amazing-feature`)
3. Commit perubahan (`git-commit.bat feat "tambah fitur amazing"`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

ISP Management System - All Rights Reserved

## 📞 Support

Untuk bantuan dan pertanyaan:
- 📧 Email: support@isp-system.com
- 💬 WhatsApp: +62xxx
- 📖 Docs: [Documentation](./docs)

---

⭐ **Happy Coding!** Jangan lupa follow git convention untuk commit yang rapi dan visual menarik di GitHub!
