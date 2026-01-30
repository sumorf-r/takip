// Veritabanı Bağlantı Konfigürasyonu
// NOT: Production'da bu bilgileri environment variable olarak kullanın

const dbConfig = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: process.env.VITE_DB_PORT || 5432,
  database: process.env.VITE_DB_NAME || 'restaurant_tracking',
  user: process.env.VITE_DB_USER || 'restaurant_app',
  password: process.env.VITE_DB_PASSWORD || 'RestaurantDB2024Local',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
  expiresIn: '24h'
}

module.exports = {
  dbConfig,
  jwtConfig,
  connectionString: `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
}
