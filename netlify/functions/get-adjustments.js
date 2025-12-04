const { Client } = require('pg')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
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
    const { personnelId, status } = event.queryStringParameters || {}

    await client.connect()

    let query = `
      SELECT 
        sa.id,
        sa.personnel_id,
        sa.attendance_id,
        sa.adjustment_type,
        sa.amount,
        sa.reason,
        sa.status,
        sa.created_at,
        sa.approved_at,
        p.name || ' ' || p.surname as personnel_name,
        creator.email as created_by_email,
        approver.email as approved_by_email,
        a.check_in_time as attendance_date
      FROM salary_adjustments sa
      JOIN personnel p ON sa.personnel_id = p.id
      LEFT JOIN users creator ON sa.created_by = creator.id
      LEFT JOIN users approver ON sa.approved_by = approver.id
      LEFT JOIN attendance a ON sa.attendance_id = a.id
      WHERE 1=1
    `

    const params = []
    let paramCount = 1

    if (personnelId) {
      query += ` AND sa.personnel_id = $${paramCount}`
      params.push(personnelId)
      paramCount++
    }

    if (status) {
      query += ` AND sa.status = $${paramCount}`
      params.push(status)
      paramCount++
    }

    query += ' ORDER BY sa.created_at DESC'

    const result = await client.query(query, params)

    // Toplam tutarları hesapla
    const summary = {
      total_refunds: 0,
      total_penalties: 0,
      total_bonuses: 0,
      pending_count: 0,
      approved_count: 0
    }

    result.rows.forEach(row => {
      if (row.adjustment_type === 'refund' && row.status === 'approved') {
        summary.total_refunds += parseFloat(row.amount)
      } else if (row.adjustment_type === 'penalty' && row.status === 'approved') {
        summary.total_penalties += parseFloat(row.amount)
      } else if (row.adjustment_type === 'bonus' && row.status === 'approved') {
        summary.total_bonuses += parseFloat(row.amount)
      }

      if (row.status === 'pending') summary.pending_count++
      if (row.status === 'approved') summary.approved_count++
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        adjustments: result.rows,
        summary
      })
    }

  } catch (error) {
    console.error('Get adjustments error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Düzeltmeler getirilemedi'
      })
    }
  } finally {
    await client.end()
  }
}
