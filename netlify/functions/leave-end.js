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
    const { personnelId } = JSON.parse(event.body)

    if (!personnelId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Personnel ID gerekli' 
        })
      }
    }

    await client.connect()

    // İzin bitirme fonksiyonunu çağır
    const result = await client.query(
      `SELECT end_personnel_leave($1) as result`,
      [personnelId]
    )

    const leaveResult = result.rows[0].result

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
        message: leaveResult.message || 'İzin başarıyla sonlandırıldı',
        personnel: personnelQuery.rows[0]
      })
    }

  } catch (error) {
    console.error('Leave end error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'İzin sonlandırılırken hata oluştu' 
      })
    }
  } finally {
    await client.end()
  }
}
