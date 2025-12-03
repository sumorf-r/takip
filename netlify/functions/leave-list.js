const { Client } = require('pg')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()

    const { personnelId } = event.queryStringParameters || {}

    let query, params

    if (personnelId) {
      // Belirli bir personelin izin geçmişi
      query = `
        SELECT 
          lh.*,
          p.personnel_no,
          p.name || ' ' || p.surname as personnel_name,
          p.position
        FROM leave_history lh
        JOIN personnel p ON lh.personnel_id = p.id
        WHERE lh.personnel_id = $1
        ORDER BY lh.created_at DESC
      `
      params = [personnelId]
    } else {
      // Tüm izin geçmişi
      query = `
        SELECT 
          lh.*,
          p.personnel_no,
          p.name || ' ' || p.surname as personnel_name,
          p.position
        FROM leave_history lh
        JOIN personnel p ON lh.personnel_id = p.id
        ORDER BY lh.created_at DESC
        LIMIT 100
      `
      params = []
    }

    const result = await client.query(query, params)

    // İstatistikler
    const statsQuery = await client.query(`
      SELECT 
        COUNT(*) as total_leaves,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'approved' THEN leave_days ELSE 0 END) as total_approved_days
      FROM leave_history
      ${personnelId ? 'WHERE personnel_id = $1' : ''}
    `, personnelId ? [personnelId] : [])

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        leaves: result.rows,
        stats: statsQuery.rows[0]
      })
    }

  } catch (error) {
    console.error('Leave list error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'İzin geçmişi yüklenirken hata oluştu' 
      })
    }
  } finally {
    await client.end()
  }
}
