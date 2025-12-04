const { Client } = require('pg')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    }
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const { 
      personnelId, 
      attendanceId, 
      adjustmentType, 
      amount, 
      reason,
      createdBy,
      autoApprove = false
    } = JSON.parse(event.body)

    // Validasyon
    if (!personnelId || !adjustmentType || !amount || !reason || !createdBy) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Tüm alanlar zorunludur'
        })
      }
    }

    // adjustment_type kontrolü
    const validTypes = ['refund', 'penalty', 'bonus', 'correction']
    if (!validTypes.includes(adjustmentType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Geçersiz düzeltme tipi'
        })
      }
    }

    await client.connect()

    // Personel kontrolü
    const personnelCheck = await client.query(
      'SELECT id, name, surname FROM personnel WHERE id = $1',
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

    // Attendance kontrolü (eğer verilmişse)
    if (attendanceId) {
      const attendanceCheck = await client.query(
        'SELECT id FROM attendance WHERE id = $1 AND personnel_id = $2',
        [attendanceId, personnelId]
      )

      if (attendanceCheck.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Devamsızlık kaydı bulunamadı'
          })
        }
      }
    }

    // Düzeltme kaydı oluştur
    const status = autoApprove ? 'approved' : 'pending'
    const approvedBy = autoApprove ? createdBy : null
    const approvedAt = autoApprove ? 'CURRENT_TIMESTAMP' : null

    const insertQuery = `
      INSERT INTO salary_adjustments 
      (personnel_id, attendance_id, adjustment_type, amount, reason, status, created_by, approved_by, approved_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${autoApprove ? 'CURRENT_TIMESTAMP' : 'NULL'})
      RETURNING *
    `

    const result = await client.query(insertQuery, [
      personnelId,
      attendanceId || null,
      adjustmentType,
      amount,
      reason,
      status,
      createdBy,
      approvedBy
    ])

    // Eğer onaylanmışsa ve attendance_id varsa, kazancı güncelle
    if (autoApprove && attendanceId) {
      let updateAmount = amount
      
      // Ceza ise negatif yap
      if (adjustmentType === 'penalty') {
        updateAmount = -Math.abs(amount)
      } else if (adjustmentType === 'bonus' || adjustmentType === 'refund') {
        updateAmount = Math.abs(amount)
      }

      await client.query(
        `UPDATE attendance 
         SET net_earnings = COALESCE(net_earnings, 0) + $1
         WHERE id = $2`,
        [updateAmount, attendanceId]
      )
    }

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        createdBy,
        'salary_adjustment_create',
        'salary_adjustments',
        result.rows[0].id,
        JSON.stringify({
          personnel_id: personnelId,
          type: adjustmentType,
          amount: amount,
          status: status
        })
      ]
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: autoApprove ? 'Düzeltme uygulandı' : 'Düzeltme onay bekliyor',
        adjustment: result.rows[0]
      })
    }

  } catch (error) {
    console.error('Salary adjustment error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Düzeltme işlemi başarısız'
      })
    }
  } finally {
    await client.end()
  }
}
