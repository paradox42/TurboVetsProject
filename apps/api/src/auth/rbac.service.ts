import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>
  ) {}

  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user || !user.roles) {
      return [];
    }

    const permissions = new Set<string>();
    user.roles.forEach((role) => {
      if (role.permissions) {
        role.permissions.forEach((permission) => {
          permissions.add(permission.name);
        });
      }
    });

    return Array.from(permissions);
  }

  async hasPermission(
    userId: number,
    requiredPermission: string
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.includes(requiredPermission);
  }

  async hasAnyRole(userId: number, requiredRoles: string[]): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user || !user.roles) {
      return false;
    }

    const userRoles = user.roles.map((role) => role.name);
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  async canAccessOrganization(
    userId: number,
    targetOrgId: number,
    scope: 'own' | 'sub' | 'all'
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user || !user.organization) {
      return false;
    }

    const userOrgId = user.organization.id;

    switch (scope) {
      case 'own':
        return userOrgId === targetOrgId;

      case 'sub':
        // Check if target org is a sub-organization of user's org
        const targetOrg = await this.organizationRepository.findOne({
          where: { id: targetOrgId },
          relations: ['parent'],
        });
        return targetOrg?.parent?.id === userOrgId;

      case 'all':
        // Check if user has admin/owner role for cross-org access
        const hasAdminRole = await this.hasAnyRole(userId, ['owner', 'admin']);
        return hasAdminRole;

      default:
        return false;
    }
  }

  async getAccessibleUserIds(
    userId: number,
    scope: 'own' | 'sub' | 'all'
  ): Promise<number[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user || !user.organization) {
      return [userId]; // Only self if no organization
    }

    const userOrgId = user.organization.id;

    switch (scope) {
      case 'own':
        // Only users in the same organization
        const sameOrgUsers = await this.userRepository.find({
          where: { organization: { id: userOrgId } },
          select: ['id'],
        });
        return sameOrgUsers.map((u) => u.id);

      case 'sub':
        // Users in same org and sub-organizations
        const subOrgs = await this.organizationRepository.find({
          where: { parent: { id: userOrgId } },
          relations: ['users'],
        });
        const subOrgUserIds = subOrgs.flatMap((org) =>
          org.users.map((u) => u.id)
        );
        const sameOrgUserIds = await this.getAccessibleUserIds(userId, 'own');
        return [...sameOrgUserIds, ...subOrgUserIds];

      case 'all':
        // All users if admin/owner, otherwise just own org
        const hasAdminRole = await this.hasAnyRole(userId, ['owner', 'admin']);
        if (hasAdminRole) {
          const allUsers = await this.userRepository.find({ select: ['id'] });
          return allUsers.map((u) => u.id);
        }
        return this.getAccessibleUserIds(userId, 'own');

      default:
        return [userId];
    }
  }

  async getOrganizationHierarchy(userId: number): Promise<{
    userOrg: Organization | null;
    subOrgs: Organization[];
    parentOrg: Organization | null;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'organization',
        'organization.parent',
        'organization.children',
      ],
    });

    if (!user || !user.organization) {
      return { userOrg: null, subOrgs: [], parentOrg: null };
    }

    const userOrg = user.organization;
    const subOrgs = userOrg.children || [];
    const parentOrg = userOrg.parent || null;

    return { userOrg, subOrgs, parentOrg };
  }

  async canManageUser(
    currentUserId: number,
    targetUserId: number
  ): Promise<boolean> {
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['organization', 'roles'],
    });

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['organization'],
    });

    if (!currentUser || !targetUser) {
      return false;
    }

    // Owner can manage anyone
    if (currentUser.roles?.some((role) => role.name === 'owner')) {
      return true;
    }

    // Admin can manage users in their organization and sub-organizations
    if (currentUser.roles?.some((role) => role.name === 'admin')) {
      const accessibleUserIds = await this.getAccessibleUserIds(
        currentUserId,
        'sub'
      );
      return accessibleUserIds.includes(targetUserId);
    }

    // Regular users can only manage themselves
    return currentUserId === targetUserId;
  }
}
