# MESAİ VE HAK EDİŞ OTOMATIK HESAPLAMA SİSTEMİ

## 📊 SİSTEM NASIL ÇALIŞIR?

### 💰 Ücret Hesaplama Mantığı:

```
Örnek: Ahmet'in aylık maaşı 30,000 TL

1. Günlük Ücret  = 30,000 / 30 = 1,000 TL/gün
2. Saatlik Ücret = 1,000 / 8  = 125 TL/saat
3. Dakikalık Ücret = 125 / 60 = 2.08 TL/dakika
```

### ⏰ Mesai Hesaplama:

**Standart Mesai:** 09:00 - 18:00 (8 saat)

#### 1. GEÇ KALMA:
- **Tolerans:** 15 dakika
- **Hesaplama:** Geç kalınan dakika x Dakikalık ücret = Kesinti
- **Örnek:** 30 dk geç kalma → 30 x 2.08 = **-62.40 TL**

#### 2. ERKEN ÇIKIŞ:
- **Hesaplama:** Erken çıkılan dakika x Dakikalık ücret = Kesinti
- **Örnek:** 20 dk erken çıkış → 20 x 2.08 = **-41.60 TL**

#### 3. FAZLA MESAİ:
- **Hesaplama:** Fazla mesai dakikası x Dakikalık ücret x **1.5**
- **Örnek:** 60 dk fazla mesai → 60 x 2.08 x 1.5 = **+187.20 TL**

#### 4. NET KAZANÇ:
```
Net Kazanç = Günlük Ücret + Fazla Mesai - Geç Kalma - Erken Çıkış

Örnek:
  Günlük Ücret:     1,000.00 TL
+ Fazla Mesai:        187.20 TL
- Geç Kalma:          -62.40 TL
- Erken Çıkış:        -41.60 TL
─────────────────────────────
= NET KAZANÇ:       1,083.20 TL
```

---

## 🔧 KURULUM ADIMLARI:

### 1. Migration Dosyasını Çalıştır:

```bash
# PostgreSQL'e bağlan
psql -h 5.175.136.149 -U restaurant_app -d restaurant_tracking

# Migration dosyasını çalıştır
\i migration-mesai-hesaplama.sql
```

**VEYA** pgAdmin'den:

1. Query Tool'u aç
2. `migration-mesai-hesaplama.sql` dosyasını aç
3. **Execute (F5)** tuşuna bas

---

## ✅ YAPILAN DEĞİŞİKLİKLER:

### 1. PERSONNEL Tablosu (Yeni Kolonlar):
```sql
- monthly_salary         → Aylık maaş (30,000 TL)
- daily_wage            → Günlük ücret (otomatik)
- hourly_wage           → Saatlik ücret (otomatik)
- minute_wage           → Dakikalık ücret (otomatik)
- standard_work_hours   → Standart çalışma saati (8 saat)
- shift_start_time      → Vardiya başlangıç (09:00)
- shift_end_time        → Vardiya bitiş (18:00)
```

### 2. ATTENDANCE Tablosu (Yeni Kolonlar):
```sql
- expected_check_in          → Beklenen giriş saati
- expected_check_out         → Beklenen çıkış saati
- late_arrival_minutes       → Geç kalma (dakika)
- early_leave_minutes        → Erken çıkma (dakika)
- overtime_minutes           → Fazla mesai (dakika)
- overtime_amount            → Fazla mesai ücreti
- late_penalty               → Geç kalma kesintisi
- early_leave_penalty        → Erken çıkış kesintisi
- daily_earnings             → Günlük kazanç
- net_earnings               → Net kazanç
```

### 3. Fonksiyonlar:
- ✅ `calculate_earnings_and_penalties()` → Hesaplama fonksiyonu
- ✅ `trigger_calculate_earnings()` → Otomatik hesaplama trigger

### 4. Yeni Tablo:
- ✅ `monthly_earnings` → Aylık özet

### 5. View:
- ✅ `v_daily_earnings_summary` → Günlük kazanç özeti

---

## 📋 TEST ETME:

### 1. Personel Maaşlarını Kontrol Et:
```sql
SELECT 
    personnel_no,
    name,
    monthly_salary as "Aylık Maaş",
    daily_wage as "Günlük",
    hourly_wage as "Saatlik",
    minute_wage as "Dakikalık"
FROM personnel;
```

### 2. Günlük Kazançları Gör:
```sql
SELECT * FROM v_daily_earnings_summary 
ORDER BY work_date DESC 
LIMIT 10;
```

### 3. Manuel Hesaplama Testi:
```sql
-- Bir attendance kaydı için hesapla
SELECT * FROM calculate_earnings_and_penalties(1);
```

---

## 🎯 ÖNEMLİ NOTLAR:

### ⚠️ Tolerans Ayarları:
- **Geç kalma toleransı:** 15 dakika
- Değiştirmek için fonksiyonda düzenle: `+ INTERVAL '15 minutes'`

### 💡 Özelleştirme:
```sql
-- Fazla mesai katsayısını değiştir (şu an 1.5x)
v_overtime_amount := v_overtime_minutes * v_personnel.minute_wage * 1.5;

-- Farklı katsayı için (örn: 2x):
v_overtime_amount := v_overtime_minutes * v_personnel.minute_wage * 2.0;
```

### 🔄 Otomatik Hesaplama:
- Çıkış yapıldığında **OTOMATIK** hesaplanır
- Manuel hesaplamaya gerek yok
- Trigger sayesinde her çıkışta çalışır

---

## 📊 ÖRNEK SENARYO:

**Personel:** Ahmet (P001)
- **Maaş:** 30,000 TL
- **Mesai:** 09:00 - 18:00

**Gün 1:**
- **Giriş:** 09:10 (10 dk geç - tolerans içinde)
- **Çıkış:** 18:30 (30 dk fazla mesai)
- **Net:** 1,000 + 93.6 = **1,093.60 TL** ✅

**Gün 2:**
- **Giriş:** 09:35 (35 dk geç)
- **Çıkış:** 17:45 (15 dk erken)
- **Net:** 1,000 - 72.8 - 31.2 = **896.00 TL** ⚠️

**Gün 3:**
- **Giriş:** 09:05 (tolerans içinde)
- **Çıkış:** 19:00 (60 dk fazla mesai)
- **Net:** 1,000 + 187.2 = **1,187.20 TL** 🎉

---

## 🚀 SONRAKI ADIMLAR:

1. ✅ Migration'ı çalıştır
2. 🔧 Maaşları güncelle (gerekirse)
3. 📱 Frontend'de göster (Dashboard)
4. 📊 Aylık rapor oluştur

---

**Hazırladım! Database'i güncelleyebilirsin!** 🎯
