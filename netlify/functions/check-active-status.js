// Check if personnel has active check-in
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: process.env.VITE_DB_PORT || 5432,
  database: process.env.VITE_DB_NAME || 'restaurant_tracking',
  user: process.env.VITE_DB_USER || 'restaurant_app',
  password: process.env.VITE_DB_PASSWORD || 'RestaurantDB2024Secure',
  ssl: false
});

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { personnelId } = event.queryStringParameters || {};

    if (!personnelId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Personnel ID required' })
      };
    }

    const client = await pool.connect();

    // Check if has open check-in today
    const result = await client.query(
      `SELECT id, check_in_time, check_out_time 
       FROM attendance 
       WHERE personnel_id = $1 
       AND DATE(check_in_time) = CURRENT_DATE 
       AND check_out_time IS NULL
       ORDER BY check_in_time DESC 
       LIMIT 1`,
      [personnelId]
    );

    client.release();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        hasActiveCheckIn: result.rows.length > 0,
        checkInTime: result.rows[0]?.check_in_time || null
      })
    };

  } catch (error) {
    console.error('Status check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}
