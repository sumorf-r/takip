// Veritabanı Bağlantı Testi
import pg from 'pg';
const { Pool } = pg;

// Veritabanı bilgileri
const pool = new Pool({
  host: '5.175.136.149',
  port: 5432,
  database: 'restaurant_tracking',
  user: 'restaurant_app',
  password: 'RestaurantDB2024Secure',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000
});

async function testConnection() {
  console.log('🔄 Veritabanına bağlanılıyor...\n');
  
  try {
    // 1. Bağlantı testi
    const client = await pool.connect();
    console.log('✅ PostgreSQL bağlantısı başarılı!');
    
    // 2. Veritabanı bilgilerini kontrol et
    const dbInfo = await client.query('SELECT version(), current_database(), current_user');
    console.log('\n📊 Veritabanı Bilgileri:');
    console.log('- Versiyon:', dbInfo.rows[0].version.split(',')[0]);
    console.log('- Database:', dbInfo.rows[0].current_database);
    console.log('- Kullanıcı:', dbInfo.rows[0].current_user);
    
    // 3. Tabloları listele
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('\n📋 Mevcut Tablolar:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });
    
    // 4. Her tablodaki kayıt sayısını kontrol et
    console.log('\n📈 Tablo Kayıt Sayıları:');
    
    const tableNames = tables.rows.map(r => r.tablename);
    for (const tableName of tableNames) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
      console.log(`   - ${tableName}: ${countResult.rows[0].count} kayıt`);
    }
    
    // 5. Örnek veriyi kontrol et
    console.log('\n👥 Örnek Personeller:');
    const personnel = await client.query('SELECT personnel_no, name, surname, position FROM personnel LIMIT 5');
    personnel.rows.forEach(p => {
      console.log(`   - [${p.personnel_no}] ${p.name} ${p.surname} - ${p.position}`);
    });
    
    console.log('\n📍 Lokasyonlar:');
    const locations = await client.query('SELECT location_code, name, address FROM locations');
    locations.rows.forEach(l => {
      console.log(`   - [${l.location_code}] ${l.name} - ${l.address}`);
    });
    
    // Bağlantıyı kapat
    client.release();
    console.log('\n✅ Tüm testler başarılı! Veritabanı kullanıma hazır.');
    
  } catch (error) {
    console.error('\n❌ Bağlantı hatası:', error.message);
    console.error('\nDetaylı hata:', error);
  } finally {
    await pool.end();
  }
}

// Testi çalıştır
console.log('========================================');
console.log('   RESTORAN TAKİP VERİTABANI TESTİ     ');
console.log('========================================\n');
console.log('🔗 Bağlantı Bilgileri:');
console.log('   Host:', '5.175.136.149');
console.log('   Port:', '5432');
console.log('   Database:', 'restaurant_tracking');
console.log('   User:', 'restaurant_app');
console.log('========================================\n');

testConnection();
