# ISP Management System

Sistem manajemen ISP (Internet Service Provider) yang komprehensif dengan integrasi WhatsApp bot untuk komunikasi real-time dengan pelanggan dan teknisi.

## 🚀 Fitur Utama

- **Dashboard Real-time** - Monitoring pekerjaan, teknisi, dan pelanggan
- **Manajemen Pekerjaan** - PSB (Pasang Baru) dan Gangguan
- **Sistem Teknisi** - Assignment dan tracking pekerjaan
- **WhatsApp Bot** - Komunikasi otomatis dengan pelanggan
- **Manajemen User** - Role-based access control
- **Inventory Management** - Manajemen stok peralatan
- **Reporting** - Laporan dan analytics
- **Mobile Responsive** - Optimized untuk mobile dan desktop

## 🏗️ Arsitektur

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Real-time**: Socket.IO + WebSocket
- **WhatsApp**: Baileys WhatsApp Web API
- **Authentication**: JWT + Role-based permissions

## 📋 Prasyarat

- Node.js 18+ 
- npm atau yarn
- Git

## 🛠️ Setup Development

### 1. Clone Repository

```bash
git clone https://github.com/abcdefak87/tahapdev.git
cd tahapdev
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Setup Environment Variables

```bash
# Copy environment examples
cp client/env.example client/.env.local
cp server/env.example server/.env

# Edit the .env files with your configuration
```

### 4. Setup Database

```bash
cd server
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Start Development Servers

```bash
# From root directory
npm run dev

# Or start individually:
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client  
cd client && npm run dev

# Terminal 3 - WhatsApp Bot
node scripts/whatsapp-bot-integrated.js
```

## 🚀 Setup Production

### 1. Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/isp_management"
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://yourdomain.com
```

### 2. Database Setup

```bash
# For PostgreSQL production
cd server
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 3. Build Application

```bash
# Build client
cd client
npm run build

# Build server (if needed)
cd ../server
npm run build
```

### 4. Start Production

```bash
# Using PM2 (recommended)
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# Or using the start script
node start-all.js prod
```

### 5. Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 📱 WhatsApp Bot Setup

### 1. First Time Setup

1. Start the application
2. Open `http://localhost:3001/qr/whatsapp-qr.png`
3. Scan QR code with WhatsApp
4. Bot will be connected automatically

### 2. Bot Commands

- `/jobs` - Lihat pekerjaan tersedia
- `/myjobs` - Lihat pekerjaan yang diambil
- `/ambil <job_id>` - Ambil pekerjaan
- `/mulai <job_id>` - Mulai pekerjaan
- `/selesai <job_id>` - Selesaikan pekerjaan
- `/stats` - Lihat statistik

## 👥 User Roles

- **Super Admin** - Full access
- **Admin** - Management access
- **Gudang** - Inventory management
- **Teknisi** - Job assignment and completion

## 🔧 Development Commands

```bash
# Database
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
npm run db:studio     # Open Prisma Studio

# Development
npm run dev           # Start all services
npm run build         # Build for production
npm run start         # Start production

# Utilities
npm run clean         # Clean build files
npm run test          # Run tests
npm run lint          # Run linter
```

## 📁 Struktur Project

```
├── client/                 # Next.js Frontend
│   ├── components/         # React Components
│   ├── pages/             # Next.js Pages
│   ├── lib/               # Utilities
│   └── styles/            # CSS Styles
├── server/                # Express Backend
│   ├── routes/            # API Routes
│   ├── middleware/        # Express Middleware
│   ├── services/          # Business Logic
│   ├── prisma/            # Database Schema
│   └── utils/             # Utilities
├── scripts/               # Utility Scripts
└── docs/                  # Documentation
```

## 🔒 Security

- JWT Authentication
- Role-based Access Control
- Rate Limiting
- Input Validation
- SQL Injection Protection (Prisma)
- CORS Configuration
- Environment Variables Protection

## 📊 Monitoring

- Application logs in `server/logs/`
- WhatsApp bot status monitoring
- Database query logging
- Error tracking and reporting

## 🐛 Troubleshooting

### Common Issues

1. **WhatsApp Bot Not Connecting**
   - Check QR code at `/qr/whatsapp-qr.png`
   - Restart WhatsApp bot service
   - Clear session files if needed

2. **Database Connection Issues**
   - Check DATABASE_URL in .env
   - Run `npx prisma generate`
   - Check database permissions

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version (18+)
   - Run `npm run clean` before build

### Logs Location

- Server logs: `server/logs/`
- WhatsApp bot logs: Console output
- Client logs: Browser console

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: [Your Contact Information]

## 🔄 Updates

- **v1.0.0** - Initial release
- **v1.1.0** - WhatsApp bot integration
- **v1.2.0** - Mobile optimization
- **v1.3.0** - Role-based access control

---

**Note**: Pastikan untuk tidak mengupload file sensitif seperti session WhatsApp, database, atau environment variables ke repository.