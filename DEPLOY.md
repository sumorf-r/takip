# 🚀 Kendi Sunucuna Deploy Etme

## Gereksinimler

- Docker & Docker Compose
- Git

---

## 🔧 Hızlı Kurulum

### 1. Projeyi klonla

```bash
git clone <repo-url>
cd takip
```

### 2. Environment dosyası oluştur

```bash
# .env dosyası oluştur
cat > .env << 'EOF'
# Database
DB_PASSWORD=GucluBirSifre123!

# JWT
JWT_SECRET=cok-gizli-jwt-anahtari-degistir

# App URLs
VITE_API_URL=http://localhost:3001/.netlify/functions
VITE_APP_URL=http://localhost:3001
EOF
```

### 3. Docker ile başlat

```bash
# Sadece app + database
docker-compose up -d

# Nginx ile (production)
docker-compose --profile production up -d
```

### 4. Tarayıcıda aç

```
http://localhost:3001
```

---

## 📋 Giriş Bilgileri

| Tür | Kullanıcı | Şifre |
|-----|-----------|-------|
| **Admin** | admin@restaurant.com | admin123 |
| **Personel** | P001, P002, P003, P004 | 123456 |

---

## 🌐 Production Deploy (VPS/Dedicated Server)

### 1. Sunucuya bağlan

```bash
ssh root@sunucu-ip
```

### 2. Docker kur (Ubuntu)

```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Projeyi çek ve başlat

```bash
git clone <repo-url>
cd takip

# .env dosyasını düzenle
nano .env

# Başlat
docker-compose up -d --build
```

### 4. Domain ayarla (Opsiyonel)

`nginx.conf` dosyasında `server_name` satırını domain'inle değiştir.

---

## 🔒 SSL Sertifikası (Let's Encrypt)

```bash
# Certbot ile SSL al
docker run -it --rm \
  -v ./ssl:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  -d yourdomain.com

# nginx.conf'ta HTTPS bloğunu aktif et
# docker-compose restart nginx
```

---

## 📊 Portlar

| Servis | Port | Açıklama |
|--------|------|----------|
| App | 3001 | Frontend + API |
| PostgreSQL | 5432 | Database |
| Nginx | 80/443 | Reverse Proxy (opsiyonel) |

---

## 🔄 Yönetim Komutları

```bash
# Durumu gör
docker-compose ps

# Logları gör
docker-compose logs -f app
docker-compose logs -f postgres

# Yeniden başlat
docker-compose restart

# Durdur
docker-compose down

# Tamamen sil (veritabanı dahil)
docker-compose down -v

# Yeniden build et
docker-compose up -d --build
```

---

## 🗄️ Database Yedekleme

```bash
# Yedek al
docker exec takip-postgres pg_dump -U restaurant_app restaurant_tracking > backup.sql

# Geri yükle
cat backup.sql | docker exec -i takip-postgres psql -U restaurant_app -d restaurant_tracking
```

---

## 🐛 Sorun Giderme

### Container başlamıyor
```bash
docker-compose logs app
```

### Database bağlantı hatası
```bash
# PostgreSQL'in hazır olduğundan emin ol
docker exec takip-postgres pg_isready -U restaurant_app
```

### Port kullanımda
```bash
# Windows
netstat -ano | findstr :3001

# Linux
lsof -i :3001
```

---

## 🔐 Güvenlik Önerileri

1. ✅ `.env` dosyasındaki şifreleri değiştir
2. ✅ JWT_SECRET'ı güçlü bir değerle değiştir
3. ✅ Production'da SSL kullan
4. ✅ Firewall ayarla (sadece 80/443 portlarını aç)
5. ✅ Database portunu dışarıya kapatabilirsin (5432)

---

**Sistem hazır! 🎉**
