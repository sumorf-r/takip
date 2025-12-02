// Personnel login function
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
    const { personnelId, password } = JSON.parse(event.body)

    // Mock personnel database - replace with actual database
    const mockPersonnel = [
      { id: '1', password: '123456', name: 'Ahmet Yılmaz' },
      { id: '2', password: '123456', name: 'Ayşe Demir' },
      { id: '3', password: '123456', name: 'Mehmet Kaya' },
      { id: '4', password: '123456', name: 'Fatma Öz' }
    ]

    const personnel = mockPersonnel.find(p => p.id === personnelId && p.password === password)

    if (personnel) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          personnel: {
            id: personnel.id,
            name: personnel.name
          },
          token: 'personnel-token-' + Date.now()
        })
      }
    }

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Invalid personnel ID or password'
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
