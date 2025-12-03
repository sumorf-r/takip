// Personel Bilgileri Güncelleme
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.VITE_DB_HOST || '5.175.136.149',
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
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const {
      personnelId,
      name,
      surname,
      email,
      phone,
      position,
      department,
      location_id,
      salary
    } = JSON.parse(event.body);

    if (!personnelId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Personnel ID required' })
      };
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        `UPDATE personnel 
         SET 
           name = COALESCE($1, name),
           surname = COALESCE($2, surname),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           position = COALESCE($5, position),
           department = COALESCE($6, department),
           location_id = COALESCE($7, location_id),
           salary = COALESCE($8, salary),
           updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [name, surname, email, phone, position, department, location_id, salary, personnelId]
      );

      if (result.rows.length === 0) {
        client.release();
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: 'Personnel not found' })
        };
      }

      // Log
      await client.query(
        'INSERT INTO audit_logs (action, table_name, record_id) VALUES ($1, $2, $3)',
        ['personnel_update', 'personnel', personnelId]
      );

      client.release();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          personnel: result.rows[0],
          message: 'Personel bilgileri güncellendi'
        })
      };

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Personnel update error:', error);
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
