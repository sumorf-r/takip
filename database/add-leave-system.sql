-- İZİN SİSTEMİ
-- Personnel tablosuna izin kolonları eklenir
-- İzin takibi için yeni tablo oluşturulur

-- ===================================
-- 1. PERSONNEL TABLOSUNA İZİN KOLONLARI
-- ===================================

ALTER TABLE personnel
ADD COLUMN IF NOT EXISTS monthly_leave_days INTEGER DEFAULT 2,          -- Ayda kaç gün izin hakkı
ADD COLUMN IF NOT EXISTS remaining_leave_days INTEGER DEFAULT 2,        -- Kalan izin günü
ADD COLUMN IF NOT EXISTS on_leave BOOLEAN DEFAULT FALSE,                -- Şu an izinli mi?
ADD COLUMN IF NOT EXISTS current_leave_start DATE,                      -- Mevcut izin başlangıcı
ADD COLUMN IF NOT EXISTS current_leave_end DATE,                        -- Mevcut izin bitişi
ADD COLUMN IF NOT EXISTS total_leave_days_used INTEGER DEFAULT 0;       -- Toplam kullanılan izin

-- ===================================
-- 2. İZİN GEÇMİŞİ TABLOSU
-- ===================================

CREATE TABLE IF NOT EXISTS leave_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    
    -- İzin bilgileri
    leave_start_date DATE NOT NULL,
    leave_end_date DATE NOT NULL,
    leave_days INTEGER NOT NULL,                         -- Kaç gün izin
    leave_type VARCHAR(50) DEFAULT 'annual',             -- annual, sick, unpaid, etc.
    leave_reason TEXT,
    
    -- Onay bilgileri
    status VARCHAR(20) DEFAULT 'pending',                -- pending, approved, rejected
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Meta
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===================================
-- 3. İNDEXLER
-- ===================================

CREATE INDEX IF NOT EXISTS idx_leave_history_personnel ON leave_history(personnel_id);
CREATE INDEX IF NOT EXISTS idx_leave_history_dates ON leave_history(leave_start_date, leave_end_date);
CREATE INDEX IF NOT EXISTS idx_leave_history_status ON leave_history(status);
CREATE INDEX IF NOT EXISTS idx_personnel_on_leave ON personnel(on_leave);

-- ===================================
-- 4. İZİN BAŞLATMA FONKSİYONU
-- ===================================

CREATE OR REPLACE FUNCTION start_personnel_leave(
    p_personnel_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_leave_type VARCHAR DEFAULT 'annual',
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_leave_days INTEGER;
    v_remaining_days INTEGER;
    v_leave_id UUID;
BEGIN
    -- İzin gün sayısını hesapla
    v_leave_days := p_end_date - p_start_date + 1;
    
    -- Kalan izin gününü kontrol et
    SELECT remaining_leave_days INTO v_remaining_days
    FROM personnel
    WHERE id = p_personnel_id;
    
    IF v_remaining_days < v_leave_days THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Yeterli izin hakkı yok',
            'remaining_days', v_remaining_days,
            'requested_days', v_leave_days
        );
    END IF;
    
    -- Personnel'i izinli yap
    UPDATE personnel
    SET 
        on_leave = TRUE,
        current_leave_start = p_start_date,
        current_leave_end = p_end_date,
        remaining_leave_days = remaining_leave_days - v_leave_days,
        total_leave_days_used = total_leave_days_used + v_leave_days,
        updated_at = NOW()
    WHERE id = p_personnel_id;
    
    -- İzin geçmişine kaydet
    INSERT INTO leave_history (
        personnel_id,
        leave_start_date,
        leave_end_date,
        leave_days,
        leave_type,
        leave_reason,
        status
    ) VALUES (
        p_personnel_id,
        p_start_date,
        p_end_date,
        v_leave_days,
        p_leave_type,
        p_reason,
        'approved'
    ) RETURNING id INTO v_leave_id;
    
    RETURN json_build_object(
        'success', true,
        'leave_id', v_leave_id,
        'leave_days', v_leave_days,
        'remaining_days', v_remaining_days - v_leave_days
    );
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 5. İZİN BİTİRME FONKSİYONU
-- ===================================

