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
    const { adjustmentId, action, approvedBy } = JSON.parse(event.body)

    // Validasyon
    if (!adjustmentId || !action || !approvedBy) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'adjustmentId, action ve approvedBy gerekli'
        })
      }
    }

    if (action !== 'approve' && action !== 'reject') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Geçersiz aksiyon (approve/reject)'
        })
      }
    }

    await client.connect()

    // Düzeltme kaydını getir
    const adjustmentResult = await client.query(
      `SELECT * FROM salary_adjustments WHERE id = $1`,
      [adjustmentId]
    )

    if (adjustmentResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Düzeltme kaydı bulunamadı'
        })
      }
    }

    const adjustment = adjustmentResult.rows[0]

    if (adjustment.status !== 'pending') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Bu düzeltme zaten işlenmiş'
        })
      }
    }

    // Transaction başlat
    await client.query('BEGIN')

    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'

      // Düzeltme durumunu güncelle
      await client.query(
        `UPDATE salary_adjustments 
         SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newStatus, approvedBy, adjustmentId]
      )

      // Eğer onaylanmışsa ve attendance_id varsa, kazancı güncelle
      if (action === 'approve' && adjustment.attendance_id) {
        let updateAmount = adjustment.amount
        
        // Ceza ise negatif yap
        if (adjustment.adjustment_type === 'penalty') {
          updateAmount = -Math.abs(adjustment.amount)
        } else if (['bonus', 'refund', 'correction'].includes(adjustment.adjustment_type)) {
          updateAmount = Math.abs(adjustment.amount)
        }

        await client.query(
          `UPDATE attendance 
           SET net_earnings = COALESCE(net_earnings, 0) + $1
           WHERE id = $2`,
          [updateAmount, adjustment.attendance_id]
        )
      }

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          approvedBy,
          `salary_adjustment_${action}`,
          'salary_adjustments',
          adjustmentId,
          JSON.stringify({
            adjustment_type: adjustment.adjustment_type,
            amount: adjustment.amount,
            status: newStatus
          })
        ]
      )

      await client.query('COMMIT')

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: action === 'approve' ? 'Düzeltme onaylandı' : 'Düzeltme reddedildi'
        })
      }

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Approve adjustment error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Onaylama işlemi başarısız'
      })
    }
  } finally {
    await client.end()
  }
}
