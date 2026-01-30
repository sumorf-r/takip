-- Mesai ve Hak Ediş Hesaplama Sistemi

-- View: Günlük Kazanç Özeti
CREATE OR REPLACE VIEW v_daily_earnings_summary AS
SELECT 
    a.id,
    a.personnel_id,
    p.personnel_no,
    p.name || ' ' || p.surname as personnel_name,
    DATE(a.check_in_time) as work_date,
    a.check_in_time,
    a.check_out_time,
    p.shift_start_time,
    p.shift_end_time,
    a.late_arrival_minutes,
    a.overtime_minutes,
    a.work_hours,
    p.daily_wage,
    p.minute_wage,
    a.daily_earnings,
    a.net_earnings,
    CASE 
        WHEN a.late_arrival_minutes > 0 THEN (a.late_arrival_minutes * p.minute_wage)
        ELSE 0 
    END as late_penalty,
    CASE 
        WHEN a.overtime_minutes > 0 THEN (a.overtime_minutes * p.minute_wage * 1.5)
        ELSE 0 
    END as overtime_bonus
FROM attendance a
JOIN personnel p ON a.personnel_id = p.id
WHERE a.check_out_time IS NOT NULL
ORDER BY a.check_in_time DESC;

-- Function: Mesai ve Kazanç Hesaplama
CREATE OR REPLACE FUNCTION calculate_earnings_and_penalties()
RETURNS TRIGGER AS $$
DECLARE
    v_shift_start TIME;
    v_shift_end TIME;
    v_daily_wage DECIMAL(10,2);
    v_minute_wage DECIMAL(10,2);
    v_late_minutes INTEGER := 0;
    v_overtime_minutes INTEGER := 0;
    v_late_penalty DECIMAL(10,2) := 0;
    v_overtime_pay DECIMAL(10,2) := 0;
    v_daily_earnings DECIMAL(10,2);
    v_net_earnings DECIMAL(10,2);
    v_check_in_time TIME;
    v_check_out_time TIME;
    v_shift_duration_minutes INTEGER;
    v_actual_duration_minutes INTEGER;
BEGIN
    IF NEW.check_out_time IS NOT NULL THEN
        SELECT 
            shift_start_time,
            shift_end_time,
            daily_wage,
            minute_wage
        INTO 
            v_shift_start,
            v_shift_end,
            v_daily_wage,
            v_minute_wage
        FROM personnel
        WHERE id = NEW.personnel_id;
        
        v_check_in_time := NEW.check_in_time::TIME;
        v_check_out_time := NEW.check_out_time::TIME;
        
        IF v_check_in_time > v_shift_start THEN
            v_late_minutes := EXTRACT(EPOCH FROM (v_check_in_time - v_shift_start)) / 60;
            v_late_penalty := v_late_minutes * v_minute_wage;
        END IF;
        
        v_shift_duration_minutes := EXTRACT(EPOCH FROM (v_shift_end - v_shift_start)) / 60;
        v_actual_duration_minutes := EXTRACT(EPOCH FROM (v_check_out_time - v_check_in_time)) / 60;
        
        IF v_actual_duration_minutes > v_shift_duration_minutes THEN
            v_overtime_minutes := v_actual_duration_minutes - v_shift_duration_minutes;
            v_overtime_pay := v_overtime_minutes * v_minute_wage * 1.5;
        END IF;
        
        v_daily_earnings := v_daily_wage;
        v_net_earnings := v_daily_earnings - v_late_penalty + v_overtime_pay;
        
        NEW.late_arrival_minutes := v_late_minutes;
        NEW.overtime_minutes := v_overtime_minutes;
        NEW.daily_earnings := v_daily_earnings;
        NEW.net_earnings := v_net_earnings;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_earnings
    BEFORE INSERT OR UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION calculate_earnings_and_penalties();
