const { Client } = require('pg')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()

    // GET - Avans listesi
    if (event.httpMethod === 'GET') {
      const { personnelId, status } = event.queryStringParameters || {}

      let query = `
        SELECT 
          ap.id,
          ap.personnel_id,
          p.name || ' ' || p.surname as personnel_name,
          p.personnel_no,
          ap.request_date,
          ap.amount,
          ap.reason,
          ap.status,
          ap.approved_by,
          ap.approved_at,
          ap.payment_date,
          ap.payment_method,
          ap.deduction_status,
          ap.deducted_from_payroll,
          ap.deduction_date,
          ap.created_at
        FROM advance_payments ap
        JOIN personnel p ON ap.personnel_id = p.id
        WHERE 1=1
      `

      const params = []
      let paramCount = 1

      if (personnelId) {
        query += ` AND ap.personnel_id = $${paramCount}`
        params.push(personnelId)
        paramCount++
      }

      if (status) {
        query += ` AND ap.status = $${paramCount}`
        params.push(status)
        paramCount++
      }

      query += ' ORDER BY ap.request_date DESC'

      const result = await client.query(query, params)

      // İstatistikler
      const stats = {
        total_advances: result.rows.length,
        total_amount: 0,
        pending_count: 0,
        approved_count: 0,
        paid_count: 0,
        pending_deduction: 0
      }

      result.rows.forEach(row => {
        stats.total_amount += parseFloat(row.amount || 0)
        if (row.status === 'pending') stats.pending_count++
        if (row.status === 'approved') stats.approved_count++
        if (row.status === 'paid') stats.paid_count++
        if (row.deduction_status === 'pending') stats.pending_deduction += parseFloat(row.amount || 0)
      })

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          advances: result.rows,
          stats
        })
      }
    }

    // POST - Avans talebi veya onay/red
    if (event.httpMethod === 'POST') {
      const { 
        action, // 'request', 'approve', 'reject', 'pay'
        personnelId,
        amount,
        reason,
        advanceId,
        approvedBy,
        paymentDate,
        paymentMethod
      } = JSON.parse(event.body)

      if (!action) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'action gerekli'
          })
        }
      }

      switch (action) {
        case 'request':
          // Yeni avans talebi
          if (!personnelId || !amount || !reason) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'personnelId, amount ve reason gerekli'
              })
            }
          }

          // Personel maaşını kontrol et (maksimum %50)
          const personnelCheck = await client.query(
            'SELECT monthly_salary FROM personnel WHERE id = $1',
            [personnelId]
          )

          if (personnelCheck.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'Personel bulunamadı'
              })
            }
          }

          const monthlySalary = parseFloat(personnelCheck.rows[0].monthly_salary || 0)
          const maxAdvance = monthlySalary * 0.5

          if (amount > maxAdvance) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: `Avans tutarı maaşın %50'sini (${maxAdvance.toFixed(2)} ₺) aşamaz`
              })
            }
          }

          const insertResult = await client.query(
            `INSERT INTO advance_payments 
             (personnel_id, amount, reason, status, requested_by)
             VALUES ($1, $2, $3, 'pending', $4)
             RETURNING id`,
            [personnelId, amount, reason, personnelId]
          )

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Avans talebi oluşturuldu',
              advanceId: insertResult.rows[0].id
            })
          }

        case 'approve':
        case 'reject':
          if (!advanceId || !approvedBy) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'advanceId ve approvedBy gerekli'
              })
            }
          }

          const newStatus = action === 'approve' ? 'approved' : 'rejected'

          await client.query(
            `UPDATE advance_payments 
             SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [newStatus, approvedBy, advanceId]
          )

          // Audit log
          await client.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id)
             VALUES ($1, $2, $3, $4)`,
            [approvedBy, `advance_${action}`, 'advance_payments', advanceId]
          )

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: action === 'approve' ? 'Avans onaylandı' : 'Avans reddedildi'
            })
          }

        case 'pay':
          if (!advanceId || !approvedBy) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'advanceId ve approvedBy gerekli'
              })
            }
          }

          await client.query(
            `UPDATE advance_payments 
             SET status = 'paid',
                 payment_date = $1,
                 payment_method = $2
             WHERE id = $3`,
            [paymentDate || new Date(), paymentMethod || 'bank_transfer', advanceId]
          )

          // Audit log
          await client.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id)
             VALUES ($1, $2, $3, $4)`,
            [approvedBy, 'advance_pay', 'advance_payments', advanceId]
          )

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Avans ödendi'
            })
          }

        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Geçersiz aksiyon'
            })
          }
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Advance management error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'İşlem başarısız'
      })
    }
  } finally {
    await client.end()
  }
}
