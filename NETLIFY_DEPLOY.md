# 🚀 Netlify Deploy Rehberi

## Adım 1: Build Test (Lokal)

```bash
# Build alalım bakalım hata var mı
npm run build
```

## Adım 2: Netlify Hesabı

1. https://www.netlify.com adresine gidin
2. **Sign Up** veya **Log In** yapın (GitHub ile giriş öneririm)

## Adım 3: Deploy Yöntemleri

### 🎯 YÖNTEM A: Netlify CLI (Önerilen - Hızlı)

```bash
# Netlify CLI'yi global kurun
npm install -g netlify-cli

# Netlify'a giriş yapın (browser açılacak)
netlify login

# Deploy edin
netlify deploy

# Sorulara cevaplar:
# ? Create & configure a new site: Yes
# ? Team: Kendi team'inizi seçin
# ? Site name: restoran-takip (veya istediğiniz isim)
# ? Publish directory: dist

# Test için deploy
netlify deploy

# Production deploy
netlify deploy --prod
```

### 🎯 YÖNTEM B: GitHub + Netlify (Otomatik Deploy)

#### B1: GitHub Repository Oluşturun

```bash
# Git başlat (eğer başlamadıysanız)
git init
git add .
git commit -m "Initial commit - Restoran Takip Sistemi"

# GitHub'da yeni repo oluşturun sonra:
git remote add origin https://github.com/KULLANICI_ADINIZ/restoran-takip.git
git branch -M main
git push -u origin main
```

#### B2: Netlify'da Site Oluşturun

1. Netlify Dashboard → **Add new site** → **Import an existing project**
2. **GitHub** seçin
3. Repository'nizi seçin
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

5. **Environment variables** ekleyin (ÇOK ÖNEMLİ):
   ```
   VITE_DB_HOST=5.175.136.149
   VITE_DB_PORT=5432
   VITE_DB_NAME=restaurant_tracking
   VITE_DB_USER=restaurant_app
   VITE_DB_PASSWORD=RestaurantDB2024Secure
   VITE_DB_SSL=false
   JWT_SECRET=your-super-secret-jwt-key-change-this
   ```

6. **Deploy site** butonuna tıklayın!

### 🎯 YÖNTEM C: Drag & Drop (En Kolay - Ama Functions Sorunlu Olabilir)

1. `npm run build` ile build alın
2. Netlify Dashboard → **Add new site** → **Deploy manually**
3. `dist` klasörünü sürükle-bırak
4. ⚠️ **NOT**: Bu yöntemde functions çalışmayabilir!

## Adım 4: Environment Variables (ÇOK ÖNEMLİ!)

Netlify Dashboard'da:
1. **Site settings** → **Environment variables**
2. **Add a variable** ile şunları ekleyin:

```
VITE_DB_HOST = 5.175.136.149
VITE_DB_PORT = 5432
VITE_DB_NAME = restaurant_tracking
VITE_DB_USER = restaurant_app
VITE_DB_PASSWORD = RestaurantDB2024Secure
VITE_DB_SSL = false
JWT_SECRET = your-super-secret-jwt-key-change-this-production-ready
NODE_VERSION = 18
```

## Adım 5: Functions Ayarları

Netlify'da Functions otomatik algılanmalı. Kontrol için:
1. **Site settings** → **Functions**
2. **Functions directory**: `netlify/functions` olmalı

## Adım 6: Test Edin!

Deploy sonrası:
```
Siteniz: https://your-site-name.netlify.app

Test URL'leri:
- Admin: https://your-site-name.netlify.app/admin/login
- QR: https://your-site-name.netlify.app/qr/cengelkoy
- Login: https://your-site-name.netlify.app/login
```

## ⚠️ Yaygın Sorunlar

### 1. "Build Failed" Hatası
```bash
# Package.json'da build script'i kontrol edin
# Lokal'de build test edin:
npm run build
```

### 2. Functions Çalışmıyor
- Environment variables eklendi mi?
- Functions directory doğru mu?
- Node version 18 mi?

### 3. Database Bağlantı Hatası
- Netlify environment variables'ı kontrol edin
- Sunucu firewall'da Netlify IP'leri açık mı?
- SSL = false olmalı (domain alana kadar)

## 🎯 Hızlı Komutlar (CLI İçin)

```bash
# İlk deploy
netlify init

# Test deploy
netlify deploy

# Production deploy
netlify deploy --prod

# Site açın
netlify open

# Logları izleyin
netlify logs

# Functions test
netlify functions:list
```

## 📝 Domain Bağlama (İlerisi için)

1. Netlify → **Domain settings**
2. **Add custom domain**
3. DNS kayıtlarını ekleyin
4. SSL otomatik aktif olacak (Let's Encrypt)

---

## 🚨 Deploy Öncesi Checklist

- [ ] `npm run build` başarılı
- [ ] `.env` bilgileri hazır
- [ ] Database bağlantısı test edildi
- [ ] Admin şifresi ayarlandı
- [ ] GitHub repo hazır (Yöntem B için)
- [ ] Netlify hesabı var

---

**Hangi yöntemi tercih edersiniz? Ben CLI yöntemini (A) öneriyorum - en hızlısı!**
