import { SetMetadata } from '@nestjs/common';

export const ORGANIZATION_SCOPE_KEY = 'organizationScope';
export const OrganizationScope = (scope: 'own' | 'sub' | 'all') =>
  SetMetadata(ORGANIZATION_SCOPE_KEY, scope);
