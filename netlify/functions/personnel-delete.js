// Personel Silme (Soft Delete - Pasifleştirme)
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
    'Access-Control-Allow-Methods': 'DELETE, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'DELETE' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { personnelId } = JSON.parse(event.body);

    if (!personnelId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Personnel ID required' })
      };
    }

    const client = await pool.connect();

    try {
      // Soft delete - is_active = false yap
      const result = await client.query(
        `UPDATE personnel 
         SET 
           is_active = false,
           updated_at = NOW()
         WHERE id = $1
         RETURNING id, personnel_no, name, surname`,
        [personnelId]
      );

      if (result.rows.length === 0) {
        client.release();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: 'Personnel not found' })
        };
      }

      const personnel = result.rows[0];

      // Log
      await client.query(
        'INSERT INTO audit_logs (action, table_name, record_id, details) VALUES ($1, $2, $3, $4)',
        [
          'personnel_deactivate', 
          'personnel', 
          personnelId,
          `${personnel.name} ${personnel.surname} (${personnel.personnel_no}) pasifleştirildi`
        ]
      );

      client.release();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Personel pasifleştirildi',
          personnel: personnel
        })
      };

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Personnel delete error:', error);
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
