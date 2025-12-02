// Real Database Attendance Check-in/Check-out
import { db, sql } from '../../src/lib/db.js'

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { qrCode, personnelId, locationId } = JSON.parse(event.body)
    
    // Start transaction
    const result = await db.transaction(async (client) => {
      
      // 1. Validate QR Code
      const qrQuery = await client.query(
        'SELECT * FROM qr_codes WHERE code = $1 AND expires_at > NOW() AND is_used = false',
        [qrCode]
      )
      
      if (qrQuery.rows.length === 0) {
        throw new Error('QR kod geçersiz veya süresi dolmuş')
      }
      
      const qrRecord = qrQuery.rows[0]
      
      // 2. Check if personnel has open attendance
      const openAttendanceQuery = await client.query(
        `SELECT * FROM attendance 
         WHERE personnel_id = $1 
         AND check_out_time IS NULL 
         AND DATE(check_in_time) = CURRENT_DATE
         ORDER BY check_in_time DESC 
         LIMIT 1`,
        [personnelId]
      )
      
      const hasOpenAttendance = openAttendanceQuery.rows.length > 0
      let attendanceRecord
      
      if (hasOpenAttendance) {
        // Check-out operation
        const attendance = openAttendanceQuery.rows[0]
        
        // Calculate work hours
        const checkOutTime = new Date()
        const checkInTime = new Date(attendance.check_in_time)
        const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60) // Convert to hours
        
        // Update attendance record
        const updateQuery = await client.query(
          `UPDATE attendance 
           SET check_out_time = NOW(), 
               check_out_method = 'qr',
               work_hours = $1,
               status = CASE 
                 WHEN $1 >= 8 THEN 'present'
                 WHEN $1 >= 4 THEN 'half_day'
                 ELSE 'early_leave'
               END,
               updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [workHours.toFixed(2), attendance.id]
        )
        
        attendanceRecord = updateQuery.rows[0]
        
        // Log the action
        await client.query(
          'INSERT INTO audit_logs (personnel_id, action, table_name, record_id) VALUES ($1, $2, $3, $4)',
          [personnelId, 'check_out', 'attendance', attendance.id]
        )
        
      } else {
        // Check-in operation
        
        // Get work schedule if exists
        const scheduleQuery = await client.query(
          'SELECT * FROM work_schedules WHERE personnel_id = $1 AND date = CURRENT_DATE',
          [personnelId]
        )
        
        let status = 'present'
        if (scheduleQuery.rows.length > 0) {
          const schedule = scheduleQuery.rows[0]
          const now = new Date()
          const scheduledStart = new Date()
          const [hours, minutes] = schedule.shift_start.split(':')
          scheduledStart.setHours(hours, minutes, 0)
          
          // Check if late (more than 15 minutes)
          const diffMinutes = (now - scheduledStart) / (1000 * 60)
          if (diffMinutes > 15) {
            status = 'late'
          }
        }
        
        // Create new attendance record
        const insertQuery = await client.query(
          `INSERT INTO attendance (
            personnel_id, 
            location_id, 
            check_in_time, 
            qr_code_id,
            check_in_method,
            status,
            ip_address,
            device_info
          ) VALUES ($1, $2, NOW(), $3, 'qr', $4, $5, $6)
          RETURNING *`,
          [
            personnelId, 
            locationId || qrRecord.location_id,
            qrRecord.id,
            status,
            event.headers['x-forwarded-for'] || event.headers['client-ip'],
            event.headers['user-agent']
          ]
        )
        
        attendanceRecord = insertQuery.rows[0]
        
        // Log the action
        await client.query(
          'INSERT INTO audit_logs (personnel_id, action, table_name, record_id) VALUES ($1, $2, $3, $4)',
          [personnelId, 'check_in', 'attendance', attendanceRecord.id]
        )
      }
      
      // 3. Mark QR code as used
      await client.query(
        'UPDATE qr_codes SET is_used = true, used_by = $1, used_at = NOW() WHERE id = $2',
        [personnelId, qrRecord.id]
      )
      
      // 4. Get personnel info for response
      const personnelQuery = await client.query(
        'SELECT name, surname, position FROM personnel WHERE id = $1',
        [personnelId]
      )
      
      const personnel = personnelQuery.rows[0]
      
      // 5. Create notification
      await client.query(
        `INSERT INTO notifications (
          recipient_id, 
          recipient_type, 
          title, 
          message, 
          type
        ) VALUES ($1, 'personnel', $2, $3, 'success')`,
        [
          personnelId,
          hasOpenAttendance ? 'Çıkış Yapıldı' : 'Giriş Yapıldı',
          hasOpenAttendance 
            ? `Çıkış saatiniz: ${new Date().toLocaleTimeString('tr-TR')}`
            : `Giriş saatiniz: ${new Date().toLocaleTimeString('tr-TR')}`
        ]
      )
      
      return {
        attendance: attendanceRecord,
        personnel,
        action: hasOpenAttendance ? 'check-out' : 'check-in'
      }
    })
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        action: result.action,
        attendance: result.attendance,
        personnel: result.personnel,
        message: `${result.action === 'check-in' ? 'Giriş' : 'Çıkış'} başarıyla kaydedildi`
      })
    }
    
  } catch (error) {
    console.error('Attendance check error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'İşlem başarısız'
      })
    }
  }
}
