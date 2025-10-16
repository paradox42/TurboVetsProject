import {
  Controller,
  Get,
  Post,
  Request,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { OrganizationScopeGuard } from '../auth/guards/organization-scope.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrganizationScope } from '../auth/decorators/organization-scope.decorator';
import { AuditInterceptor } from '../auth/interceptors/audit.interceptor';
import { AuditService } from '../auth/audit.service';
import { RbacService } from '../auth/rbac.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard, OrganizationScopeGuard)
@UseInterceptors(AuditInterceptor)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly auditService: AuditService,
    private readonly rbacService: RbacService
  ) {}

  // ===== BASIC CRUD OPERATIONS =====
  @Post()
  @RequirePermissions('create_task')
  @OrganizationScope('own')
  async create(
    @Request() req: any,
    @Body()
    createTaskDto: {
      title: string;
      description?: string;
      category?: string;
      priority?: string;
      dueDate?: Date;
    }
  ) {
    // Extract user ID from authenticated user
    const userId = req.user.id;

    await this.auditService.logAction(
      userId,
      'create_task',
      'tasks',
      'success',
      { taskTitle: createTaskDto.title }
    );

    return this.tasksService.create({
      ...createTaskDto,
      userId,
    });
  }

  @Get()
  @RequirePermissions('read_task')
  @OrganizationScope('own')
  async findAll(@Request() req: any) {
    const userId = req.user.id;
    return this.tasksService.findAll(userId);
  }

  // ===== ORGANIZATION-SCOPED OPERATIONS =====
  @Get('admin/all')
  @Roles('admin', 'owner')
  @RequirePermissions('read_task')
  @OrganizationScope('sub')
  async findAllInOrganization(@Request() req: any) {
    const userId = req.user.id;
    return this.tasksService.findAllInOrganization(userId);
  }

  @Get('organization/stats')
  @Roles('admin', 'owner')
  @RequirePermissions('read_task')
  @OrganizationScope('sub')
  async getOrganizationStats(@Request() req: any) {
    const userId = req.user.id;
    return this.tasksService.getOrganizationStats(userId);
  }

  @Get('organization/own')
  @Roles('admin', 'owner')
  @RequirePermissions('read_task')
  @OrganizationScope('own')
  async findAllInOwnOrganization(@Request() req: any) {
    const userId = req.user.id;
    return this.tasksService.findAllInOwnOrganization(userId);
  }

  @Get('organization/all')
  @Roles('owner')
  @RequirePermissions('read_task')
  @OrganizationScope('all')
  async findAllAcrossOrganizations(@Request() req: any) {
    const userId = req.user.id;
    return this.tasksService.findAllAcrossOrganizations(userId);
  }

  @Get('organization/hierarchy')
  @Roles('admin', 'owner')
  @RequirePermissions('read_task')
  @OrganizationScope('own')
  async getOrganizationHierarchy(@Request() req: any) {
    const userId = req.user.id;
    return this.rbacService.getOrganizationHierarchy(userId);
  }

  // ===== USER MANAGEMENT =====
  @Get('assignable-users')
  @RequirePermissions('read_task')
  @OrganizationScope('own')
  async getAssignableUsers(@Request() req: any) {
    const userId = req.user.id;
    return this.rbacService.getAssignableUsers(userId);
  }

  // ===== AUDIT OPERATIONS =====
  @Get('audit/logs')
  @Roles('owner')
  @RequirePermissions('view_audit_log')
  @OrganizationScope('all')
  async getAuditLogs(@Request() req: any) {
    const userId = req.user.id;
    return this.tasksService.getAuditLogs(userId);
  }

  @Get(':id')
  @RequirePermissions('read_task')
  @OrganizationScope('own')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    const task = await this.tasksService.findOne(+id, userId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  @Put(':id')
  @RequirePermissions('update_task')
  @OrganizationScope('own')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: any,
    @Request() req: any
  ) {
    const userId = req.user.id;

    // Check if task exists and belongs to user
    const existingTask = await this.tasksService.findOne(+id, userId);
    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    return this.tasksService.update(+id, updateTaskDto, userId);
  }

  @Delete(':id')
  @RequirePermissions('delete_task')
  @OrganizationScope('own')
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;

    // Check if task exists and belongs to user
    const existingTask = await this.tasksService.findOne(+id, userId);
    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    return this.tasksService.remove(+id, userId);
  }

}
