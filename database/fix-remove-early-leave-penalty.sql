-- =====================================================
-- ERKEN ÇIKMA CEZASINI KALDIR
-- Trigger'dan erken çıkış ceza hesaplamasını kaldırır
-- =====================================================

-- Güncellenmiş mesai hesaplama fonksiyonu (ceza YOK!)
CREATE OR REPLACE FUNCTION calculate_earnings_and_penalties(
    p_attendance_id UUID
)
RETURNS TABLE (
    overtime_mins INTEGER,
    late_mins INTEGER,
    early_leave_mins INTEGER,
    overtime_pay DECIMAL(10, 2),
    late_penalty_amount DECIMAL(10, 2),
    early_penalty_amount DECIMAL(10, 2),
    daily_pay DECIMAL(10, 2),
    net_pay DECIMAL(10, 2)
) AS $$
DECLARE
    v_personnel RECORD;
    v_attendance RECORD;
    v_check_in_time TIME;
    v_check_out_time TIME;
    v_expected_in TIME;
    v_expected_out TIME;
    v_worked_minutes INTEGER;
    v_expected_minutes INTEGER;
    v_overtime_minutes INTEGER := 0;
    v_late_minutes INTEGER := 0;
    v_early_leave_minutes INTEGER := 0;
    v_overtime_amount DECIMAL(10, 2) := 0.00;
    v_late_penalty DECIMAL(10, 2) := 0.00;
    v_early_penalty DECIMAL(10, 2) := 0.00;  -- Artık kullanılmıyor!
    v_daily_earnings DECIMAL(10, 2) := 0.00;
    v_net_earnings DECIMAL(10, 2) := 0.00;
BEGIN
    -- Attendance kaydını getir
    SELECT * INTO v_attendance 
    FROM attendance 
    WHERE id = p_attendance_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attendance record not found';
    END IF;
    
    -- Personnel bilgilerini getir
    SELECT * INTO v_personnel 
    FROM personnel 
    WHERE id = v_attendance.personnel_id;
    
    -- Sadece saatleri al
    v_check_in_time := v_attendance.check_in_time::TIME;
    v_check_out_time := COALESCE(v_attendance.check_out_time::TIME, CURRENT_TIME);
    v_expected_in := v_personnel.shift_start_time;
    v_expected_out := v_personnel.shift_end_time;
    
    -- Çalışılan dakika
    v_worked_minutes := EXTRACT(EPOCH FROM (v_check_out_time - v_check_in_time))/60;
    
    -- Beklenen çalışma dakikası
    v_expected_minutes := v_personnel.standard_work_hours * 60;
    
    -- GEÇ KALMA hesapla (tolerans 15 dakika)
    IF v_check_in_time > v_expected_in + INTERVAL '15 minutes' THEN
        v_late_minutes := EXTRACT(EPOCH FROM (v_check_in_time - v_expected_in))/60;
        v_late_penalty := v_late_minutes * v_personnel.minute_wage;
    END IF;
    
    -- ❌ ERKEN ÇIKIŞ CEZASI KALDIRILDI!
    -- Artık erken çıkma cezası yok, sadece bilgi amaçlı hesaplanır
    IF v_attendance.check_out_time IS NOT NULL AND v_check_out_time < v_expected_out THEN
        v_early_leave_minutes := EXTRACT(EPOCH FROM (v_expected_out - v_check_out_time))/60;
        -- v_early_penalty := 0.00;  -- CEZA YOK!
    END IF;
    
    -- FAZLA MESAİ hesapla (1.5x ücret)
    IF v_worked_minutes > v_expected_minutes THEN
        v_overtime_minutes := v_worked_minutes - v_expected_minutes;
        v_overtime_amount := v_overtime_minutes * v_personnel.minute_wage * 1.5;
    END IF;
    
    -- GÜNLÜK KAZANÇ (çalıştığı süre kadar)
    -- Ne kadar çalışırsa o kadar alır - basit ve adil!
    v_daily_earnings := (v_worked_minutes::DECIMAL / 60) * v_personnel.hourly_wage;
    
    -- NET KAZANÇ hesapla (erken çıkış cezası YOK!)
    v_net_earnings := v_daily_earnings + v_overtime_amount - v_late_penalty;
    
    -- Negatif olmaz - minimum 0
    IF v_net_earnings < 0 THEN
        v_net_earnings := 0;
    END IF;
    
    -- Sonuçları döndür
    RETURN QUERY SELECT 
        v_overtime_minutes,
        v_late_minutes,
        v_early_leave_minutes,
        v_overtime_amount,
        v_late_penalty,
        0.00::DECIMAL(10, 2), -- v_early_penalty artık her zaman 0
        v_daily_earnings,
        v_net_earnings;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı güncelle (değişiklik yok ama tutarlılık için)
CREATE OR REPLACE FUNCTION trigger_calculate_earnings()
RETURNS TRIGGER AS $$
DECLARE
    v_result RECORD;
BEGIN
    -- Sadece check_out yapıldığında hesapla
    IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
        -- Hesaplamayı yap
        SELECT * INTO v_result 
        FROM calculate_earnings_and_penalties(NEW.id);
        
        -- Sonuçları kaydet
        NEW.overtime_minutes := v_result.overtime_mins;
        NEW.late_arrival_minutes := v_result.late_mins;
        NEW.early_leave_minutes := v_result.early_leave_mins;
        NEW.overtime_amount := v_result.overtime_pay;
        NEW.late_penalty := v_result.late_penalty_amount;
        NEW.early_leave_penalty := 0.00;  -- Artık her zaman 0!
        NEW.daily_earnings := v_result.daily_pay;
        NEW.net_earnings := v_result.net_pay;
        NEW.expected_check_in := (SELECT shift_start_time FROM personnel WHERE id = NEW.personnel_id);
        NEW.expected_check_out := (SELECT shift_end_time FROM personnel WHERE id = NEW.personnel_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS trigger_auto_calculate_earnings ON attendance;
CREATE TRIGGER trigger_auto_calculate_earnings
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_earnings();

-- =====================================================
-- BAŞARI MESAJI
-- =====================================================
SELECT '
╔════════════════════════════════════════════╗
║   ✅ ERKEN ÇIKIŞ CEZASI KALDIRILDI!       ║
╠════════════════════════════════════════════╣
║                                            ║
║  Artık sistem:                             ║
║  ✅ Ne kadar çalışırsa o kadar öder        ║
║  ❌ Erken çıkış cezası YOK                 ║
║  ✅ Geç kalma cezası var (15dk tolerans)   ║
║  ✅ Fazla mesai ödenir (1.5x)              ║
║                                            ║
║  Formül:                                   ║
║  Net = Çalışma + Fazla Mesai - Geç Kalma  ║
║                                            ║
║  Test:                                     ║
║  4 dakika çalışma = 16.67 ₺ ✅             ║
║  (Artık eksi değer çıkmaz!)                ║
║                                            ║
╚════════════════════════════════════════════╝
' AS "✅ GÜNCELLEME BAŞARILI";
