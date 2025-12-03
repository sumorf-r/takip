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
    const { personnelId, startDate, endDate, leaveType = 'annual', reason } = JSON.parse(event.body)

    if (!personnelId || !startDate || !endDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Personnel ID, başlangıç ve bitiş tarihi gerekli' 
        })
      }
    }

    await client.connect()

    // İzin başlatma fonksiyonunu çağır
    const result = await client.query(
      `SELECT start_personnel_leave($1, $2, $3, $4, $5) as result`,
      [personnelId, startDate, endDate, leaveType, reason]
    )

    const leaveResult = result.rows[0].result

    if (!leaveResult.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: leaveResult.error || 'İzin başlatılamadı',
          remaining_days: leaveResult.remaining_days,
          requested_days: leaveResult.requested_days
        })
      }
    }

    // Personel bilgilerini al
    const personnelQuery = await client.query(
      `SELECT 
        id,
        personnel_no,
        name || ' ' || surname as full_name,
        monthly_leave_days,
        remaining_leave_days,
        on_leave,
        current_leave_start,
        current_leave_end
      FROM personnel 
      WHERE id = $1`,
      [personnelId]
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'İzin başarıyla başlatıldı',
        leave_id: leaveResult.leave_id,
        leave_days: leaveResult.leave_days,
        remaining_days: leaveResult.remaining_days,
        personnel: personnelQuery.rows[0]
      })
    }

  } catch (error) {
    console.error('Leave start error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'İzin başlatılırken hata oluştu' 
      })
    }
  } finally {
    await client.end()
  }
}
