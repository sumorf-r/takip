// Quick attendance check for QR scan
export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { qrCode, locationId, personnelId } = JSON.parse(event.body)

    // Mock: Check if personnel has an open check-in
    // In real implementation, query database for last attendance record
    const hasOpenCheckIn = Math.random() > 0.5

    const action = hasOpenCheckIn ? 'check-out' : 'check-in'
    
    const attendance = {
      id: Math.random().toString(36).substr(2, 9),
      personnelId: personnelId === 'auto' ? '1' : personnelId, // Mock auto-detection
      action: action,
      timestamp: new Date().toISOString(),
      location: locationId,
      qrCode: qrCode
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        action: action,
        attendance: attendance,
        message: `${action === 'check-in' ? 'Giriş' : 'Çıkış'} başarıyla kaydedildi`
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    }
  }
}
