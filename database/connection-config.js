// PostgreSQL Connection Configuration
// Bu bilgileri .env dosyanıza ekleyin

module.exports = {
  // PostgreSQL Bağlantı Bilgileri
  database: {
    host: 'YOUR_SERVER_IP',      // Örnek: 192.168.1.100 veya domain
    port: 5432,                  // PostgreSQL default portu
    database: 'restaurant_tracking',
    user: 'restaurant_app',
    password: 'YOUR_SECURE_PASSWORD',
    ssl: false,                  // Domain alınca true yapın (şimdilik false)
    max: 20,                     // Connection pool size
    idleTimeoutMillis: 30000
  },

  // MySQL kullanacaksanız (alternatif)
  mysql: {
    host: 'YOUR_SERVER_IP',
    port: 3306,
    database: 'restaurant_tracking',
    user: 'restaurant_app',
    password: 'YOUR_SECURE_PASSWORD',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },

  // Redis Cache (opsiyonel - performans için)
  redis: {
    host: 'YOUR_SERVER_IP',
    port: 6379,
    password: 'YOUR_REDIS_PASSWORD', // Opsiyonel
    db: 0
  }
}
