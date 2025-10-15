import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import { ORGANIZATION_SCOPE_KEY } from '../decorators/organization-scope.decorator';

@Injectable()
export class OrganizationScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScope = this.reflector.getAllAndOverride<'own' | 'sub' | 'all'>(
      ORGANIZATION_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScope) {
      return true; // No scope restrictions
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // For now, we'll allow access and let the service layer handle scoping
    // In a more complex implementation, you might check specific resource ownership here
    return true;
  }
}