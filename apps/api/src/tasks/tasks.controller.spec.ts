import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { RbacService } from '../auth/rbac.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { OrganizationScopeGuard } from '../auth/guards/organization-scope.guard';
import { AuditService } from '../auth/audit.service';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;
  let rbacService: RbacService;

  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    category: 'work',
    priority: 'high',
    dueDate: new Date(),
    userId: 1,
    assigneeId: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    organizationId: 1,
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: RbacService,
          useValue: {
            getAssignableUsers: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrganizationScopeGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
    rbacService = module.get<RbacService>(RbacService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        category: 'work',
        priority: 'high',
        dueDate: new Date(),
        assigneeId: 2,
      };

      jest.spyOn(tasksService, 'create').mockResolvedValue(mockTask as any);

      const result = await controller.create(mockRequest, createTaskDto);

      expect(result).toEqual(mockTask);
      expect(tasksService.create).toHaveBeenCalledWith({
        ...createTaskDto,
        userId: mockUser.id,
      });
    });
  });

  describe('findAll', () => {
    it('should return all tasks for user', async () => {
      const mockTasks = [mockTask];
      jest.spyOn(tasksService, 'findAll').mockResolvedValue(mockTasks as any);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockTasks);
      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('findOne', () => {
    it('should return a specific task', async () => {
      jest.spyOn(tasksService, 'findOne').mockResolvedValue(mockTask as any);

      const result = await controller.findOne(1, mockRequest);

      expect(result).toEqual(mockTask);
      expect(tasksService.findOne).toHaveBeenCalledWith(1, mockUser.id);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'in_progress',
        category: 'personal',
        priority: 'medium',
        dueDate: new Date(),
        assigneeId: 3,
      };

      const updatedTask = { ...mockTask, ...updateTaskDto };
      jest.spyOn(tasksService, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(tasksService, 'update').mockResolvedValue(updatedTask as any);

      const result = await controller.update(1, updateTaskDto, mockRequest);

      expect(result).toEqual(updatedTask);
      expect(tasksService.update).toHaveBeenCalledWith(1, updateTaskDto, mockUser.id);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      jest.spyOn(tasksService, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(tasksService, 'remove').mockResolvedValue(undefined);

      await controller.remove(1, mockRequest);

      expect(tasksService.remove).toHaveBeenCalledWith(1, mockUser.id);
    });
  });

  describe('getAssignableUsers', () => {
    it('should return assignable users', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          organization: { id: 1, name: 'Test Org' },
        },
        {
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
          organization: { id: 1, name: 'Test Org' },
        },
      ];

      jest.spyOn(rbacService, 'getAssignableUsers').mockResolvedValue(mockUsers as any);

      const result = await controller.getAssignableUsers(mockRequest);

      expect(result).toEqual(mockUsers);
      expect(rbacService.getAssignableUsers).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
