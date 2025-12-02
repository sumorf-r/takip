// Mock authentication function - replace with actual database logic
export async function handler(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
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
    const { email, password, role } = JSON.parse(event.body)

    // Mock validation - replace with actual database check
    if (email === 'admin@restaurant.com' && password === 'admin123' && role === 'admin') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: email,
            name: 'Admin User',
            role: 'admin'
          },
          token: 'jwt-token-' + Date.now()
        })
      }
    }

    // Personnel login mock
    if (role === 'personnel') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: '2',
            email: email,
            name: 'Personnel User',
            role: 'personnel'
          },
          token: 'jwt-token-' + Date.now()
        })
      }
    }

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Invalid credentials'
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
