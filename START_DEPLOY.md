# 🚀 ŞİMDİ DEPLOY EDELİM!

## ✅ Hazırlık Tamam!
Build başarılı! Sistem deploy'a hazır.

## 🎯 EN HIZLI YÖNTEM (Önerilen):

### Adım 1: Netlify CLI Kurun
```bash
npm install -g netlify-cli
```

### Adım 2: Netlify'a Giriş
```bash
netlify login
```
(Browser açılacak, giriş yapın)

### Adım 3: İlk Deploy
```bash
netlify deploy
```

Sorular:
- **Create & configure a new site?** → Yes
- **Team:** → Kendi team'inizi seçin
- **Site name:** → `restoran-takip` (veya istediğiniz isim)
- **Publish directory:** → `dist`

### Adım 4: Test Edin
Site URL'i verecek, test edin.

### Adım 5: Production'a Alın
```bash
netlify deploy --prod
```

### Adım 6: Environment Variables Ekleyin

Netlify Dashboard'da (site.netlify.app):
1. **Site settings** → **Environment variables**
2. Şunları ekleyin:

```
VITE_DB_HOST = 5.175.136.149
VITE_DB_PORT = 5432
VITE_DB_NAME = restaurant_tracking
VITE_DB_USER = restaurant_app
VITE_DB_PASSWORD = RestaurantDB2024Secure
VITE_DB_SSL = false
JWT_SECRET = super-secret-production-jwt-key-32-chars-min
NODE_VERSION = 18
```

3. **Save** → **Trigger deploy** (yeniden deploy)

## 🎉 HAZIR!

Site URL'iniz:
- **Ana Site**: https://your-site.netlify.app
- **Admin**: https://your-site.netlify.app/admin/login
- **QR Ekran**: https://your-site.netlify.app/qr/cengelkoy

---

## 🔄 ALTERNATIF: GitHub Üzerinden Deploy

Eğer GitHub kullanmak isterseniz:

### 1. GitHub'a Push
```bash
git init
git add .
git commit -m "Restoran Takip Sistemi"
git branch -M main

# GitHub'da yeni repo oluşturun, sonra:
git remote add origin https://github.com/USERNAME/repo-name.git
git push -u origin main
```

### 2. Netlify'da Import
1. https://app.netlify.com → **Add new site**
2. **Import an existing project** → **GitHub**
3. Repository seçin
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Environment variables ekleyin (yukarıdaki gibi)
6. **Deploy**!

---

## 📞 Size Gereken Bilgiler:

Hazırsanız şu komutları çalıştırın:

```bash
# 1. CLI kurun (eğer yoksa)
npm install -g netlify-cli

# 2. Giriş yapın
netlify login

# 3. Deploy edin
netlify deploy
```

**Sorun olursa bana söyleyin, birlikte çözeriz!** 🚀
