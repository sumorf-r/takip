const { Client } = require('pg')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const { personnelId, monthlyLeaveDays, remainingLeaveDays } = JSON.parse(event.body)

    if (!personnelId || monthlyLeaveDays === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Personnel ID ve aylık izin günü gerekli' 
        })
      }
    }

    await client.connect()

    // İzin hakkını güncelle
    const updateQuery = `
      UPDATE personnel 
      SET 
        monthly_leave_days = $1,
        remaining_leave_days = COALESCE($2, monthly_leave_days),
        updated_at = NOW()
      WHERE id = $3
      RETURNING 
        id,
        personnel_no,
        name || ' ' || surname as full_name,
        monthly_leave_days,
        remaining_leave_days,
        on_leave
    `

    const result = await client.query(updateQuery, [
      monthlyLeaveDays,
      remainingLeaveDays !== undefined ? remainingLeaveDays : null,
      personnelId
    ])

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Personel bulunamadı' 
        })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'İzin hakkı güncellendi',
        personnel: result.rows[0]
      })
    }

  } catch (error) {
    console.error('Leave update error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'İzin güncellenirken hata oluştu' 
      })
    }
  } finally {
    await client.end()
  }
}
