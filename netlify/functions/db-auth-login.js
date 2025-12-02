// Real Database Authentication with PostgreSQL
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../../src/lib/db.js'

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
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

    // Admin login
    if (role === 'admin') {
      const userQuery = await db.query(
        'SELECT id, email, name, role, password_hash FROM users WHERE email = $1 AND is_active = true',
        [email]
      )

      if (userQuery.rows.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid credentials' })
        }
      }

      const user = userQuery.rows[0]
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      
      if (!isValidPassword) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid credentials' })
        }
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      )

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
        { expiresIn: '24h' }
      )

      // Log the action
      await db.query(
        'INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
        [user.id, 'admin_login', event.headers['x-forwarded-for'] || event.headers['client-ip']]
      )

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token
        })
      }
    }

    // Personnel login
    if (role === 'personnel') {
      const personnelQuery = await db.query(
        'SELECT id, personnel_no, name, surname, password_hash, location_id FROM personnel WHERE personnel_no = $1 AND is_active = true',
        [email] // email parametresi aslında personnel_no olarak kullanılıyor
      )

      if (personnelQuery.rows.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid personnel ID' })
        }
      }

      const personnel = personnelQuery.rows[0]
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, personnel.password_hash)
      
      if (!isValidPassword) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid password' })
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: personnel.id, 
          personnel_no: personnel.personnel_no, 
          role: 'personnel',
          location_id: personnel.location_id
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
        { expiresIn: '12h' }
      )

      // Log the action
      await db.query(
        'INSERT INTO audit_logs (personnel_id, action, ip_address) VALUES ($1, $2, $3)',
        [personnel.id, 'personnel_login', event.headers['x-forwarded-for'] || event.headers['client-ip']]
      )

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: personnel.id,
            personnel_no: personnel.personnel_no,
            name: `${personnel.name} ${personnel.surname}`,
            role: 'personnel',
            location_id: personnel.location_id
          },
          token
        })
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid role' })
    }

  } catch (error) {
    console.error('Login error:', error)
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
