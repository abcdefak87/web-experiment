# ISP Management System

Sistem manajemen ISP (Internet Service Provider) dengan integrasi WhatsApp bot.

## 🚀 Fitur Utama

- **Dashboard Real-time** - Monitoring pekerjaan, teknisi, dan pelanggan
- **Manajemen Pekerjaan** - PSB (Pasang Baru) dan Gangguan  
- **WhatsApp Bot** - Komunikasi otomatis dengan pelanggan
- **Role-based Access** - Multi-level user management
- **Inventory** - Manajemen stok peralatan

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: SQLite / PostgreSQL
- **WhatsApp**: Baileys WhatsApp Web API
- **Auth**: JWT + Session management

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
git-tools\setup-git-convention.bat
```

## 🚀 Quick Update Workflow

### Update Cepat (Recommended)
```bash
# Edit files, lalu:
update quick "deskripsi update"

# Contoh:
update quick "perbaiki bug login"
update quick "tambah fitur export PDF"
```

**⚡ Auto-Merge:** Setiap update di `develop` akan otomatis di-merge ke `main`!

### Update Commands
| Command | Fungsi |
|---------|--------|
| `update quick` | All-in-one: commit, push & auto-merge |
| `update start` | Mulai session update |
| `update commit` | Commit perubahan |
| `update push` | Push ke remote & auto-merge |
| `update sync` | Manual sync develop -> main |
| `update status` | Cek status |

📖 Baca [UPDATE-GUIDE.md](./git-tools/UPDATE-GUIDE.md) untuk panduan lengkap.

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
git-tools\git-branch.bat feature dashboard-baru
```

**Membuat commit:**
```bash
git-tools\git-commit.bat feat "tambah halaman dashboard"
```

**Lihat panduan lengkap:**
```bash
node git-tools\git-helper.js help
```

📖 Baca [GIT_CONVENTION.md](./git-tools/GIT_CONVENTION.md) untuk panduan lengkap.

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
├── scripts/              # System scripts
│   └── whatsapp-bot-integrated.js  # WhatsApp bot
│
├── git-tools/           # Git workflow tools  
│   ├── update-*.bat    # Update commands
│   ├── git-*.bat       # Git helpers
│   └── git-helper.js   # Core helper
│
└── auth_info_baileys/   # WhatsApp session
```

## 🚀 Development

### Start Development Server

**Manual start:**

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

**Build production:**
```bash
cd client && npm run build
cd ../server && npm run build
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
### Build Issues
```bash
# Clear cache
npm cache clean --force
```

## 📊 Git Workflow Example
### 1. Mulai fitur baru:
```bash
# Create branch
git-tools\git-branch.bat feature payment-gateway

# Work on feature...

# Commit changes
git-tools\git-commit.bat feat "integrasi payment gateway midtrans"

# Push to remote
git push -u origin feature/payment-gateway
```

### 2. Fix bug:
```bash
# Create bugfix branch
git-tools\git-branch.bat bugfix form-validation

# Fix the bug...

# Commit
git-tools\git-commit.bat fix "validasi email format di form registrasi"

# Push
git push
```

### 3. Hotfix production:
```bash
# Switch to main
git checkout main
git pull

# Create hotfix
git-tools\git-branch.bat hotfix payment-crash

# Fix critical issue...

# Commit
git-tools\git-commit.bat hotfix "perbaiki crash saat proses payment"

# Push and create PR to main
git push
```

## 🤝 Contributing

1. Fork repository
2. Buat branch fitur (`git-tools\git-branch.bat feature amazing-feature`)
3. Commit perubahan (`git-tools\git-commit.bat feat "tambah fitur amazing"`)
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
