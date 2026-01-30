# 🚀 Hızlı Başlangıç

## Adım 1: Docker Desktop'ı Başlat
Windows menüsünden Docker Desktop'ı başlatın ve çalıştığından emin olun.

## Adım 2: PowerShell veya Terminal Aç
Proje klasöründe PowerShell açın:
```
c:\Users\M.Yusuf Yanık\Desktop\takip
```

## Adım 3: Docker Container'ları Başlat
```powershell
docker-compose up -d
```

Bu komut:
- ✅ PostgreSQL veritabanını başlatır
- ✅ Veritabanı tablolarını oluşturur
- ✅ Örnek verileri yükler
- ✅ Frontend ve Backend'i başlatır

## Adım 4: Servislerin Hazır Olmasını Bekleyin (30-60 saniye)
```powershell
docker-compose logs -f
```
"Server ready" veya benzeri mesajı gördüğünüzde hazır.

## Adım 5: Tarayıcıda Açın
http://localhost:3000

## 🔐 Giriş Bilgileri

### Admin:
- Email: `admin@restaurant.com`
- Şifre: `admin123`

### Personel:
- Personel No: `P001`, `P002`, `P003`, `P004`
- Şifre: `123456`

## ⚙️ Kontrol Komutları

```powershell
# Çalışan servisleri göster
docker-compose ps

# Logları izle
docker-compose logs -f

# Servisleri durdur
docker-compose stop

# Servisleri yeniden başlat
docker-compose restart

# Tamamen kapat (veriler kalır)
docker-compose down

# Veritabanını sıfırla (TEHLİKELİ!)
docker-compose down -v
docker-compose up -d
```

## 📖 Detaylı Bilgi
Detaylı kurulum ve sorun giderme için `DOCKER_KURULUM.md` dosyasına bakın.

## ❓ Sorun mu Yaşıyorsun?

### Container başlamıyor:
```powershell
docker-compose down
docker-compose up -d
```

### Port zaten kullanımda:
`docker-compose.yml` dosyasında portları değiştir (örn: 3000 -> 3001)

### Veritabanı bozuldu:
```powershell
docker-compose down -v
docker-compose up -d
```

**İyi çalışmalar! 🎉**
