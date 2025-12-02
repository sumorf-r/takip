# 🚀 HIZLI KURULUM (SSL'SİZ)

Domain alana kadar SSL'siz kullanabilirsiniz. İşte hızlı kurulum:

## 1️⃣ PostgreSQL Kurulum

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL'i başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 2️⃣ Veritabanı Oluştur

```bash
# PostgreSQL'e bağlan
sudo -u postgres psql

# Komutları sırayla çalıştır:
CREATE DATABASE restaurant_tracking;
CREATE USER restaurant_app WITH PASSWORD 'Test123456!';
GRANT ALL PRIVILEGES ON DATABASE restaurant_tracking TO restaurant_app;
\q
```

## 3️⃣ Uzaktan Bağlantıya İzin Ver

```bash
# PostgreSQL config dosyasını aç
sudo nano /etc/postgresql/14/main/postgresql.conf

# Bu satırı bul ve değiştir:
listen_addresses = '*'  # Tüm IP'lerden bağlantı kabul et

# pg_hba.conf dosyasını aç
sudo nano /etc/postgresql/14/main/pg_hba.conf

# En alta şunu ekle (kendi IP aralığınıza göre düzenleyin):
host    all             all             0.0.0.0/0               md5

# PostgreSQL'i yeniden başlat
sudo systemctl restart postgresql
```

## 4️⃣ Firewall Aç

```bash
# 5432 portunu aç
sudo ufw allow 5432/tcp
```

## 5️⃣ Schema'yı Yükle

```bash
# Schema dosyasını sunucuya kopyala
scp schema.sql username@your-server-ip:/tmp/

# Sunucuda çalıştır
psql -h localhost -U restaurant_app -d restaurant_tracking -f /tmp/schema.sql
# Şifre: Test123456!
```

## 6️⃣ .env Dosyasını Ayarla

Projede `.env` dosyası oluştur:

```env
# Database (SSL KAPALI)
VITE_DB_HOST=192.168.1.100  # Sunucu IP'niz
VITE_DB_PORT=5432
VITE_DB_NAME=restaurant_tracking
VITE_DB_USER=restaurant_app
VITE_DB_PASSWORD=Test123456!
VITE_DB_SSL=false

# JWT
JWT_SECRET=test-secret-key-minimum-32-karakter-olsun-1234567890
```

## 7️⃣ Test Et

```bash
# Lokal makinenizden test
psql -h SUNUCU_IP -U restaurant_app -d restaurant_tracking -c "SELECT NOW();"

# Node.js projede
npm install
npm run dev
```

## ✅ Hazır!

Artık sistem çalışıyor. Domain aldıktan sonra:
1. SSL sertifikası alın
2. `.env` dosyasında `VITE_DB_SSL=true` yapın
3. PostgreSQL'de SSL'i aktifleştirin

## 🔧 Sorun Giderme

**"Connection refused" hatası:**
```bash
# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Port açık mı?
sudo netstat -tlnp | grep 5432
```

**"Authentication failed" hatası:**
```bash
# pg_hba.conf'u kontrol et
sudo cat /etc/postgresql/14/main/pg_hba.conf | grep md5
```

**"No route to host" hatası:**
```bash
# Firewall kontrol
sudo ufw status
```

---

**NOT**: Bu kurulum test/development içindir. Production'da mutlaka:
- Güçlü şifre kullanın
- IP whitelist yapın  
- Domain alınca SSL aktifleştirin
