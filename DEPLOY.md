# 🚀 Sunucuya Deploy

## Sunucu Bilgileri
- **IP:** 5.175.136.74
- **User:** root

---

## Hızlı Kurulum (SSH ile)

### 1. Sunucuya bağlan
```bash
ssh root@5.175.136.74
```

### 2. Docker kur (eğer yoksa)
```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Proje klasörü oluştur
```bash
mkdir -p /opt/takip
cd /opt/takip
```

### 4. Dosyaları kopyala (local'den)
```bash
# Local bilgisayarından çalıştır:
scp -r * root@5.175.136.74:/opt/takip/
```

### 5. Docker ile başlat
```bash
cd /opt/takip
docker compose up -d --build
```

### 6. Erişim
```
http://5.175.136.74:3001
```

---

## Giriş Bilgileri

| Tür | Kullanıcı | Şifre |
|-----|-----------|-------|
| **Admin** | admin@restaurant.com | admin123 |
| **Personel** | P001 | 123456 |

---

## Yönetim Komutları

```bash
# Durumu gör
docker compose ps

# Logları gör
docker compose logs -f

# Yeniden başlat
docker compose restart

# Durdur
docker compose down

# Güncelle ve yeniden başlat
docker compose up -d --build
```

---

## Veritabanı Yedekleme

```bash
# Yedek al
docker exec takip-postgres pg_dump -U restaurant_app restaurant_tracking > backup.sql

# Geri yükle
cat backup.sql | docker exec -i takip-postgres psql -U restaurant_app -d restaurant_tracking
```

---

## Port Açma (Firewall)

```bash
# UFW ile
ufw allow 3001/tcp

# iptables ile
iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```
