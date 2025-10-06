# 🚀 UPDATE WORKFLOW GUIDE

Panduan lengkap untuk melakukan update dengan mudah dan cepat.

## 📋 Quick Reference

| Command | Fungsi | Kapan Digunakan |
|---------|--------|-----------------|
| `update-quick.bat "pesan"` | All-in-one update | Update cepat langsung commit & push |
| `update-start.bat` | Mulai session update | Awal kerja, setup environment |
| `update-commit.bat "pesan"` | Commit update | Setelah selesai edit |
| `update-push.bat` | Push ke remote | Setelah commit |
| `update-status.bat` | Cek status | Lihat progress update |

## 🎯 Workflow Standar

### 1️⃣ Update Cepat (Paling Mudah)
Untuk update kecil dan cepat:

```bash
# Edit file yang diperlukan...

# Lalu jalankan:
update-quick.bat "deskripsi update"

# Contoh:
update-quick.bat "perbaiki bug form login"
update-quick.bat "update tampilan dashboard"
update-quick.bat "tambah fitur export PDF"
```

✅ **Otomatis:** Switch branch → Commit → Push

### 2️⃣ Update Normal (Step by Step)

**Mulai Session:**
```bash
update-start.bat
# Otomatis switch ke develop dan sync
```

**Edit Files:**
```
# Kerjakan update Anda...
```

**Commit:**
```bash
update-commit.bat "deskripsi update"
```

**Push:**
```bash
update-push.bat
```

### 3️⃣ Check Status
Kapan saja untuk lihat progress:

```bash
update-status.bat
```

## 🌿 Branch Structure

```
main (production - jangan edit langsung!)
  └── develop (branch kerja utama)
        ├── Semua update dilakukan disini
        ├── Auto sync dengan main
        └── Push ke remote untuk backup
```

## 📝 Auto Type Detection

Script otomatis deteksi tipe commit dari kata kunci:

| Kata Kunci | Tipe | Emoji |
|------------|------|-------|
| fix, perbaiki, bug, error | `fix` | 🐛 |
| tambah, add, new, fitur | `feat` | ✨ |
| update, ubah, ganti | `chore` | 🔧 |
| hapus, delete, remove | `remove` | 🗑️ |
| style, css, ui, design | `style` | 🎨 |
| docs, dokumentasi, readme | `docs` | 📝 |

## 💡 Best Practices

### ✅ DO's:
1. **Selalu kerja di branch `develop`**
   - Otomatis dihandle oleh script
   
2. **Commit sering dengan message jelas**
   ```bash
   update-commit.bat "perbaiki validasi email"
   # Lebih baik dari: update-commit.bat "fix"
   ```

3. **Push regular untuk backup**
   ```bash
   update-push.bat
   # Atau gunakan update-quick.bat
   ```

4. **Check status sebelum mulai kerja baru**
   ```bash
   update-status.bat
   ```

### ❌ DON'T's:
1. **Jangan edit langsung di main branch**
2. **Jangan commit file temporary/log**
3. **Jangan tunggu terlalu lama untuk push**

## 🔄 Sync dengan Main

Develop branch otomatis sync dengan main saat:
- Menjalankan `update-start.bat`
- Pull request di-merge

Manual sync jika perlu:
```bash
git checkout develop
git fetch origin main
git merge origin/main
```

## 📊 Workflow Examples

### Example 1: Fix Bug Cepat
```bash
# 1. Temukan bug di form login
# 2. Edit file yang bermasalah
# 3. Test di local
# 4. Commit dan push:
update-quick.bat "fix validasi form login untuk email kosong"
# Done! ✅
```

### Example 2: Update Fitur Dashboard
```bash
# 1. Start session
update-start.bat

# 2. Edit multiple files untuk dashboard
# - components/Dashboard.jsx
# - styles/dashboard.css
# - lib/dashboard-utils.js

# 3. Test thoroughly

# 4. Commit
update-commit.bat "update dashboard dengan grafik baru dan responsive design"

# 5. Push
update-push.bat
```

### Example 3: Multiple Updates
```bash
# Update 1
# Edit...
update-quick.bat "tambah tombol export di tabel pelanggan"

# Update 2
# Edit...
update-quick.bat "perbaiki bug pagination"

# Update 3
# Edit...
update-quick.bat "update warna tema sesuai brand"
```

## 🚨 Troubleshooting

### Konflik saat merge:
```bash
# Manual resolve
git status
# Edit file yang konflik
git add .
git commit -m "🔀 merge: resolve conflicts"
git push
```

### Lupa di branch mana:
```bash
update-status.bat
# Atau
git branch --show-current
```

### Salah commit message:
```bash
# Untuk commit terakhir saja
git commit --amend -m "🐛 fix: pesan yang benar"
```

### Push ditolak:
```bash
# Pull dulu, baru push
git pull origin develop
git push origin develop
```

## 🎯 Tips Produktivitas

1. **Gunakan `update-quick.bat` untuk 90% kasus**
   - Paling cepat dan praktis

2. **Buat alias di PowerShell (optional):**
   ```powershell
   # Di PowerShell profile
   function uq { .\update-quick.bat $args }
   function us { .\update-status.bat }
   
   # Usage:
   uq "fix bug login"
   us
   ```

3. **Keyboard shortcut di terminal:**
   - `Ctrl+R` untuk search command history
   - Ketik `update` untuk lihat semua command

4. **Commit message template:**
   - Mulai dengan action word: tambah, perbaiki, update, hapus
   - Spesifik: sebutkan komponen/halaman
   - Singkat: maksimal 50 karakter

## 📈 Git History Result

Dengan workflow ini, git history akan terlihat:

```
* 🐛 fix: validasi form login untuk email kosong
* ✨ feat: tambah dashboard monitoring realtime
* 🔧 chore: update dependencies dan config webpack
* 🎨 style: perbaiki responsive design mobile
* 📝 docs: update panduan instalasi database
* 🗑️ remove: hapus file temporary dan logs
```

Clean, rapi, dan mudah di-track! ✨

## 🔗 Integration dengan GitHub

1. **Push dari develop**
2. **Create Pull Request di GitHub**
3. **Review changes**
4. **Merge ke main**
5. **Deploy otomatis (jika di-setup)**

---

📅 **Last Updated:** October 2024  
💡 **Pro Tip:** Bookmark guide ini atau print quick reference!

## 🎉 Happy Updating!

Sekarang update jadi mudah:
```bash
# Just type:
update-quick.bat "your update message"
# Done! 🚀
```
