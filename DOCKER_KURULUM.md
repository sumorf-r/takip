# 🐳 Docker ile Lokal Kurulum Rehberi

Bu kılavuz, projeyi Docker kullanarak lokalinizde nasıl çalıştıracağınızı adım adım göstermektedir.

## 📋 Gereksinimler

- Docker Desktop (Windows/Mac) veya Docker Engine (Linux)
- Docker Compose (Docker Desktop ile birlikte gelir)
- En az 4GB RAM

## 🚀 Hızlı Başlangıç

### 1. Docker Desktop'ın Çalıştığından Emin Olun

Windows'ta Docker Desktop'ı başlatın ve çalıştığından emin olun.

### 2. Projeyi Başlatın

Proje dizininde PowerShell veya Terminal açın:

```powershell
# Tüm servisleri başlat (arka planda)
docker-compose up -d

# Logları görmek için (opsiyonel)
docker-compose logs -f
```

### 3. Servislerin Çalıştığını Kontrol Edin

```powershell
docker-compose ps
```

Şu servisler çalışıyor olmalı:
- ✅ `takip-postgres` - PostgreSQL veritabanı (Port: 5432)
- ✅ `takip-app` - Frontend & Backend (Port: 3000, 8888)

### 4. Uygulamaya Erişin

- **Frontend**: http://localhost:3000
- **API Endpoints**: http://localhost:8888/.netlify/functions/

## 🔐 Giriş Bilgileri

### Admin Girişi
- Email: `admin@restaurant.com`
- Şifre: `admin123`

### Personel Girişi
Örnek personeller (Tüm şifreler: `123456`):
- P001 - Ahmet Yılmaz
- P002 - Ayşe Demir
- P003 - Mehmet Kaya
- P004 - Fatma Öz

## 📂 Docker Yapısı

```
takip/
├── docker-compose.yml       # Ana Docker orchestration dosyası
├── Dockerfile              # Uygulama container'ı
├── .env.local              # Lokal environment variables
└── database/
    └── init/               # PostgreSQL init scriptleri
        ├── 01-schema.sql
        ├── 02-initial-data.sql
        └── 03-mesai-hesaplama.sql
```

## 🛠️ Yararlı Komutlar

### Container'ları Yönetme

```powershell
# Servisleri başlat
docker-compose up -d

# Servisleri durdur
docker-compose stop

# Servisleri durdur ve sil
docker-compose down

# Servisleri ve veritabanını tamamen sil (TEHLİKELİ!)
docker-compose down -v

# Servisleri yeniden başlat
docker-compose restart

# Belirli bir servisi yeniden başlat
docker-compose restart app
docker-compose restart postgres
```

### Logları İzleme

```powershell
# Tüm servislerin loglarını göster
docker-compose logs -f

# Sadece app loglarını göster
docker-compose logs -f app

# Sadece postgres loglarını göster
docker-compose logs -f postgres
```

### Veritabanı İşlemleri

```powershell
# PostgreSQL container'ına bağlan
docker exec -it takip-postgres psql -U restaurant_app -d restaurant_tracking

# SQL komutları çalıştır
docker exec -it takip-postgres psql -U restaurant_app -d restaurant_tracking -c "SELECT * FROM personnel;"

# Veritabanı backup al
docker exec takip-postgres pg_dump -U restaurant_app restaurant_tracking > backup.sql

# Backup'tan geri yükle
docker exec -i takip-postgres psql -U restaurant_app restaurant_tracking < backup.sql
```

## 🔧 Yapılandırma

### Environment Variables

`.env.local` dosyasını düzenleyerek ayarları değiştirebilirsiniz:

```env
# Database
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=restaurant_tracking
VITE_DB_USER=restaurant_app
VITE_DB_PASSWORD=RestaurantDB2024Local
VITE_DB_SSL=false

# JWT
JWT_SECRET=local-development-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# API
VITE_API_URL=http://localhost:8888/.netlify/functions
VITE_APP_URL=http://localhost:3000
```

