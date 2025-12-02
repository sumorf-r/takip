// Verify authentication token
export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const authorization = event.headers.authorization
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No token provided'
        })
      }
    }

    const token = authorization.substring(7)

    // Mock token verification - replace with actual JWT verification
    if (token.startsWith('jwt-token-') || token.startsWith('demo-token-')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'admin@restaurant.com',
            name: 'Admin User',
            role: 'admin'
          }
        })
      }
    }

    if (token.startsWith('personnel-token-')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: '2',
            name: 'Personnel User',
            role: 'personnel'
          }
        })
      }
    }

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Invalid token'
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
