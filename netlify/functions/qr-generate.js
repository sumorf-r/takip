const { Client } = require('pg')
const crypto = require('crypto')

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
    const { locationId } = JSON.parse(event.body)

    if (!locationId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Location ID gerekli' 
        })
      }
    }

    await client.connect()

    // Location code'dan gerçek location ID'yi bul
    let realLocationId = locationId;
    
    // Eğer locationId bir UUID değilse, location_code olarak ara
    if (!locationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const locationResult = await client.query(
        'SELECT id FROM locations WHERE location_code = $1',
        [locationId]
      )
      
      if (locationResult.rows.length > 0) {
        realLocationId = locationResult.rows[0].id
      } else {
        // Location bulunamadı, default location oluştur veya hata ver
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'Location not found: ' + locationId 
          })
        }
      }
    }

    // Benzersiz token oluştur (32 karakter)
    const token = crypto.randomBytes(16).toString('hex')
    
    // Token'ı database'e kaydet (5 dakika geçerli)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 dakika sonra
    
    const result = await client.query(
      `INSERT INTO qr_tokens (
        token,
        location_id,
        expires_at,
        is_used,
        created_at
      ) VALUES ($1, $2, $3, false, NOW())
      RETURNING *`,
      [token, realLocationId, expiresAt]
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token: token,
        expires_at: expiresAt,
        location_id: locationId
      })
    }

  } catch (error) {
    console.error('QR generate error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'Token oluşturulamadı' 
      })
    }
  } finally {
    await client.end()
  }
}
