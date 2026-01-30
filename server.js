import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://restaurant_app:RestaurantDB2024Local@localhost:5432/restaurant_tracking',
  ssl: false // Local Docker doesn't need SSL
});

// Middleware
app.use(cors());
app.use(express.json());

// Rewrite /.netlify/functions/* to /api/*
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/')) {
    req.url = req.url.replace('/.netlify/functions/', '/api/');
  }
  next();
});

// Serve static files in production
app.use(express.static(path.join(__dirname, 'dist')));

// ============================================
// AUTH ROUTES
// ============================================

// Admin Login
app.post('/api/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, 'admin']
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Geçersiz email veya şifre' });
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Geçersiz email veya şifre' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: 'admin' },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auth Login (general)
app.post('/api/auth-login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (role === 'admin') {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Geçersiz bilgiler' });
      }
      
      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Geçersiz bilgiler' });
      }
      
      const token = jwt.sign({ id: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: 'admin' }, token });
    }
    
    res.status(400).json({ success: false, error: 'Geçersiz rol' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auth Verify
app.get('/api/auth-verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) return res.status(401).json({ success: false });
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token geçersiz' });
  }
});

// DB Auth Login (Personnel)
app.post('/api/db-auth-login', async (req, res) => {
  try {
    const { personnelNo, password } = req.body;
    
    const result = await pool.query(
      `SELECT p.*, l.name as location_name, l.location_code 
       FROM personnel p 
       LEFT JOIN locations l ON p.location_id = l.id 
       WHERE p.personnel_no = $1 AND p.is_active = true`,
      [personnelNo]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Personel bulunamadı' });
    }
    
    const personnel = result.rows[0];
    const isValid = await bcrypt.compare(password, personnel.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Geçersiz şifre' });
    }
    
    res.json({
      success: true,
      personnel: {
        id: personnel.id,
        personnelNo: personnel.personnel_no,
        name: personnel.name,
        surname: personnel.surname,
        position: personnel.position,
        locationId: personnel.location_id,
        locationName: personnel.location_name,
        shiftStart: personnel.shift_start_time,
        shiftEnd: personnel.shift_end_time
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DASHBOARD & STATS
// ============================================

app.get('/api/get-dashboard-stats', async (req, res) => {
  try {
    const personnel = await pool.query('SELECT * FROM personnel WHERE is_active = true ORDER BY name');
    const locations = await pool.query('SELECT * FROM locations WHERE is_active = true ORDER BY name');
    
    const today = new Date().toISOString().split('T')[0];
    const attendance = await pool.query(
      `SELECT a.*, p.name, p.surname, p.personnel_no 
       FROM attendance a 
       JOIN personnel p ON a.personnel_id = p.id 
       WHERE DATE(a.check_in_time) = $1`,
      [today]
    );
    
    // Calculate average work hours
    const avgHoursResult = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) as avg_hours
       FROM attendance 
       WHERE check_out_time IS NOT NULL 
       AND DATE(check_in_time) >= CURRENT_DATE - INTERVAL '30 days'`
    );
    const avgWorkHours = avgHoursResult.rows[0]?.avg_hours 
      ? parseFloat(avgHoursResult.rows[0].avg_hours).toFixed(1) 
      : '0';
    
    res.json({
      success: true,
      personnel: personnel.rows,
      locations: locations.rows,
      todayAttendance: attendance.rows,
      stats: {
        totalPersonnel: personnel.rows.length,
        totalLocations: locations.rows.length,
        presentToday: attendance.rows.length,
        todayCheckIns: attendance.rows.length,
        avgWorkHours: avgWorkHours
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PERSONNEL ROUTES
// ============================================

app.get('/api/personnel-detail', async (req, res) => {
  try {
    const { id } = req.query;
    
    const result = await pool.query(
      `SELECT p.*, l.name as location_name 
       FROM personnel p 
       LEFT JOIN locations l ON p.location_id = l.id 
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Personel bulunamadı' });
    }
    
    // Get recent attendance
    const attendance = await pool.query(
      `SELECT * FROM attendance WHERE personnel_id = $1 ORDER BY check_in_time DESC LIMIT 30`,
      [id]
    );
    
    res.json({
      success: true,
      personnel: result.rows[0],
      recentAttendance: attendance.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/personnel-delete', async (req, res) => {
  try {
    const { id } = req.body;
    await pool.query('UPDATE personnel SET is_active = false WHERE id = $1', [id]);
    res.json({ success: true, message: 'Personel silindi' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ATTENDANCE ROUTES
// ============================================

app.post('/api/attendance-check', async (req, res) => {
  try {
    const { personnelId, action, locationId } = req.body;
    const now = new Date();
    
    if (action === 'check-in') {
      const result = await pool.query(
        `INSERT INTO attendance (personnel_id, location_id, check_in_time, status) 
         VALUES ($1, $2, $3, 'present') RETURNING *`,
        [personnelId, locationId, now]
      );
      res.json({ success: true, attendance: result.rows[0], message: 'Giriş yapıldı' });
    } else {
      const result = await pool.query(
        `UPDATE attendance SET check_out_time = $1 
         WHERE personnel_id = $2 AND check_out_time IS NULL 
         ORDER BY check_in_time DESC LIMIT 1 RETURNING *`,
        [now, personnelId]
      );
      res.json({ success: true, attendance: result.rows[0], message: 'Çıkış yapıldı' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/db-attendance-check', async (req, res) => {
  try {
    const { personnelId, action, locationId, qrToken } = req.body;
    const now = new Date();
    
    // Get personnel info
    const personnelResult = await pool.query(
      `SELECT p.*, l.name as location_name FROM personnel p 
       LEFT JOIN locations l ON p.location_id = l.id 
       WHERE p.id = $1`,
      [personnelId]
    );
    
    if (personnelResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Personel bulunamadı' });
    }
    
    const personnel = personnelResult.rows[0];
    const effectiveLocationId = locationId || personnel.location_id;
    
    if (action === 'check-in' || action === 'giris') {
      // Check if already checked in today
      const existing = await pool.query(
        `SELECT * FROM attendance WHERE personnel_id = $1 AND DATE(check_in_time) = CURRENT_DATE AND check_out_time IS NULL`,
        [personnelId]
      );
      
      if (existing.rows.length > 0) {
        return res.json({ 
          success: true, 
          alreadyCheckedIn: true,
          attendance: existing.rows[0],
          message: 'Zaten giriş yapılmış'
        });
      }
      
      const result = await pool.query(
        `INSERT INTO attendance (personnel_id, location_id, check_in_time, check_in_method, status) 
         VALUES ($1, $2, $3, 'qr', 'present') RETURNING *`,
        [personnelId, effectiveLocationId, now]
      );
      
      res.json({ 
        success: true, 
        attendance: result.rows[0], 
        message: 'Giriş başarılı',
        personnel: { name: personnel.name, surname: personnel.surname }
      });
    } else {
      // Check out
      const result = await pool.query(
        `UPDATE attendance SET check_out_time = $1, check_out_method = 'qr'
         WHERE personnel_id = $2 AND check_out_time IS NULL AND DATE(check_in_time) = CURRENT_DATE
         RETURNING *`,
        [now, personnelId]
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Önce giriş yapmalısınız' });
      }
      
      res.json({ 
        success: true, 
        attendance: result.rows[0], 
        message: 'Çıkış başarılı',
        personnel: { name: personnel.name, surname: personnel.surname }
      });
    }
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance-list', async (req, res) => {
  try {
    const { personnelId, startDate, endDate, locationId } = req.query;
    
    let query = `
      SELECT a.*, p.name, p.surname, p.personnel_no, l.name as location_name
      FROM attendance a
      JOIN personnel p ON a.personnel_id = p.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (personnelId) {
      query += ` AND a.personnel_id = $${paramIndex++}`;
      params.push(personnelId);
    }
    if (startDate) {
      query += ` AND DATE(a.check_in_time) >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(a.check_in_time) <= $${paramIndex++}`;
      params.push(endDate);
    }
    if (locationId) {
      query += ` AND a.location_id = $${paramIndex++}`;
      params.push(locationId);
    }
    
    query += ' ORDER BY a.check_in_time DESC LIMIT 500';
    
    const result = await pool.query(query, params);
    res.json({ success: true, attendances: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/check-active-status', async (req, res) => {
  try {
    const { personnelId } = req.query;
    
    const result = await pool.query(
      `SELECT * FROM attendance 
       WHERE personnel_id = $1 AND DATE(check_in_time) = CURRENT_DATE AND check_out_time IS NULL`,
      [personnelId]
    );
    
    res.json({
      success: true,
      isActive: result.rows.length > 0,
      activeRecord: result.rows[0] || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// QR CODE ROUTES
// ============================================

app.post('/api/qr-generate', async (req, res) => {
  try {
    const { locationId } = req.body;
    
    // locationId can be UUID or location_code - resolve to UUID
    let actualLocationId = locationId;
    
    // Check if it's not a valid UUID (location_code instead)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(locationId)) {
      // It's a location_code, look up the UUID
      const locationResult = await pool.query(
        'SELECT id FROM locations WHERE location_code = $1',
        [locationId]
      );
      
      if (locationResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Lokasyon bulunamadı' });
      }
      
      actualLocationId = locationResult.rows[0].id;
    }
    
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 90000); // 90 seconds
    
    await pool.query(
      'INSERT INTO qr_codes (location_id, code, expires_at) VALUES ($1, $2, $3)',
      [actualLocationId, token, expiresAt]
    );
    
    const qrDataUrl = await QRCode.toDataURL(token);
    
    res.json({
      success: true,
      qrCode: qrDataUrl,
      token,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/qr-validate', async (req, res) => {
  try {
    const { token } = req.body;
    
    const result = await pool.query(
      `SELECT qr.*, l.name as location_name, l.id as location_id 
       FROM qr_codes qr 
       JOIN locations l ON qr.location_id = l.id 
       WHERE qr.code = $1 AND qr.expires_at > NOW() AND qr.is_used = false`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'QR kod geçersiz veya süresi dolmuş' });
    }
    
    res.json({
      success: true,
      valid: true,
      locationId: result.rows[0].location_id,
      locationName: result.rows[0].location_name
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// LOCATION ROUTES
// ============================================

app.delete('/api/location-delete', async (req, res) => {
  try {
    const { id } = req.body;
    await pool.query('UPDATE locations SET is_active = false WHERE id = $1', [id]);
    res.json({ success: true, message: 'Lokasyon silindi' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PAYROLL ROUTES
// ============================================

app.get('/api/payroll-list', async (req, res) => {
  try {
    const { month, year, personnelId } = req.query;
    
    let query = `
      SELECT p.*, per.name, per.surname, per.personnel_no 
      FROM payroll p 
      JOIN personnel per ON p.personnel_id = per.id 
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    
    if (month) { query += ` AND p.month = $${idx++}`; params.push(month); }
    if (year) { query += ` AND p.year = $${idx++}`; params.push(year); }
    if (personnelId) { query += ` AND p.personnel_id = $${idx++}`; params.push(personnelId); }
    
    query += ' ORDER BY p.year DESC, p.month DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, payrolls: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/payroll-calculate', async (req, res) => {
  try {
    const { personnelId, month, year } = req.body;
    
    // Get personnel salary info
    const personnel = await pool.query('SELECT * FROM personnel WHERE id = $1', [personnelId]);
    if (personnel.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Personel bulunamadı' });
    }
    
    const p = personnel.rows[0];
    
    // Calculate work days from attendance
    const attendance = await pool.query(
      `SELECT COUNT(*) as work_days, 
              SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) as total_hours
       FROM attendance 
       WHERE personnel_id = $1 AND EXTRACT(MONTH FROM check_in_time) = $2 AND EXTRACT(YEAR FROM check_in_time) = $3`,
      [personnelId, month, year]
    );
    
    const workDays = parseInt(attendance.rows[0].work_days) || 0;
    const totalHours = parseFloat(attendance.rows[0].total_hours) || 0;
    const baseSalary = parseFloat(p.monthly_salary) || 0;
    
    // Check if payroll exists
    const existing = await pool.query(
      'SELECT * FROM payroll WHERE personnel_id = $1 AND month = $2 AND year = $3',
      [personnelId, month, year]
    );
    
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE payroll SET total_work_days = $1, total_work_hours = $2, base_salary = $3, net_salary = $3, updated_at = NOW()
         WHERE personnel_id = $4 AND month = $5 AND year = $6 RETURNING *`,
        [workDays, totalHours, baseSalary, personnelId, month, year]
      );
    } else {
      result = await pool.query(
        `INSERT INTO payroll (personnel_id, month, year, total_work_days, total_work_hours, base_salary, net_salary)
         VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
        [personnelId, month, year, workDays, totalHours, baseSalary]
      );
    }
    
    res.json({ success: true, payroll: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/payroll-approve', async (req, res) => {
  try {
    const { payrollId, status } = req.body;
    
    const result = await pool.query(
      `UPDATE payroll SET status = $1, payment_date = CASE WHEN $1 = 'paid' THEN CURRENT_DATE ELSE payment_date END
       WHERE id = $2 RETURNING *`,
      [status, payrollId]
    );
    
    res.json({ success: true, payroll: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// LEAVE & ABSENCE ROUTES
// ============================================

app.get('/api/leave-management', async (req, res) => {
  try {
    const { personnelId } = req.query;
    
    let query = 'SELECT * FROM leaves WHERE 1=1';
    const params = [];
    
    if (personnelId) {
      query += ' AND personnel_id = $1';
      params.push(personnelId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, leaves: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/leave-management', async (req, res) => {
  try {
    const { personnelId, leaveType, startDate, endDate, reason, action, leaveId, status } = req.body;
    
    if (action === 'create') {
      const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      const result = await pool.query(
        `INSERT INTO leaves (personnel_id, leave_type, start_date, end_date, total_days, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
        [personnelId, leaveType, startDate, endDate, totalDays, reason]
      );
      return res.json({ success: true, leave: result.rows[0] });
    }
    
    if (action === 'update' && leaveId) {
      const result = await pool.query(
        'UPDATE leaves SET status = $1, approved_at = NOW() WHERE id = $2 RETURNING *',
        [status, leaveId]
      );
      return res.json({ success: true, leave: result.rows[0] });
    }
    
    res.status(400).json({ success: false, error: 'Geçersiz işlem' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/absence-management', async (req, res) => {
  try {
    const { personnelId } = req.query;
    // For now, return empty - can be expanded
    res.json({ success: true, absences: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/absence-management', async (req, res) => {
  try {
    res.json({ success: true, message: 'İşlem tamamlandı' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SALARY ADJUSTMENT ROUTES
// ============================================

app.get('/api/get-adjustments', async (req, res) => {
  try {
    const { personnelId } = req.query;
    
    const result = await pool.query(
      'SELECT * FROM salary_adjustments WHERE personnel_id = $1 ORDER BY created_at DESC',
      [personnelId]
    );
    
    res.json({ success: true, adjustments: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/salary-adjustment', async (req, res) => {
  try {
    const { personnelId, adjustmentType, amount, reason, date } = req.body;
    
    const result = await pool.query(
      `INSERT INTO salary_adjustments (personnel_id, adjustment_type, amount, reason, date, status)
       VALUES ($1, $2, $3, $4, $5, 'approved') RETURNING *`,
      [personnelId, adjustmentType, amount, reason, date || new Date()]
    );
    
    res.json({ success: true, adjustment: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADVANCE ROUTES
// ============================================

app.get('/api/advance-manage', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, p.name, p.surname, p.personnel_no 
       FROM advances a 
       JOIN personnel p ON a.personnel_id = p.id 
       ORDER BY a.created_at DESC`
    );
    res.json({ success: true, advances: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// REPORT ROUTES
// ============================================

app.get('/api/reports-attendance', async (req, res) => {
  try {
    const { startDate, endDate, locationId } = req.query;
    
    let query = `
      SELECT a.*, p.name, p.surname, p.personnel_no, l.name as location_name
      FROM attendance a
      JOIN personnel p ON a.personnel_id = p.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;
    
    if (startDate) { query += ` AND DATE(a.check_in_time) >= $${idx++}`; params.push(startDate); }
    if (endDate) { query += ` AND DATE(a.check_in_time) <= $${idx++}`; params.push(endDate); }
    if (locationId) { query += ` AND a.location_id = $${idx++}`; params.push(locationId); }
    
    query += ' ORDER BY a.check_in_time DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports-personnel', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, l.name as location_name,
             (SELECT COUNT(*) FROM attendance WHERE personnel_id = p.id) as total_attendance
      FROM personnel p
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE p.is_active = true
      ORDER BY p.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports-location', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, 
             (SELECT COUNT(*) FROM personnel WHERE location_id = l.id AND is_active = true) as personnel_count
      FROM locations l
      WHERE l.is_active = true
      ORDER BY l.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Server running on http://localhost:${PORT}
📡 API: http://localhost:${PORT}/api/
🏥 Health: http://localhost:${PORT}/health
  `);
});
