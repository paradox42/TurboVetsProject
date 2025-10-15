import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { RbacService } from '../auth/rbac.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private rbacService: RbacService
  ) {}

  async create(createTaskDto: {
    title: string;
    description?: string;
    userId: number;
    category?: string;
    priority?: number;
    dueDate?: Date;
  }): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);
    return await this.taskRepository.save(task);
  }

  async findAll(userId: number): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { userId },
      relations: ['user'],
    });
  }

  async findOne(id: number, userId: number): Promise<Task | null> {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
      relations: ['user'],
    });
    return task;
  }

  async update(
    id: number,
    updateTaskDto: Partial<Task>,
    userId: number
  ): Promise<Task> {
    await this.taskRepository.update({ id, userId }, updateTaskDto);

    const updatedTask = await this.findOne(id, userId);
    if (!updatedTask) {
      throw new Error('Task not found');
    }
    return updatedTask;
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.taskRepository.delete({ id, userId });
  }

  async findAllInOrganization(userId: number): Promise<Task[]> {
    const accessibleUserIds = await this.rbacService.getAccessibleUserIds(
      userId,
      'sub'
    );
    return await this.taskRepository.find({
      where: { userId: In(accessibleUserIds) },
      relations: ['user'],
    });
  }

  async getAuditLogs(userId: number): Promise<any[]> {
    return [
      {
        id: 1,
        action: 'task_created',
        userId,
        timestamp: new Date(),
        details: 'Sample audit log entry',
      },
    ];
  }

  async findAllInOwnOrganization(userId: number): Promise<Task[]> {
    // Get users only in the same organization
    const accessibleUserIds = await this.rbacService.getAccessibleUserIds(
      userId,
      'own'
    );

    return await this.taskRepository.find({
      where: { userId: In(accessibleUserIds) },
      relations: ['user'],
    });
  }

  async findAllAcrossOrganizations(userId: number): Promise<Task[]> {
    // Get all users across all organizations (owner/admin only)
    const accessibleUserIds = await this.rbacService.getAccessibleUserIds(
      userId,
      'all'
    );

    return await this.taskRepository.find({
      where: { userId: In(accessibleUserIds) },
      relations: ['user'],
    });
  }

  async getOrganizationStats(userId: number): Promise<{
    totalTasks: number;
    ownOrgTasks: number;
    subOrgTasks: number;
    hierarchy: any;
  }> {
    const hierarchy = await this.rbacService.getOrganizationHierarchy(userId);
    const accessibleUserIds = await this.rbacService.getAccessibleUserIds(
      userId,
      'sub'
    );
    const ownOrgUserIds = await this.rbacService.getAccessibleUserIds(
      userId,
      'own'
    );

    const totalTasks = await this.taskRepository.count({
      where: { userId: In(accessibleUserIds) },
    });

    const ownOrgTasks = await this.taskRepository.count({
      where: { userId: In(ownOrgUserIds) },
    });

    const subOrgTasks = totalTasks - ownOrgTasks;

    return {
      totalTasks,
      ownOrgTasks,
      subOrgTasks,
      hierarchy,
    };
  }
}