CREATE OR REPLACE FUNCTION end_personnel_leave(
    p_personnel_id UUID
)
RETURNS JSON AS $$
BEGIN
    -- Personnel'in iznini bitir
    UPDATE personnel
    SET 
        on_leave = FALSE,
        current_leave_start = NULL,
        current_leave_end = NULL,
        updated_at = NOW()
    WHERE id = p_personnel_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'İzin sonlandırıldı'
    );
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 6. AYLIK İZİN HAKKI YENİLEME FONKSİYONU
-- ===================================

CREATE OR REPLACE FUNCTION reset_monthly_leave_days()
RETURNS void AS $$
BEGIN
    -- Her ayın başında çalıştırılmalı
    UPDATE personnel
    SET 
        remaining_leave_days = monthly_leave_days,
        updated_at = NOW()
    WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 7. OTOMATİK İZİN BİTİŞ KONTROLÜ (TRIGGER)
-- ===================================

CREATE OR REPLACE FUNCTION check_leave_end()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer izin bitiş tarihi geçmişse otomatik bitir
    IF NEW.on_leave = TRUE AND NEW.current_leave_end < CURRENT_DATE THEN
        NEW.on_leave := FALSE;
        NEW.current_leave_start := NULL;
        NEW.current_leave_end := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_end_leave
    BEFORE UPDATE ON personnel
    FOR EACH ROW
    WHEN (OLD.on_leave = TRUE)
    EXECUTE FUNCTION check_leave_end();

-- ===================================
-- 8. İZİN İSTATİSTİKLERİ VIEW
-- ===================================

CREATE OR REPLACE VIEW v_leave_stats AS
SELECT 
    p.id,
    p.personnel_no,
    p.name || ' ' || p.surname AS full_name,
    p.monthly_leave_days,
    p.remaining_leave_days,
    p.total_leave_days_used,
    p.on_leave,
    p.current_leave_start,
    p.current_leave_end,
    COUNT(lh.id) AS total_leave_records,
    SUM(CASE WHEN lh.status = 'approved' THEN lh.leave_days ELSE 0 END) AS approved_leave_days
FROM personnel p
LEFT JOIN leave_history lh ON p.id = lh.personnel_id
WHERE p.is_active = TRUE
GROUP BY p.id, p.personnel_no, p.name, p.surname, p.monthly_leave_days, 
         p.remaining_leave_days, p.total_leave_days_used, p.on_leave, 
         p.current_leave_start, p.current_leave_end;

-- ===================================
-- 9. TEST VERİLERİ (Opsiyonel)
-- ===================================

-- Tüm aktif personele izin hakkı ver
UPDATE personnel
SET 
    monthly_leave_days = 2,
    remaining_leave_days = 2
WHERE is_active = TRUE;

-- ===================================
-- BAŞARI MESAJI
-- ===================================

SELECT '
╔════════════════════════════════════════════╗
║   ✅ İZİN SİSTEMİ BAŞARIYLA KURULDU!      ║
╠════════════════════════════════════════════╣
║                                            ║
║  📋 Eklenenler:                            ║
║    • Personnel tablosuna izin kolonları    ║
║    • leave_history tablosu                 ║
║    • İzin başlatma/bitirme fonksiyonları   ║
║    • Otomatik izin kontrolü trigger        ║
║    • İzin istatistikleri view              ║
║                                            ║
║  📊 Varsayılan:                            ║
║    • Aylık izin: 2 gün                     ║
║    • Otomatik yenileme: Manuel             ║
║                                            ║
║  🔧 Kullanım:                              ║
║    SELECT * FROM v_leave_stats;            ║
║    SELECT start_personnel_leave(...);      ║
║                                            ║
╚════════════════════════════════════════════╝
' AS "✅ İZİN SİSTEMİ HAZIR";
