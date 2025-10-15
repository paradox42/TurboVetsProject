import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions && !requiredRoles) {
      return true; // No restrictions
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check roles first (if specified)
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = await this.rbacService.hasAnyRole(
        user.id,
        requiredRoles
      );
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`
        );
      }
    }

    // Check permissions (if specified)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = await Promise.all(
        requiredPermissions.map((permission) =>
          this.rbacService.hasPermission(user.id, permission)
        )
      );

      if (!hasAllPermissions.every((hasPermission) => hasPermission)) {
        throw new ForbiddenException(
          `Access denied. Required permissions: ${requiredPermissions.join(
            ', '
          )}`
        );
      }
    }

    return true;
  }
}
