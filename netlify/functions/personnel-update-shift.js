// Personel Mesai Ayarları Güncelleme
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const {
      personnelId,
      monthly_salary,
      standard_work_hours,
      shift_start_time,
      shift_end_time
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
      // Güncelleme yap
      const result = await client.query(
        `UPDATE personnel 
         SET 
           monthly_salary = COALESCE($1, monthly_salary),
           standard_work_hours = COALESCE($2, standard_work_hours),
           shift_start_time = COALESCE($3, shift_start_time),
           shift_end_time = COALESCE($4, shift_end_time),
           updated_at = NOW()
         WHERE id = $5
         RETURNING 
           id,
           personnel_no,
           name,
           surname,
           monthly_salary,
           daily_wage,
           hourly_wage,
           minute_wage,
           standard_work_hours,
           shift_start_time,
           shift_end_time`,
        [monthly_salary, standard_work_hours, shift_start_time, shift_end_time, personnelId]
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
        'INSERT INTO audit_logs (action, table_name, record_id) VALUES ($1, $2, $3)',
        ['personnel_shift_update', 'personnel', personnelId]
      );

      client.release();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          personnel: personnel,
          message: 'Mesai ayarları başarıyla güncellendi'
        })
      };

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Shift update error:', error);
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
