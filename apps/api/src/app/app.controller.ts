import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
//TypeORM:
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Organization, Role, Permission, Task } from '../entities';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('test-db')
  async testDb() {
    const userCount = await this.userRepository.count();
    const orgCount = await this.organizationRepository.count();
    const roleCount = await this.roleRepository.count();
    const permissionCount = await this.permissionRepository.count();
    const taskCount = await this.taskRepository.count();
    return {
      message: 'Database connected!',
      userCount,
      organizationCount: orgCount,
      roleCount,
      permissionCount,
      taskCount,
    };
  }
}
