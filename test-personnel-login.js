// Personel Giriş Testi
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  host: '5.175.136.149',
  port: 5432,
  database: 'restaurant_tracking',
  user: 'restaurant_app',
  password: 'RestaurantDB2024Secure',
  ssl: false
});

async function testPersonnelLogin() {
  console.log('🔍 Personel Giriş Testi\n');
  
  try {
    const client = await pool.connect();
    
    // 1. Tüm personelleri listele
    console.log('📋 Veritabanındaki Personeller:');
    const personnelList = await client.query(
      'SELECT personnel_no, name, surname, password_hash FROM personnel ORDER BY personnel_no'
    );
    
    personnelList.rows.forEach(p => {
      console.log(`   ${p.personnel_no} - ${p.name} ${p.surname}`);
      console.log(`      Password hash var mı: ${p.password_hash ? 'Evet' : 'HAYIR - PROBLEM!'}`);
    });
    
    // 2. P001 ile test giriş
    console.log('\n🔐 P001 ile Test Giriş:');
    const testPersonnelNo = 'P001';
    const testPassword = '123456';
    
    const personnelQuery = await client.query(
      'SELECT id, personnel_no, name, surname, password_hash, location_id FROM personnel WHERE personnel_no = $1 AND is_active = true',
      [testPersonnelNo]
    );
    
    if (personnelQuery.rows.length === 0) {
      console.log('❌ Personel bulunamadı!');
      client.release();
      return;
    }
    
    const personnel = personnelQuery.rows[0];
    console.log(`✅ Personel bulundu: ${personnel.name} ${personnel.surname}`);
    
    if (!personnel.password_hash) {
      console.log('❌ ŞİFRE HASH YOK! setup-admin.js çalıştırılmamış olabilir.');
      client.release();
      return;
    }
    
    // 3. Şifre kontrolü
    console.log('\n🔑 Şifre Kontrolü:');
    const isValidPassword = await bcrypt.compare(testPassword, personnel.password_hash);
    
    if (isValidPassword) {
      console.log('✅ ŞİFRE DOĞRU! Giriş başarılı olmalı.');
    } else {
      console.log('❌ ŞİFRE YANLIŞ! Problem var.');
      console.log('   Hash:', personnel.password_hash.substring(0, 20) + '...');
    }
    
    // 4. Yeni hash oluştur ve karşılaştır
    console.log('\n🔧 Yeni Hash Test:');
    const newHash = await bcrypt.hash('123456', 10);
    console.log('   Yeni hash oluşturuldu');
    const testNewHash = await bcrypt.compare('123456', newHash);
    console.log(`   Yeni hash test: ${testNewHash ? '✅ Çalışıyor' : '❌ Çalışmıyor'}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await pool.end();
  }
}

testPersonnelLogin();
