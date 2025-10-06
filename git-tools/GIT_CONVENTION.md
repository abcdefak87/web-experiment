# 📋 Konvensi Git - ISP Management System

## 🌿 Branch Naming Convention

### Format Branch
```
<tipe>/<deskripsi-singkat>
```

### Tipe Branch

| Prefix | Penggunaan | Contoh |
|--------|------------|--------|
| `feature/` | Fitur baru | `feature/dashboard-pelanggan` |
| `bugfix/` | Perbaikan bug di development | `bugfix/validasi-form` |
| `hotfix/` | Perbaikan urgent di production | `hotfix/crash-login` |
| `release/` | Branch untuk release | `release/v1.2.0` |
| `chore/` | Maintenance, update deps | `chore/update-dependencies` |
| `docs/` | Update dokumentasi | `docs/panduan-instalasi` |
| `test/` | Testing & QA | `test/unit-test-auth` |
| `refactor/` | Refaktor kode | `refactor/struktur-database` |

## 📝 Commit Message Convention

### Format Commit
```
<emoji> <tipe>: <deskripsi singkat>

[body opsional]

[footer opsional]
```

### Tipe Commit dengan Emoji

| Emoji | Tipe | Penggunaan |
|-------|------|------------|
| ✨ | `feat` | Fitur baru |
| 🐛 | `fix` | Perbaikan bug |
| 📝 | `docs` | Update dokumentasi |
| 🎨 | `style` | Format kode (tanpa perubahan logic) |
| ♻️ | `refactor` | Refaktor kode |
| ⚡ | `perf` | Peningkatan performa |
| ✅ | `test` | Menambah/update test |
| 🔧 | `chore` | Maintenance, config, tools |
| 🚀 | `deploy` | Deploy ke production |
| 🔀 | `merge` | Merge branch |
| ⏪ | `revert` | Revert commit sebelumnya |
| 🚧 | `wip` | Work in progress |
| 🔐 | `security` | Perbaikan keamanan |
| 🗑️ | `remove` | Hapus file/kode |
| 📦 | `deps` | Update dependencies |
| 🐳 | `docker` | Perubahan Docker |
| 🔥 | `hotfix` | Hotfix critical |
| 💄 | `ui` | Update UI/UX |
| 🌐 | `i18n` | Internationalization |
| 📱 | `responsive` | Responsive design |
| ♿ | `a11y` | Accessibility |
| 🔊 | `log` | Add/update logging |
| 🏗️ | `arch` | Perubahan arsitektur |

### Contoh Commit Messages

**Fitur Baru:**
```
✨ feat: tambah halaman dashboard pelanggan

- Menampilkan statistik tagihan
- Grafik penggunaan bandwidth
- Riwayat pembayaran
```

**Perbaikan Bug:**
```
🐛 fix: perbaiki validasi form registrasi customer

Form tidak bisa submit jika nomor HP kurang dari 10 digit
```

**Update Dependencies:**
```
📦 deps: update Next.js ke versi 14.0.0

Breaking changes:
- Update import statements
- Migrasi ke App Router
```

**Hotfix Production:**
```
🔥 hotfix: perbaiki crash saat login dengan email kosong

Critical bug yang menyebabkan server crash
```

## 🔄 Workflow Git

### 1. Membuat Feature Baru
```bash
# Buat branch dari develop
git checkout develop
git pull origin develop
git checkout -b feature/nama-fitur

# Kerjakan fitur
# Commit dengan format yang benar
git add .
git commit -m "✨ feat: deskripsi fitur"

# Push ke remote
git push origin feature/nama-fitur
```

### 2. Fixing Bug
```bash
# Buat branch bugfix dari develop
git checkout develop
git pull origin develop
git checkout -b bugfix/nama-bug

# Perbaiki bug
git add .
git commit -m "🐛 fix: deskripsi perbaikan"

# Push ke remote
git push origin bugfix/nama-bug
```

### 3. Hotfix Production
```bash
# Buat branch dari main/master
git checkout main
git pull origin main
git checkout -b hotfix/nama-hotfix

# Perbaiki issue
git add .
git commit -m "🔥 hotfix: deskripsi hotfix"

# Push dan merge ke main & develop
git push origin hotfix/nama-hotfix
```

## 📊 Pull Request Template

### Title Format
```
[TIPE] Deskripsi singkat
```

Contoh:
- `[FEATURE] Dashboard monitoring pelanggan`
- `[BUGFIX] Perbaikan validasi form`
- `[HOTFIX] Critical bug login`

### PR Description Template
```markdown
## 📋 Deskripsi
Jelaskan perubahan yang dilakukan

## 🎯 Tujuan
- [ ] Tujuan 1
- [ ] Tujuan 2

## 📸 Screenshot (jika ada UI changes)
[Upload screenshot disini]

## ✅ Checklist
- [ ] Code sudah di-test local
- [ ] Tidak ada console.log yang tidak perlu
- [ ] Update dokumentasi (jika perlu)
- [ ] Sudah test di browser berbeda
- [ ] Mobile responsive (jika UI)

## 🔗 Related Issue
Closes #123
```

## 🎨 Cara Setup Git Message Template

### Global (untuk semua project):
```bash
git config --global commit.template .gitmessage
```

### Local (hanya project ini):
```bash
git config commit.template .gitmessage
```

## 🚀 Best Practices

1. **Satu commit untuk satu perubahan** - Jangan gabungkan banyak perubahan dalam satu commit
2. **Commit message yang jelas** - Orang lain harus paham tanpa melihat kode
3. **Gunakan present tense** - "tambah fitur" bukan "menambahkan fitur"
4. **Maksimal 50 karakter untuk subject line**
5. **Body commit jelaskan "apa" dan "kenapa", bukan "bagaimana"**
6. **Reference issue/ticket jika ada** - contoh: `Refs #123`
7. **Squash commits sebelum merge** untuk menjaga history tetap clean

## 🏷️ Git Tags untuk Release

### Format Version
```
v<major>.<minor>.<patch>
```

Contoh:
- `v1.0.0` - Release pertama
- `v1.1.0` - Tambah fitur baru
- `v1.0.1` - Bug fixes

### Membuat Tag
```bash
# Tag dengan message
git tag -a v1.0.0 -m "🚀 Release versi 1.0.0: Initial release"

# Push tag
git push origin v1.0.0

# Push semua tags
git push origin --tags
```

## 📈 Git Flow Branches

```
main (production)
    ↑
    ├── hotfix/xxx ←────────────┐
    ↓                           │
develop (staging)               │
    ↑                           │
    ├── feature/xxx             │
    ├── bugfix/xxx              │
    └── release/xxx ────────────┘
```

---

✍️ **Maintained by:** ISP Management System Team  
📅 **Last Updated:** October 2024
