import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
// RBAC:
import { RbacService } from './rbac.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { OrganizationScopeGuard } from './guards/organization-scope.guard';
import { User, Organization, Role, Permission } from '../entities';
// Autit:
import { AuditService } from './audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, Role, Permission]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RbacService,
    PermissionsGuard,
    OrganizationScopeGuard,
    AuditService,
    AuditInterceptor,
  ],
  exports: [AuthService, RbacService, PermissionsGuard, OrganizationScopeGuard, AuditService],
})
export class AuthModule {}
