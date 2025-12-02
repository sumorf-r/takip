# 🍴 Restoran Personel Takip Sistemi

Modern, QR kod tabanlı personel giriş/çıkış takip ve puantaj sistemi.

## ✨ Özellikler

### 📱 QR Kod Sistemi
- **Otomatik Yenilenen QR Kodlar**: 90 saniyede bir güvenlik için yenilenir
- **Tablet Ekranı**: Restoran girişinde duvar tabletinde gösterilir
- **Hızlı Okutma**: Personel telefonu ile QR okutarak giriş/çıkış yapar

### 👥 Personel İşlemleri
- QR kod ile hızlı giriş/çıkış
- Manuel giriş seçeneği
- Kişisel çalışma saatleri takibi
- Anlık durum görüntüleme

### 🏢 Admin Paneli
- **Dashboard**: Genel bakış ve istatistikler
- **Personel Yönetimi**: Personel ekleme, düzenleme, silme
- **Lokasyon Yönetimi**: Çoklu şube desteği
- **Raporlama**: Detaylı puantaj raporları
- **Ayarlar**: Sistem konfigürasyonu

### 🔒 Güvenlik
- JWT tabanlı kimlik doğrulama
- Rol bazlı yetkilendirme (Admin/Personel)
- Güvenli QR kod algoritması

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Netlify CLI (opsiyonel)

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Environment değişkenlerini ayarlayın:**
```bash
cp .env.example .env
# .env dosyasını düzenleyin ve gerekli bilgileri girin
```

3. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

4. **Netlify Functions ile çalıştırma (önerilen):**
```bash
npm run netlify
```

## 🔑 Demo Giriş Bilgileri

### Admin Paneli
- **URL**: `/admin/login`
- **E-posta**: `admin@restaurant.com`
- **Şifre**: `admin123`

### Personel Girişi
- **URL**: `/login`
- **Personel No**: `1`, `2`, `3`, veya `4`
- **Şifre**: `123456`

### QR Ekranı
- **URL**: `/qr/cengelkoy` (veya başka lokasyon ID'si)

## 📱 Kullanım Senaryoları

### Tablet (QR Ekranı)
1. Tablet'i `/qr/cengelkoy` adresine yönlendirin
2. QR kod otomatik olarak 90 saniyede bir yenilenecek
3. Ekran sürekli açık kalabilir

### Personel Telefonu
1. `/login` adresine gidin
2. "QR Kod Okut" butonuna tıklayın
3. Tablet ekranındaki QR'ı okutun
4. Otomatik giriş/çıkış kaydedilir

### Admin Yönetimi
1. `/admin/login` ile giriş yapın
2. Dashboard'dan tüm işlemleri takip edin
3. Raporları görüntüleyin ve indirin

## 🏗️ Teknik Mimari

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Hızlı build tool
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animasyonlar
- **React Router** - Routing
- **Zustand** - State management
- **React Query** - Data fetching

### Backend (Serverless)
- **Netlify Functions** - Serverless API
- **JWT** - Authentication
- **Supabase** (Opsiyonel) - Database

### Deployment
- **Netlify** - Hosting & Functions

## 📂 Proje Yapısı

```
restoran-personel-takip/
├── src/
│   ├── pages/          # Sayfa componentleri
│   ├── components/      # Yeniden kullanılabilir componentler
│   ├── stores/          # Zustand state stores
│   ├── utils/           # Yardımcı fonksiyonlar
│   └── App.jsx          # Ana uygulama
├── netlify/
│   └── functions/       # Serverless API endpoints
├── public/              # Statik dosyalar
└── package.json         # Proje bağımlılıkları
```

## 🌐 Netlify'a Deploy

1. GitHub'a push edin
2. Netlify'da yeni site oluşturun
3. Repository'yi bağlayın
4. Environment variables ekleyin
5. Deploy edin!

### Manuel Deploy
```bash
# Build
npm run build

# Netlify CLI ile deploy
netlify deploy --prod
```

## 📊 API Endpoints

- `POST /api/auth-login` - Giriş
- `GET /api/auth-verify` - Token doğrulama
- `POST /api/attendance-check` - Giriş/Çıkış kayıt
- `POST /api/attendance-quick-check` - QR ile hızlı kayıt
- `GET /api/attendance-list` - Kayıt listesi
- `POST /api/personnel-login` - Personel girişi

## 🛠️ Geliştirme

### Veritabanı Entegrasyonu
Şu anda mock data kullanılıyor. Gerçek veritabanı için:
1. Supabase veya Firebase hesabı oluşturun
2. Environment variables'ları ayarlayın
3. `netlify/functions/` içindeki API'leri güncelleyin

### Yeni Lokasyon Ekleme
1. Admin panelden lokasyon ekleyin
2. QR URL: `/qr/{locationId}`

## 📝 Lisans

MIT

## 👨‍💻 Geliştirici

Dünyaca ünlü bir fullstack developer tarafından geliştirilmiştir! 🚀

---

**Not**: Bu demo versiyondur. Production kullanımı için gerçek veritabanı entegrasyonu ve güvenlik güncellemeleri yapılmalıdır.
