const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', '..', '..', 'data', 'app.db');
const db = new sqlite3.Database(dbPath);

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await runQuery("DELETE FROM users");
    await runQuery("DELETE FROM roles");
    await runQuery("DELETE FROM organizations");
    await runQuery("DELETE FROM permissions");
    await runQuery("DELETE FROM users_roles_roles");
    await runQuery("DELETE FROM roles_permissions_permissions");

    // Create permissions
    console.log('📝 Creating permissions...');
    const permissions = [
      { name: 'create_task', description: 'Create new tasks' },
      { name: 'read_task', description: 'View tasks' },
      { name: 'update_task', description: 'Edit tasks' },
      { name: 'delete_task', description: 'Delete tasks' },
      { name: 'view_audit_log', description: 'View audit logs' },
    ];

    const permissionIds = {};
    for (const perm of permissions) {
      const result = await runQuery(
        "INSERT INTO permissions (name, description, createdAt, updatedAt) VALUES (?, ?, datetime('now'), datetime('now'))",
        [perm.name, perm.description]
      );
      permissionIds[perm.name] = result.lastID;
      console.log(`✅ Created permission: ${perm.name} (ID: ${result.lastID})`);
    }

    // Create roles
    console.log('👥 Creating roles...');
    const roles = [
      { 
        name: 'owner', 
        description: 'Organization owner with full access',
        permissions: ['create_task', 'read_task', 'update_task', 'delete_task', 'view_audit_log']
      },
      { 
        name: 'admin', 
        description: 'Administrator with task management access',
        permissions: ['create_task', 'read_task', 'update_task', 'delete_task']
      },
      { 
        name: 'viewer', 
        description: 'View-only access to tasks',
        permissions: ['read_task']
      }
    ];

    const roleIds = {};
    for (const role of roles) {
      const result = await runQuery(
        "INSERT INTO roles (name, description, createdAt, updatedAt) VALUES (?, ?, datetime('now'), datetime('now'))",
        [role.name, role.description]
      );
      roleIds[role.name] = result.lastID;
      console.log(`✅ Created role: ${role.name} (ID: ${result.lastID})`);

      // Link role to permissions
      for (const permName of role.permissions) {
        await runQuery(
          "INSERT INTO roles_permissions_permissions (rolesId, permissionsId) VALUES (?, ?)",
          [result.lastID, permissionIds[permName]]
        );
      }
    }

    // Create organizations
    console.log('🏢 Creating organizations...');
    const rootOrgResult = await runQuery(
      "INSERT INTO organizations (name, description, createdAt, updatedAt) VALUES (?, ?, datetime('now'), datetime('now'))",
      ['Acme Corp', 'Main organization']
    );
    const rootOrgId = rootOrgResult.lastID;
    console.log(`✅ Created organization: Acme Corp (ID: ${rootOrgId})`);

    const subOrgResult = await runQuery(
      "INSERT INTO organizations (name, description, parentId, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
      ['Engineering Team', 'Engineering department', rootOrgId]
    );
    const subOrgId = subOrgResult.lastID;
    console.log(`✅ Created organization: Engineering Team (ID: ${subOrgId})`);

    // Create users
    console.log('👤 Creating users...');
    const users = [
      {
        name: 'John Owner',
        email: 'owner@example.com',
        password: 'password123',
        organizationId: rootOrgId,
        roleName: 'owner'
      },
      {
        name: 'Jane Admin',
        email: 'admin@example.com',
        password: 'password123',
        organizationId: rootOrgId,
        roleName: 'admin'
      },
      {
        name: 'Bob Viewer',
        email: 'viewer@example.com',
        password: 'password123',
        organizationId: subOrgId,
        roleName: 'viewer'
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await runQuery(
        "INSERT INTO users (name, email, password, organizationId, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
        [user.name, user.email, hashedPassword, user.organizationId]
      );
      const userId = result.lastID;
      console.log(`✅ Created user: ${user.email} (ID: ${userId})`);

      // Link user to role
      await runQuery(
        "INSERT INTO users_roles_roles (usersId, rolesId) VALUES (?, ?)",
        [userId, roleIds[user.roleName]]
      );
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nTest users created:');
    console.log('- owner@example.com (password: password123) - Owner role');
    console.log('- admin@example.com (password: password123) - Admin role');
    console.log('- viewer@example.com (password: password123) - Viewer role');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    db.close();
  }
}

// Helper function to run SQL queries with promises
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

seedDatabase().catch(console.error);