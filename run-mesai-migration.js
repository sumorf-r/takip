// Mesai Hesaplama Migration'ını Çalıştır
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: process.env.VITE_DB_PORT || 5432,
  database: process.env.VITE_DB_NAME || 'restaurant_tracking',
  user: process.env.VITE_DB_USER || 'restaurant_app',
  password: process.env.VITE_DB_PASSWORD || 'RestaurantDB2024Local',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('🚀 Mesai ve Hak Ediş Hesaplama Migration Başlatılıyor...\n');
  
  try {
    const client = await pool.connect();
    
    // Migration dosyasını oku
    const migrationPath = path.join(__dirname, 'database', 'migration-mesai-hesaplama.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration dosyası okundu: migration-mesai-hesaplama.sql');
    console.log('⏳ Migration çalıştırılıyor...\n');
    
    // SQL'i çalıştır
    await client.query(sql);
    
    console.log('✅ Migration başarıyla tamamlandı!\n');
    
    // Kontrol: Personel ücretlerini göster
    console.log('📊 Personel Ücret Tablosu:');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    
    const result = await client.query(`
      SELECT 
        personnel_no as "No",
        name || ' ' || surname as "Ad Soyad",
        TO_CHAR(monthly_salary, '999,999.99') || ' TL' as "Aylık Maaş",
        TO_CHAR(daily_wage, '9,999.99') || ' TL' as "Günlük",
        TO_CHAR(hourly_wage, '999.99') || ' TL' as "Saatlik",
        TO_CHAR(minute_wage, '99.99') || ' TL' as "Dakikalık",
        shift_start_time as "Vardiya Başlangıç",
        shift_end_time as "Vardiya Bitiş"
      FROM personnel 
      ORDER BY personnel_no
    `);
    
    console.table(result.rows);
    
    // Eklenen kolonları kontrol et
    console.log('\n🔍 Attendance Tablosu Kontrol:');
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attendance' 
      AND column_name IN (
        'overtime_minutes', 
        'late_arrival_minutes', 
        'daily_earnings', 
        'net_earnings'
      )
    `);
    
    if (columnCheck.rows.length === 4) {
      console.log('✅ Tüm yeni kolonlar başarıyla eklendi!');
    } else {
      console.log('⚠️  Bazı kolonlar eksik olabilir.');
    }
    
    // View kontrolü
    console.log('\n📋 View Kontrol:');
    const viewCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name = 'v_daily_earnings_summary'
    `);
    
    if (viewCheck.rows.length > 0) {
      console.log('✅ v_daily_earnings_summary view oluşturuldu!');
    }
    
    // Fonksiyon kontrolü
    console.log('\n⚙️  Fonksiyon Kontrol:');
    const funcCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name = 'calculate_earnings_and_penalties'
    `);
    
    if (funcCheck.rows.length > 0) {
      console.log('✅ calculate_earnings_and_penalties() fonksiyonu oluşturuldu!');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════════════');
    console.log('🎉 SİSTEM HAZIR!');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('\n📝 Nasıl Çalışır:');
    console.log('   1. Personel giriş yapar → check_in kaydedilir');
    console.log('   2. Personel çıkış yapar → check_out kaydedilir');
    console.log('   3. Sistem OTOMATIK hesaplar:');
    console.log('      • Geç kalma kesintisi');
    console.log('      • Erken çıkış kesintisi');
    console.log('      • Fazla mesai ücreti (1.5x)');
    console.log('      • Net günlük kazanç');
    console.log('\n💡 Test için:');
    console.log('   SELECT * FROM v_daily_earnings_summary;');
    console.log('\n');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Migration Hatası:', error.message);
    console.error('\nDetay:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
