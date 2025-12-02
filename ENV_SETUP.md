# ⚠️ ÖNEMLİ: .env DOSYASI KURULUMU

## 🔧 Hemen Yapmanız Gerekenler:

### 1. `.env` Dosyası Oluşturun
Proje klasöründe `.env` adında bir dosya oluşturun ve aşağıdaki içeriği yapıştırın:

```env
# PostgreSQL Veritabanı
VITE_DB_HOST=5.175.136.149
VITE_DB_PORT=5432
VITE_DB_NAME=restaurant_tracking
VITE_DB_USER=restaurant_app
VITE_DB_PASSWORD=RestaurantDB2024Secure
VITE_DB_SSL=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this

# App Configuration
VITE_APP_NAME=Restoran Personel Takip
VITE_QR_REFRESH_INTERVAL=90000

# API URLs (Development)
VITE_API_URL=http://localhost:8888/.netlify/functions
VITE_APP_URL=http://localhost:3000
```

### 2. Alternatif Yöntem
`.env.ready` dosyasını `.env` olarak kopyalayabilirsiniz:
```bash
# Windows Command Prompt:
copy .env.ready .env

# PowerShell veya Git Bash:
cp .env.ready .env
```

## ✅ Sistem Durumu:

- **Veritabanı**: ✅ Bağlantı başarılı
- **Tablolar**: ✅ 10 tablo oluşturuldu
- **Admin**: ✅ admin@restaurant.com / admin123
- **Personeller**: ✅ P001-P004 / 123456
- **Lokasyonlar**: ✅ Çengelköy, Kadıköy, Beşiktaş

## 🚀 Uygulamayı Çalıştırma:

```bash
# Development modda çalıştır
npm run dev

# Netlify functions ile çalıştır (önerilen)
npm run netlify
```

## 🌐 Erişim Adresleri:

- **QR Ekranı**: http://localhost:3000/qr/cengelkoy
- **Admin Paneli**: http://localhost:3000/admin/login
- **Personel Girişi**: http://localhost:3000/login

## ⚠️ Güvenlik Notları:

1. `.env` dosyası asla Git'e commit edilmemeli (zaten .gitignore'da)
2. Production'da JWT_SECRET'ı değiştirin
3. Domain aldıktan sonra SSL'i aktifleştirin

---

**NOT**: `.env` dosyası olmadan uygulama çalışmaz!
