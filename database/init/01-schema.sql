-- PostgreSQL Database Schema for Restaurant Personnel Tracking System
-- Database: restaurant_tracking

-- =====================================================
-- 1. LOCATIONS TABLE (Restoran Şubeleri)
-- =====================================================
CREATE TABLE locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    city VARCHAR(100),
    district VARCHAR(100),
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
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
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
    personnel_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    position VARCHAR(50),
    department VARCHAR(50),
    location_id UUID REFERENCES locations(id),
    hire_date DATE,
    birth_date DATE,
    tc_no VARCHAR(11),
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    salary DECIMAL(10,2),
    monthly_salary DECIMAL(10,2),
    daily_wage DECIMAL(10,2),
    hourly_wage DECIMAL(10,2),
    minute_wage DECIMAL(10,2),
    shift_start_time TIME,
    shift_end_time TIME,
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
    check_in_method VARCHAR(20),
    check_out_method VARCHAR(20),
    work_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    overtime_minutes INTEGER DEFAULT 0,
    late_arrival_minutes INTEGER DEFAULT 0,
    early_leave_minutes INTEGER DEFAULT 0,
    break_duration INTEGER,
    daily_earnings DECIMAL(10,2),
    net_earnings DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    leave_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
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
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
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
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. NOTIFICATIONS TABLE (Bildirimler)
-- =====================================================
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID,
    recipient_type VARCHAR(20),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ADDITIONAL TABLES
-- =====================================================

CREATE TABLE salary_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personnel_id UUID REFERENCES personnel(id) NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    date DATE NOT NULL,
    approved_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE advances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personnel_id UUID REFERENCES personnel(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    request_date DATE NOT NULL,
    approval_date DATE,
    approved_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_personnel_location ON personnel(location_id);
CREATE INDEX idx_personnel_active ON personnel(is_active);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_payroll_date ON payroll(year, month);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON personnel 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION calculate_work_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
        NEW.work_hours = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
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
