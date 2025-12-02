# 🚀 Linux Sunucuda Veritabanı Kurulum Rehberi

## 1️⃣ PostgreSQL Kurulumu (Önerilen)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib

# PostgreSQL'i başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 2️⃣ Veritabanı ve Kullanıcı Oluşturma

```bash
# PostgreSQL'e root olarak bağlan
sudo -u postgres psql

# Veritabanını oluştur
CREATE DATABASE restaurant_tracking;

# Kullanıcı oluştur
CREATE USER restaurant_app WITH PASSWORD 'güvenli_şifreniz';

# Yetkileri ver
GRANT ALL PRIVILEGES ON DATABASE restaurant_tracking TO restaurant_app;

# Çık
\q
```

## 3️⃣ Schema'yı Yükle

```bash
# Schema dosyasını sunucuya kopyala
scp schema.sql your_user@your_server:/tmp/

# Sunucuda schema'yı çalıştır
sudo -u postgres psql restaurant_tracking < /tmp/schema.sql
```

## 4️⃣ PostgreSQL Konfigürasyonu

```bash
# postgresql.conf dosyasını düzenle
sudo nano /etc/postgresql/14/main/postgresql.conf

# Bu satırı bul ve düzenle (dış bağlantılar için)
listen_addresses = '*'  # veya specific IP

# pg_hba.conf dosyasını düzenle
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Bu satırı ekle (IP aralığınıza göre düzenleyin)
host    restaurant_tracking    restaurant_app    192.168.1.0/24    md5

# PostgreSQL'i yeniden başlat
sudo systemctl restart postgresql
```

## 5️⃣ Firewall Ayarları

```bash
# PostgreSQL portunu aç
sudo ufw allow 5432/tcp

# veya iptables kullanıyorsanız
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
```

## 6️⃣ SSL Sertifikası (İLERİDE - Domain aldıktan sonra)

```bash
# SSL sertifikası oluştur
sudo -u postgres openssl req -new -x509 -days 365 -nodes -text \
  -out /var/lib/postgresql/14/main/server.crt \
  -keyout /var/lib/postgresql/14/main/server.key \
  -subj "/CN=your_domain.com"

# İzinleri ayarla
sudo chmod 600 /var/lib/postgresql/14/main/server.key
sudo chown postgres:postgres /var/lib/postgresql/14/main/server.*
```

## 7️⃣ Backup Script (Otomatik yedekleme)

```bash
# backup.sh oluştur
cat > /home/your_user/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="restaurant_tracking"

mkdir -p $BACKUP_DIR
pg_dump -U restaurant_app -h localhost $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 7 günden eski backupları sil
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /home/your_user/backup_db.sh

# Cron job ekle (her gün saat 02:00)
crontab -e
# Ekle: 0 2 * * * /home/your_user/backup_db.sh
```

## 8️⃣ Monitoring (İzleme)

```bash
# pgAdmin4 kurulumu (Web UI)
sudo apt install pgadmin4

# veya pg_stat_statements extension'ı aktifleştir
sudo -u postgres psql -d restaurant_tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

## 9️⃣ .env Dosyası Ayarları

Projenizin root klasöründe `.env` dosyası oluşturun:

```env
# Database
DB_HOST=192.168.1.100
DB_PORT=5432
DB_NAME=restaurant_tracking
DB_USER=restaurant_app
DB_PASSWORD=güvenli_şifreniz
DB_SSL=false

# JWT Secret
JWT_SECRET=çok_uzun_rastgele_bir_string_buraya

# Server
NODE_ENV=production
PORT=3000
```

## 🔒 Güvenlik Kontrol Listesi

- [ ] Güçlü şifreler kullanıldı
- [ ] PostgreSQL varsayılan portunu değiştirmeyi düşün (5432 → 5433)
- [ ] IP whitelist yapıldı (pg_hba.conf)
- [ ] ~~SSL sertifikası kuruldu~~ (Domain alınca yapılacak)
- [ ] Backup stratejisi belirlendi
- [ ] Monitoring kuruldu
- [ ] Rate limiting eklendi
- [ ] SQL injection koruması var (prepared statements)

## 📊 Performans Ayarları

```sql
-- PostgreSQL performans ayarları
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Ayarları uygula
SELECT pg_reload_conf();
```

## 🔗 Node.js Bağlantısı

```javascript
// db.js
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

module.exports = pool
```

## ⚡ Hızlı Test

```bash
# Bağlantıyı test et
psql -h YOUR_SERVER_IP -U restaurant_app -d restaurant_tracking

# Node.js'den test
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'YOUR_SERVER_IP',
  port: 5432,
  database: 'restaurant_tracking',
  user: 'restaurant_app',
  password: 'YOUR_PASSWORD'
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows);
  pool.end();
});
"
```

## 📞 Sorun Giderme

1. **Bağlantı reddedildi**: Firewall, pg_hba.conf, postgresql.conf kontrol et
2. **Authentication failed**: Şifre, kullanıcı adı, veritabanı adı kontrol et
3. **SSL required**: SSL ayarlarını kontrol et
4. **Yavaş sorgular**: EXPLAIN ANALYZE kullan, index'leri kontrol et

---

**NOT**: Production'da mutlaka SSL kullanın ve düzenli backup alın!
