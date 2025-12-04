const { Client } = require('pg')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
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
      payrollId, 
      action, // 'approve', 'pay', 'cancel'
      approvedBy,
      paymentDate,
      paymentMethod,
      notes
    } = JSON.parse(event.body)

    if (!payrollId || !action || !approvedBy) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'payrollId, action ve approvedBy gerekli'
        })
      }
    }

    await client.connect()

    // Bordro kaydını getir
    const payrollResult = await client.query(
      `SELECT p.*, per.name || ' ' || per.surname as personnel_name
       FROM payroll p
       JOIN personnel per ON p.personnel_id = per.id
       WHERE p.id = $1`,
      [payrollId]
    )

    if (payrollResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Bordro kaydı bulunamadı'
        })
      }
    }

    const payroll = payrollResult.rows[0]

    await client.query('BEGIN')

    let newStatus = payroll.status
    let paymentStatus = payroll.payment_status
    let updateFields = []
    let actionMessage = ''

    try {
      switch (action) {
        case 'approve':
          if (payroll.status === 'calculated') {
            newStatus = 'approved'
            updateFields.push('approved_by = $1', 'approved_at = CURRENT_TIMESTAMP')
            actionMessage = 'Bordro onaylandı'
          } else {
            throw new Error('Sadece hesaplanmış bordrolar onaylanabilir')
          }
          break

        case 'pay':
          if (payroll.status === 'approved') {
            newStatus = 'paid'
            paymentStatus = 'paid'
            updateFields.push(
              'payment_status = $2',
              'payment_date = $3',
              'payment_method = $4'
            )
            
            // Avansları kapat
            await client.query(
              `UPDATE advance_payments 
               SET deduction_status = 'completed',
                   deducted_from_payroll = $1,
                   deduction_date = CURRENT_DATE
               WHERE personnel_id = $2
               AND status = 'paid'
               AND deduction_status = 'pending'`,
              [payrollId, payroll.personnel_id]
            )
            
            actionMessage = 'Bordro ödendi ve avanslar kapatıldı'
          } else {
            throw new Error('Sadece onaylanmış bordrolar ödenebilir')
          }
          break

        case 'cancel':
          newStatus = 'cancelled'
          updateFields.push('notes = $5')
          actionMessage = 'Bordro iptal edildi'
          break

        default:
          throw new Error('Geçersiz aksiyon')
      }

      // Bordroyu güncelle
      let updateQuery = `
        UPDATE payroll 
        SET status = '${newStatus}',
            updated_at = CURRENT_TIMESTAMP
      `
      
      if (updateFields.length > 0) {
        updateQuery += ', ' + updateFields.join(', ')
      }
      
      updateQuery += ' WHERE id = $${updateFields.length + 1}'

      const updateParams = [approvedBy]
      if (action === 'pay') {
        updateParams.push(paymentStatus, paymentDate || new Date(), paymentMethod || 'bank_transfer')
      }
      if (action === 'cancel') {
        updateParams.push(notes || 'İptal edildi')
      }
      updateParams.push(payrollId)

      // Parametreleri düzelt
      updateQuery = `
        UPDATE payroll 
        SET status = $${updateParams.length},
            updated_at = CURRENT_TIMESTAMP
      `
      
      let paramIndex = 1
      if (action === 'approve') {
        updateQuery += `, approved_by = $${paramIndex}, approved_at = CURRENT_TIMESTAMP`
        paramIndex++
      } else if (action === 'pay') {
        updateQuery += `, approved_by = $${paramIndex}, approved_at = CURRENT_TIMESTAMP, payment_status = $${paramIndex + 1}, payment_date = $${paramIndex + 2}, payment_method = $${paramIndex + 3}`
        paramIndex += 4
      } else if (action === 'cancel') {
        updateQuery += `, notes = $${paramIndex}`
        paramIndex++
      }
      
      updateQuery += ` WHERE id = $${paramIndex}`
      
      const finalParams = [approvedBy]
      if (action === 'pay') {
        finalParams.push(paymentStatus, paymentDate || new Date(), paymentMethod || 'bank_transfer')
      } else if (action === 'cancel') {
        finalParams.push(notes || 'İptal edildi')
      }
      finalParams.push(newStatus, payrollId)

      await client.query(
        `UPDATE payroll 
         SET status = $1,
             approved_by = $2,
             approved_at = CURRENT_TIMESTAMP,
             ${action === 'pay' ? 'payment_status = $3, payment_date = $4, payment_method = $5,' : ''}
             ${action === 'cancel' ? 'notes = $3,' : ''}
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $${action === 'pay' ? 6 : action === 'cancel' ? 4 : 3}`,
        action === 'pay' 
          ? [newStatus, approvedBy, paymentStatus, paymentDate || new Date(), paymentMethod || 'bank_transfer', payrollId]
          : action === 'cancel'
          ? [newStatus, approvedBy, notes || 'İptal edildi', payrollId]
          : [newStatus, approvedBy, payrollId]
      )

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          approvedBy,
          `payroll_${action}`,
          'payroll',
          payrollId,
          JSON.stringify({
            personnel: payroll.personnel_name,
            period: `${payroll.period_year}-${payroll.period_month}`,
            net_salary: payroll.net_salary
          })
        ]
      )

      await client.query('COMMIT')

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: actionMessage
        })
      }

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Payroll approve error:', error)
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
