// PostgreSQL Database Connection
import pg from 'pg'
const { Pool } = pg

// Connection pool oluştur - Gerçek veritabanı bilgileri
const pool = new Pool({
  host: import.meta.env.VITE_DB_HOST || '5.175.136.149',
  port: import.meta.env.VITE_DB_PORT || 5432,
  database: import.meta.env.VITE_DB_NAME || 'restaurant_tracking',
  user: import.meta.env.VITE_DB_USER || 'restaurant_app',
  password: import.meta.env.VITE_DB_PASSWORD || 'RestaurantDB2024Secure',
  ssl: import.meta.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,  // SSL şimdilik kapalı
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Helper functions
export const db = {
  // Tek bir sorgu çalıştır
  query: async (text, params) => {
    const start = Date.now()
    try {
      const res = await pool.query(text, params)
      const duration = Date.now() - start
      console.log('Query executed:', { text, duration, rows: res.rowCount })
      return res
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  },

  // Transaction işlemleri
  transaction: async (callback) => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // Bağlantıyı test et
  testConnection: async () => {
    try {
      const res = await pool.query('SELECT NOW() as time, version() as version')
      console.log('Database connected:', res.rows[0])
      return true
    } catch (error) {
      console.error('Database connection failed:', error)
      return false
    }
  },

  // Pool'u kapat
  close: async () => {
    await pool.end()
  }
}

// Query builder helpers
export const sql = {
  // INSERT helper
  insert: (table, data) => {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map((_, i) => `$${i + 1}`)
    
    return {
      text: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    }
  },

  // UPDATE helper
  update: (table, data, condition, conditionValues = []) => {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ')
    
    return {
      text: `UPDATE ${table} SET ${setClause} WHERE ${condition} RETURNING *`,
      values: [...values, ...conditionValues]
    }
  },

  // SELECT helper with pagination
  select: (table, options = {}) => {
    const { 
      columns = '*', 
      where = '', 
      orderBy = '', 
      limit = null, 
      offset = null,
      joins = []
    } = options
    
    let query = `SELECT ${columns} FROM ${table}`
    
    // Add joins
    joins.forEach(join => {
      query += ` ${join}`
    })
    
    // Add where clause
    if (where) {
      query += ` WHERE ${where}`
    }
    
    // Add order by
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`
    }
    
    // Add pagination
    if (limit) {
      query += ` LIMIT ${limit}`
    }
    if (offset) {
      query += ` OFFSET ${offset}`
    }
    
    return query
  },

  // DELETE helper
  delete: (table, condition, values = []) => {
    return {
      text: `DELETE FROM ${table} WHERE ${condition} RETURNING *`,
      values
    }
  }
}

export default db
