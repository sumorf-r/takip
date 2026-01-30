# 🚀 Production Server Kurulum Tamamlandı

## ✅ Tamamlanan İşlemler

### Sunucu: **5.175.136.74**
### Domain: **uavdy.com**

1. ✅ Ubuntu 24.04 LTS güncellendi
2. ✅ fail2ban kuruldu ve SSH koruması aktif
3. ✅ Firewall (UFW) yapılandırıldı
4. ✅ PostgreSQL 16 kuruldu ve veritabanı oluşturuldu
5. ✅ Node.js 20.x ve PM2 kuruldu
6. ✅ Nginx web server kuruldu
7. ✅ GitHub repository clone edildi
8. ✅ Uygulama build edildi
9. ✅ PM2 ile backend servisleri başlatıldı
10. ✅ Otomatik deployment webhook sistemi kuruldu

## 🎯 Şimdi Yapmanız Gerekenler

### 1. DNS Ayarlarını Yapın

Domain sağlayıcınızda (GoDaddy, Namecheap, Cloudflare vb.) aşağıdaki DNS kayıtlarını ekleyin:

```
Tip: A
Host: @
Değer: 5.175.136.74
TTL: 3600

Tip: A
Host: www
Değer: 5.175.136.74
TTL: 3600
```

**DNS propagation 5-30 dakika sürebilir.**

### 2. DNS Yayılmasını Kontrol Edin

PowerShell'de:
```powershell
nslookup uavdy.com
```

Çıktıda **5.175.136.74** görmelisiniz.

### 3. SSL Sertifikası Kurun

DNS yayıldıktan sonra sunucuda:

```bash
ssh root@5.175.136.74
certbot --nginx -d uavdy.com -d www.uavdy.com --non-interactive --agree-tos --email admin@uavdy.com
```

## 🔧 Sunucu Durumu

### Çalışan Servisler

```bash
# PM2 servislerini kontrol
pm2 list

# Nginx durumu
systemctl status nginx

# PostgreSQL durumu
systemctl status postgresql

# Fail2ban durumu
systemctl status fail2ban
```

### Uygulama Konumları

- **Uygulama Dizini:** `/var/www/takip`
- **Nginx Config:** `/etc/nginx/sites-available/uavdy.com`
- **PM2 Config:** `/var/www/takip/ecosystem.config.cjs`
- **Veritabanı:** `restaurant_tracking` (PostgreSQL)

## 🔄 Otomatik Deployment

GitHub'dan kod değişikliği yapıldığında otomatik deployment için:

### GitHub Webhook Ayarı

1. GitHub repository'nize gidin: https://github.com/sumorf-r/takip
2. Settings > Webhooks > Add webhook
3. Şu bilgileri girin:
   - **Payload URL:** `http://5.175.136.74:9000/webhook`
   - **Content type:** `application/json`
   - **Which events:** Just the push event
   - **Active:** ✅ işaretli olsun
4. Add webhook'e tıklayın

### Manuel Deployment

SSH ile sunucuya bağlanıp:
```bash
/root/deploy-takip.sh
```

## 🌐 Siteye Erişim

DNS yayıldıktan ve SSL kurulduktan sonra:

**Frontend:** https://uavdy.com
**API:** https://uavdy.com/.netlify/functions/

## 🔐 Giriş Bilgileri

### Admin
- Email: `admin@restaurant.com`
- Şifre: `admin123`

### Personel Örnekleri
- P001 (Ahmet Yılmaz)
- P002 (Ayşe Demir)
- P003 (Mehmet Kaya)
- P004 (Fatma Öz)
- Şifre: `123456`

## 🗄️ Veritabanı Bilgileri

```
Host: localhost
Port: 5432
Database: restaurant_tracking
User: restaurant_app
Password: RestaurantDB2024Secure
```

### Veritabanına Bağlanma

```bash
ssh root@5.175.136.74
psql -U restaurant_app -d restaurant_tracking
```

## 📊 Monitoring ve Loglar

### PM2 Logları
```bash
# Tüm loglar
pm2 logs

# Sadece uygulama logları
pm2 logs takip-functions

# Webhook logları
pm2 logs webhook
```

### Nginx Logları
```bash
# Access log
tail -f /var/log/nginx/access.log

# Error log
tail -f /var/log/nginx/error.log
```

### PostgreSQL Logları
```bash
tail -f /var/log/postgresql/postgresql-16-main.log
```

## 🔒 Güvenlik

### Aktif Güvenlik Özellikleri

- ✅ fail2ban (SSH brute force koruması)
- ✅ UFW Firewall
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 5432 (PostgreSQL - localhost only)
  - Port 9000 (Webhook)
- ✅ SSL/TLS (Kurulum sonrası)

### SSH Güvenliği

fail2ban aktif olarak SSH girişlerini izliyor. 5 başarısız denemeden sonra IP banlanır.

## 🛠️ Faydalı Komutlar

### PM2 Yönetimi
```bash
# Servisleri yeniden başlat
pm2 restart takip-functions
pm2 restart webhook

# Servisleri durdur
pm2 stop all

# Servisleri başlat
pm2 start all

# İstatistikler
pm2 monit
```

### Nginx Yönetimi
```bash
# Test config
nginx -t

# Reload
systemctl reload nginx

# Restart
systemctl restart nginx
```

### Veritabanı Yedekleme
```bash
# Backup
pg_dump -U restaurant_app restaurant_tracking > backup-$(date +%Y%m%d).sql

# Restore
psql -U restaurant_app -d restaurant_tracking < backup.sql
```

## 🚨 Sorun Giderme

### Site açılmıyor

1. DNS yayılmasını kontrol edin: `nslookup uavdy.com`
2. Nginx çalışıyor mu: `systemctl status nginx`
3. PM2 servisleri çalışıyor mu: `pm2 list`
4. Firewall ayarları: `ufw status`

### API çalışmıyor

```bash
# PM2 loglarını kontrol
pm2 logs takip-functions

# Servisi yeniden başlat
pm2 restart takip-functions
```

### Veritabanı bağlantı hatası

```bash
# PostgreSQL çalışıyor mu
systemctl status postgresql

# Bağlantı testi
psql -U restaurant_app -d restaurant_tracking -c "SELECT 1;"
```

## 📞 Sunucu Erişim Bilgileri

```
IP: 5.175.136.74
User: root
Password: shS@USZMcpN0mgp
```

## 🎉 Kurulum Tamamlandı!

Sistem production'da çalışmaya hazır. DNS ayarlarını yapıp SSL kurulumunu tamamladığınızda site yayında olacak.

**Sonraki Adımlar:**
1. ✅ DNS kayıtlarını ekleyin
2. ⏳ DNS yayılmasını bekleyin (5-30 dk)
3. 🔐 SSL sertifikasını kurun
4. 🚀 Siteye erişin: https://uavdy.com
5. 🔗 GitHub webhook ekleyin (otomatik deployment için)
