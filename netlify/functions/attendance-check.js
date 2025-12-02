// Attendance check-in/check-out function
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
    const { qrCode, personnelId, action } = JSON.parse(event.body)

    // Mock attendance record - replace with actual database logic
    const attendance = {
      id: Math.random().toString(36).substr(2, 9),
      personnelId: personnelId,
      action: action,
      timestamp: new Date().toISOString(),
      location: qrCode.split('-')[0], // Extract location from QR code
      success: true
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
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
