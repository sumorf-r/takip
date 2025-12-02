// Get attendance list with filters
export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    // Parse query parameters
    const params = event.queryStringParameters || {}
    const { date, location, personnelId, limit = 100 } = params

    // Mock attendance data - replace with database query
    const mockAttendances = [
      {
        id: '1',
        personnelId: '1',
        personnelName: 'Ahmet Yılmaz',
        date: '2024-01-15',
        checkIn: '2024-01-15T09:00:00',
        checkOut: '2024-01-15T18:00:00',
        hours: 9,
        location: 'cengelkoy'
      },
      {
        id: '2',
        personnelId: '2',
        personnelName: 'Ayşe Demir',
        date: '2024-01-15',
        checkIn: '2024-01-15T08:30:00',
        checkOut: '2024-01-15T17:30:00',
        hours: 9,
        location: 'cengelkoy'
      },
      {
        id: '3',
        personnelId: '3',
        personnelName: 'Mehmet Kaya',
        date: '2024-01-15',
        checkIn: '2024-01-15T10:00:00',
        checkOut: '2024-01-15T19:00:00',
        hours: 9,
        location: 'kadikoy'
      },
      {
        id: '4',
        personnelId: '4',
        personnelName: 'Fatma Öz',
        date: '2024-01-15',
        checkIn: '2024-01-15T09:15:00',
        checkOut: null,
        hours: 0,
        location: 'besiktas'
      }
    ]

    // Apply filters
    let filtered = mockAttendances
    
    if (date) {
      filtered = filtered.filter(a => a.date === date)
    }
    
    if (location) {
      filtered = filtered.filter(a => a.location === location)
    }
    
    if (personnelId) {
      filtered = filtered.filter(a => a.personnelId === personnelId)
    }

    // Apply limit
    filtered = filtered.slice(0, parseInt(limit))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        attendances: filtered,
        total: filtered.length
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
