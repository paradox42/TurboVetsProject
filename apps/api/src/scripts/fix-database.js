const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', '..', '..', 'data', 'app.db');
const db = new sqlite3.Database(dbPath);

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database with real password hashes...');
    
    // Generate real hash for password123
    const realHash = await bcrypt.hash('password123', 10);
    console.log('✅ Generated real hash:', realHash);
    
    // Test the hash
    const isValid = await bcrypt.compare('password123', realHash);
    console.log('✅ Hash validation test:', isValid);
    
    // Update all users
    const users = [
      { email: 'owner@example.com', name: 'John Owner' },
      { email: 'admin@example.com', name: 'Jane Admin' },
      { email: 'viewer@example.com', name: 'Bob Viewer' }
    ];
    
    for (const user of users) {
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE users SET password = ? WHERE email = ?",
          [realHash, user.email],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log(`✅ Updated password for ${user.name}`);
    }
    
    console.log('\n🎉 Database fixed! All users now have valid password hashes.');
    console.log('Test login with any user:');
    console.log('- Email: owner@example.com, admin@example.com, or viewer@example.com');
    console.log('- Password: password123');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    db.close();
  }
}

fixDatabase();