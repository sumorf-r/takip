// Admin kullanıcısı kurulum scripti
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Veritabanı bağlantısı
const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: process.env.VITE_DB_PORT || 5432,
  database: process.env.VITE_DB_NAME || 'restaurant_tracking',
  user: process.env.VITE_DB_USER || 'restaurant_app',
  password: process.env.VITE_DB_PASSWORD || 'RestaurantDB2024Local',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function setupAdmin() {
  console.log('🔐 Admin kullanıcısı ayarlanıyor...\n');
  
  try {
    const client = await pool.connect();
    
    // Admin şifresi
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Mevcut admin'i kontrol et
    const existingAdmin = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['admin@restaurant.com']
    );
    
    if (existingAdmin.rows.length > 0) {
      // Admin varsa güncelle
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, 'admin@restaurant.com']
      );
      console.log('✅ Admin şifresi güncellendi!');
    } else {
      // Admin yoksa oluştur
      await client.query(
        `INSERT INTO users (email, password_hash, name, role, is_active) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin@restaurant.com', hashedPassword, 'Admin User', 'admin', true]
      );
      console.log('✅ Admin kullanıcısı oluşturuldu!');
    }
    
    // Personel şifrelerini de ayarla (demo için)
    const personnelPassword = '123456';
    const hashedPersonnelPassword = await bcrypt.hash(personnelPassword, 10);
    
    // Tüm personellerin şifrelerini güncelle
    await client.query(
      'UPDATE personnel SET password_hash = $1',
      [hashedPersonnelPassword]
    );
    console.log('✅ Personel şifreleri güncellendi!');
    
    console.log('\n📋 Giriş Bilgileri:');
    console.log('=====================================');
    console.log('ADMIN GİRİŞİ:');
    console.log('  Email: admin@restaurant.com');
    console.log('  Şifre: admin123');
    console.log('');
    console.log('PERSONEL GİRİŞİ:');
    console.log('  Personel No: P001, P002, P003, P004');
    console.log('  Şifre: 123456');
    console.log('=====================================\n');
    
    client.release();
    console.log('✅ Kurulum tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await pool.end();
  }
}

setupAdmin();