### Port Değiştirme

`docker-compose.yml` dosyasında portları değiştirebilirsiniz:

```yaml
services:
  postgres:
    ports:
      - "5432:5432"  # Sol taraf HOST portu, sağ taraf CONTAINER portu
  
  app:
    ports:
      - "3000:3000"
      - "8888:8888"
```

## 🐛 Sorun Giderme

### Container başlatılamıyor

```powershell
# Container'ları temizle
docker-compose down
docker system prune -f

# Yeniden başlat
docker-compose up -d
```

### Port zaten kullanımda hatası

Port 5432, 3000 veya 8888 başka bir uygulama tarafından kullanılıyorsa:

1. `docker-compose.yml` dosyasında portları değiştirin
2. `.env.local` dosyasını güncelleyin
3. Servisleri yeniden başlatın

### Veritabanına bağlanılamıyor

```powershell
# PostgreSQL container'ının çalıştığını kontrol edin
docker-compose ps

# PostgreSQL loglarını kontrol edin
docker-compose logs postgres

# Container'ı yeniden başlatın
docker-compose restart postgres
```

### Frontend görünmüyor

```powershell
# App loglarını kontrol edin
docker-compose logs app

# Node modules'ü yeniden yükle
docker-compose exec app npm install

# Container'ı yeniden başlatın
docker-compose restart app
```

### Veritabanı sıfırlama

```powershell
# UYARI: Tüm veriler silinecek!
docker-compose down -v
docker-compose up -d
```

## 📊 Veritabanı Yönetimi

### pgAdmin ile Bağlanma (Opsiyonel)

pgAdmin kullanmak isterseniz:

```powershell
docker run -d `
  --name pgadmin `
  -p 5050:80 `
  -e "PGADMIN_DEFAULT_EMAIL=admin@admin.com" `
  -e "PGADMIN_DEFAULT_PASSWORD=admin" `
  --network takip_takip-network `
  dpage/pgadmin4
```

Ardından http://localhost:5050 adresinden erişebilirsiniz.

Bağlantı bilgileri:
- Host: `postgres` (container name)
- Port: `5432`
- Database: `restaurant_tracking`
- Username: `restaurant_app`
- Password: `RestaurantDB2024Local`

## 🎯 Geliştirme Modu

Kod değişiklikleriniz otomatik olarak yansıyacaktır (hot reload aktif).

```powershell
# Development loglarını izleyin
docker-compose logs -f app
```

## 🔒 Güvenlik Notları

- `.env.local` dosyası Git'e eklenmiştir ancak production değerleri içermez
- Production'da mutlaka güçlü şifreler kullanın
- `JWT_SECRET` değerini production'da değiştirin
- SSL sertifikası production'da aktif edilmelidir

## 📦 Production'a Geçiş

Production ortamına geçmek için:

1. `.env.production` dosyasını düzenleyin
2. SSL sertifikalarını yapılandırın
3. Güçlü şifreler kullanın
4. `docker-compose.production.yml` oluşturun

## 💡 İpuçları

- Container'ları her zaman `docker-compose down` ile düzgün kapatın
- Düzenli olarak backup alın
- Logları takip edin
- Disk alanını kontrol edin (`docker system df`)
- Kullanılmayan image'leri temizleyin (`docker image prune`)

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin: `docker-compose logs`
2. Container durumunu kontrol edin: `docker-compose ps`
3. Docker Desktop'ın güncel olduğundan emin olun

## 🎉 Başarıyla Kurulduysa

Uygulama çalışıyorsa:
- ✅ http://localhost:3000 - Frontend'e erişebiliyorsanız
- ✅ Admin girişi yapabiliyorsanız
- ✅ Personel ekleme/çıkarma yapabiliyorsanız

**Başarılar! Sistem hazır kullanıma! 🚀**
