import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Organization, Role, Permission } from '../entities';
import * as bcrypt from 'bcrypt';

async function seedDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const orgRepo = app.get<Repository<Organization>>(getRepositoryToken(Organization));
  const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
  const permRepo = app.get<Repository<Permission>>(getRepositoryToken(Permission));

  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await userRepo.delete({});
    await roleRepo.delete({});
    await orgRepo.delete({});
    await permRepo.delete({});

    // Create permissions
    console.log('📝 Creating permissions...');
    const permissions = [
      { name: 'create_task', description: 'Create new tasks' },
      { name: 'read_task', description: 'View tasks' },
      { name: 'update_task', description: 'Edit tasks' },
      { name: 'delete_task', description: 'Delete tasks' },
      { name: 'view_audit_log', description: 'View audit logs' },
    ];

    const createdPermissions = [];
    for (const permData of permissions) {
      const permission = new Permission();
      permission.name = permData.name;
      permission.description = permData.description;
      const saved = await permRepo.save(permission);
      createdPermissions.push(saved);
      console.log(`✅ Created permission: ${permData.name}`);
    }

    // Create roles with permissions
    console.log('👥 Creating roles...');
    const ownerRole = new Role();
    ownerRole.name = 'owner';
    ownerRole.description = 'Organization owner with full access';
    ownerRole.permissions = createdPermissions;
    const savedOwnerRole = await roleRepo.save(ownerRole);
    console.log('✅ Created role: owner');

    const adminRole = new Role();
    adminRole.name = 'admin';
    adminRole.description = 'Administrator with task management access';
    adminRole.permissions = createdPermissions.filter(p => p.name !== 'view_audit_log');
    const savedAdminRole = await roleRepo.save(adminRole);
    console.log('✅ Created role: admin');

    const viewerRole = new Role();
    viewerRole.name = 'viewer';
    viewerRole.description = 'View-only access to tasks';
    viewerRole.permissions = createdPermissions.filter(p => p.name === 'read_task');
    const savedViewerRole = await roleRepo.save(viewerRole);
    console.log('✅ Created role: viewer');

    // Create organizations
    console.log('🏢 Creating organizations...');
    const rootOrg = new Organization();
    rootOrg.name = 'Acme Corp';
    rootOrg.description = 'Main organization';
    const savedRootOrg = await orgRepo.save(rootOrg);
    console.log('✅ Created organization: Acme Corp');

    const subOrg = new Organization();
    subOrg.name = 'Engineering Team';
    subOrg.description = 'Engineering department';
    subOrg.parent = savedRootOrg;
    subOrg.parentId = savedRootOrg.id;
    const savedSubOrg = await orgRepo.save(subOrg);
    console.log('✅ Created organization: Engineering Team');

    // Create users with proper role assignments
    console.log('👤 Creating users...');
    
    // Owner user
    const ownerUser = new User();
    ownerUser.name = 'John Owner';
    ownerUser.email = 'owner@example.com';
    ownerUser.password = await bcrypt.hash('password123', 10);
    ownerUser.organization = savedRootOrg;
    ownerUser.roles = [savedOwnerRole];
    await userRepo.save(ownerUser);
    console.log('✅ Created user: owner@example.com');

    // Admin user
    const adminUser = new User();
    adminUser.name = 'Jane Admin';
    adminUser.email = 'admin@example.com';
    adminUser.password = await bcrypt.hash('password123', 10);
    adminUser.organization = savedRootOrg;
    adminUser.roles = [savedAdminRole];
    await userRepo.save(adminUser);
    console.log('✅ Created user: admin@example.com');

    // Viewer user
    const viewerUser = new User();
    viewerUser.name = 'Bob Viewer';
    viewerUser.email = 'viewer@example.com';
    viewerUser.password = await bcrypt.hash('password123', 10);
    viewerUser.organization = savedSubOrg;
    viewerUser.roles = [savedViewerRole];
    await userRepo.save(viewerUser);
    console.log('✅ Created user: viewer@example.com');

    // Verify the relationships were created correctly
    console.log('\n🔍 Verifying relationships...');
    
    const ownerWithRoles = await userRepo.findOne({
      where: { email: 'owner@example.com' },
      relations: ['roles', 'organization']
    });
    console.log('Owner roles:', ownerWithRoles?.roles?.map(r => r.name));

    const adminWithRoles = await userRepo.findOne({
      where: { email: 'admin@example.com' },
      relations: ['roles', 'organization']
    });
    console.log('Admin roles:', adminWithRoles?.roles?.map(r => r.name));

    const viewerWithRoles = await userRepo.findOne({
      where: { email: 'viewer@example.com' },
      relations: ['roles', 'organization']
    });
    console.log('Viewer roles:', viewerWithRoles?.roles?.map(r => r.name));

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nTest users created:');
    console.log('- owner@example.com (password: password123) - Owner role');
    console.log('- admin@example.com (password: password123) - Admin role');
    console.log('- viewer@example.com (password: password123) - Viewer role');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Stack trace: <unknown>');
    }
  } finally {
    await app.close();
  }
}

seedDatabase().catch(console.error);