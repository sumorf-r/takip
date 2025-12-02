-- PostgreSQL Database Schema for Restaurant Personnel Tracking System
-- Database: restaurant_tracking

-- Create Database
CREATE DATABASE restaurant_tracking;
USE restaurant_tracking;

-- =====================================================
-- 1. LOCATIONS TABLE (Restoran Şubeleri)
-- =====================================================
CREATE TABLE locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_code VARCHAR(50) UNIQUE NOT NULL, -- cengelkoy, kadikoy, besiktas
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. USERS TABLE (Admin Kullanıcıları)
-- =====================================================
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin', -- admin, manager, viewer
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. PERSONNEL TABLE (Personeller)
-- =====================================================
CREATE TABLE personnel (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personnel_no VARCHAR(20) UNIQUE NOT NULL, -- Personel numarası
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    password_hash VARCHAR(255), -- Mobil giriş için
    position VARCHAR(50), -- Garson, Komi, Aşçı, Kasa, vb.
    department VARCHAR(50), -- Mutfak, Servis, vb.
    location_id UUID REFERENCES locations(id),
    hire_date DATE,
    birth_date DATE,
    tc_no VARCHAR(11), -- TC Kimlik No (opsiyonel)
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. QR_CODES TABLE (QR Kod Kayıtları)
-- =====================================================
CREATE TABLE qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES locations(id) NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES personnel(id),
    used_at TIMESTAMP
);

-- Index for faster QR lookups
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);

-- =====================================================
-- 5. ATTENDANCE TABLE (Giriş/Çıkış Kayıtları)
-- =====================================================
CREATE TABLE attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personnel_id UUID REFERENCES personnel(id) NOT NULL,
    location_id UUID REFERENCES locations(id) NOT NULL,
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP,
    qr_code_id UUID REFERENCES qr_codes(id),
    check_in_method VARCHAR(20), -- qr, manual, face, fingerprint
    check_out_method VARCHAR(20),
    work_hours DECIMAL(5,2), -- Calculated work hours
    overtime_hours DECIMAL(5,2), -- Fazla mesai
    break_duration INTEGER, -- Dakika cinsinden mola süresi
    status VARCHAR(20) DEFAULT 'present', -- present, absent, late, early_leave
    notes TEXT,
    ip_address VARCHAR(45), -- Security için
    device_info VARCHAR(255), -- Hangi cihazdan giriş yapıldı
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_attendance_personnel_id ON attendance(personnel_id);
CREATE INDEX idx_attendance_location_id ON attendance(location_id);
CREATE INDEX idx_attendance_check_in_time ON attendance(check_in_time);
CREATE INDEX idx_attendance_date ON attendance(DATE(check_in_time));

-- =====================================================
-- 6. WORK_SCHEDULES TABLE (Çalışma Programı)
-- =====================================================
CREATE TABLE work_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personnel_id UUID REFERENCES personnel(id) NOT NULL,
    location_id UUID REFERENCES locations(id) NOT NULL,
    date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    break_minutes INTEGER DEFAULT 60,
    is_holiday BOOLEAN DEFAULT false,
    is_weekend BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(personnel_id, date)
);

-- =====================================================
-- 7. LEAVES TABLE (İzinler)
-- =====================================================
CREATE TABLE leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personnel_id UUID REFERENCES personnel(id) NOT NULL,
    leave_type VARCHAR(50), -- annual, sick, unpaid, maternity, etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. PAYROLL TABLE (Maaş/Puantaj)
-- =====================================================
CREATE TABLE payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personnel_id UUID REFERENCES personnel(id) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_work_days INTEGER,
    total_work_hours DECIMAL(6,2),
    overtime_hours DECIMAL(5,2),
    base_salary DECIMAL(10,2),
    overtime_pay DECIMAL(10,2),
    deductions DECIMAL(10,2),
    bonuses DECIMAL(10,2),
    net_salary DECIMAL(10,2),
    payment_date DATE,
    payment_method VARCHAR(50), -- bank, cash
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(personnel_id, month, year)
);

