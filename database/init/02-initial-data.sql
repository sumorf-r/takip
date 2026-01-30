-- Initial Data for Restaurant Personnel Tracking System

-- Insert Locations
INSERT INTO locations (location_code, name, address, phone, city, district) VALUES
('cengelkoy', 'Çengelköy Şubesi', 'Çengelköy, İstanbul', '0216 123 4567', 'İstanbul', 'Üsküdar'),
('kadikoy', 'Kadıköy Şubesi', 'Kadıköy, İstanbul', '0216 234 5678', 'İstanbul', 'Kadıköy'),
('besiktas', 'Beşiktaş Şubesi', 'Beşiktaş, İstanbul', '0212 345 6789', 'İstanbul', 'Beşiktaş');

-- Insert Admin User 
-- Email: admin@restaurant.com
-- Password: admin123
-- Hash generated with: bcrypt.hashSync('admin123', 10)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@restaurant.com', '$2a$10$yNGApGwl8xaPWdgsWRpGg.G7u.r2xGREMYlDFvMdKmgIYCh46CE5G', 'Admin User', 'admin');

-- Insert Sample Personnel with passwords
-- All personnel passwords are: 123456
INSERT INTO personnel (
    personnel_no, 
    name, 
    surname, 
    position, 
    department, 
    location_id,
    password_hash,
    monthly_salary,
    daily_wage,
    hourly_wage,
    minute_wage,
    shift_start_time,
    shift_end_time
) VALUES
(
    'P001', 
    'Ahmet', 
    'Yılmaz', 
    'Garson', 
    'Servis', 
    (SELECT id FROM locations WHERE location_code = 'cengelkoy'),
    '$2a$10$YF8s5rqGkYHZBQVmR2xHZOzKxH5N0KQ7Xv4dT9yN8rGKmH5xYnH5W',
    17000.00,
    566.67,
    23.61,
    0.39,
    '09:00:00',
    '18:00:00'
),
(
    'P002', 
    'Ayşe', 
    'Demir', 
    'Komi', 
    'Servis', 
    (SELECT id FROM locations WHERE location_code = 'cengelkoy'),
    '$2a$10$YF8s5rqGkYHZBQVmR2xHZOzKxH5N0KQ7Xv4dT9yN8rGKmH5xYnH5W',
    15000.00,
    500.00,
    20.83,
    0.35,
    '10:00:00',
    '19:00:00'
),
(
    'P003', 
    'Mehmet', 
    'Kaya', 
    'Aşçı', 
    'Mutfak', 
    (SELECT id FROM locations WHERE location_code = 'kadikoy'),
    '$2a$10$YF8s5rqGkYHZBQVmR2xHZOzKxH5N0KQ7Xv4dT9yN8rGKmH5xYnH5W',
    20000.00,
    666.67,
    27.78,
    0.46,
    '08:00:00',
    '17:00:00'
),
(
    'P004', 
    'Fatma', 
    'Öz', 
    'Kasa', 
    'Muhasebe', 
    (SELECT id FROM locations WHERE location_code = 'besiktas'),
    '$2a$10$YF8s5rqGkYHZBQVmR2xHZOzKxH5N0KQ7Xv4dT9yN8rGKmH5xYnH5W',
    18000.00,
    600.00,
    25.00,
    0.42,
    '09:00:00',
    '18:00:00'
);