-- =====================================================
-- 9. AUDIT_LOGS TABLE (Sistem Logları)
-- =====================================================
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    personnel_id UUID,
    action VARCHAR(100) NOT NULL, -- login, logout, check_in, check_out, etc.
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. NOTIFICATIONS TABLE (Bildirimler)
-- =====================================================
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID, -- user_id or personnel_id
    recipient_type VARCHAR(20), -- user, personnel
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50), -- info, warning, error, success
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    data JSONB, -- Extra data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- VIEWS (Raporlama için)
-- =====================================================

-- Daily Attendance Summary View
CREATE VIEW daily_attendance_summary AS
SELECT 
    DATE(a.check_in_time) as date,
    l.name as location,
    COUNT(DISTINCT a.personnel_id) as total_personnel,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
    AVG(a.work_hours) as avg_work_hours
FROM attendance a
JOIN locations l ON a.location_id = l.id
GROUP BY DATE(a.check_in_time), l.name;

-- Monthly Personnel Report View  
CREATE VIEW monthly_personnel_report AS
SELECT 
    p.personnel_no,
    p.name,
    p.surname,
    l.name as location,
    DATE_TRUNC('month', a.check_in_time) as month,
    COUNT(DISTINCT DATE(a.check_in_time)) as work_days,
    SUM(a.work_hours) as total_hours,
    SUM(a.overtime_hours) as overtime_hours
FROM personnel p
LEFT JOIN attendance a ON p.id = a.personnel_id
LEFT JOIN locations l ON p.location_id = l.id
GROUP BY p.id, l.name, DATE_TRUNC('month', a.check_in_time);

-- =====================================================
-- INITIAL DATA (Örnek Veriler)
-- =====================================================

-- Insert Locations
INSERT INTO locations (location_code, name, address, phone) VALUES
('cengelkoy', 'Çengelköy Şubesi', 'Çengelköy, İstanbul', '0216 123 4567'),
('kadikoy', 'Kadıköy Şubesi', 'Kadıköy, İstanbul', '0216 234 5678'),
('besiktas', 'Beşiktaş Şubesi', 'Beşiktaş, İstanbul', '0212 345 6789');

-- Insert Admin User (password: admin123)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@restaurant.com', '$2b$10$YourHashedPasswordHere', 'Admin User', 'admin');

-- Insert Sample Personnel
INSERT INTO personnel (personnel_no, name, surname, position, department, location_id) 
VALUES
('P001', 'Ahmet', 'Yılmaz', 'Garson', 'Servis', (SELECT id FROM locations WHERE location_code = 'cengelkoy')),
('P002', 'Ayşe', 'Demir', 'Komi', 'Servis', (SELECT id FROM locations WHERE location_code = 'cengelkoy')),
('P003', 'Mehmet', 'Kaya', 'Aşçı', 'Mutfak', (SELECT id FROM locations WHERE location_code = 'kadikoy')),
('P004', 'Fatma', 'Öz', 'Kasa', 'Muhasebe', (SELECT id FROM locations WHERE location_code = 'besiktas'));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON personnel 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate work hours
CREATE OR REPLACE FUNCTION calculate_work_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
        NEW.work_hours = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
        -- Subtract break duration if exists
        IF NEW.break_duration IS NOT NULL THEN
            NEW.work_hours = NEW.work_hours - (NEW.break_duration / 60.0);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_attendance_hours 
    BEFORE INSERT OR UPDATE ON attendance 
    FOR EACH ROW EXECUTE FUNCTION calculate_work_hours();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_personnel_location ON personnel(location_id);
CREATE INDEX idx_personnel_active ON personnel(is_active);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_payroll_date ON payroll(year, month);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- PERMISSIONS (Adjust based on your needs)
-- =====================================================
-- Create role for application (SSL opsiyonel)
CREATE ROLE restaurant_app WITH LOGIN PASSWORD 'your_secure_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT ALL PRIVILEGES ON DATABASE restaurant_tracking TO restaurant_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO restaurant_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO restaurant_app;
GRANT USAGE ON SCHEMA public TO restaurant_app;

-- SSL opsiyonel bağlantı için
-- ALTER USER restaurant_app SET ssl_min_protocol_version = 'TLSv1.2';  -- Domain alınca aktifleştirin
