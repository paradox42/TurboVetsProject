import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { RbacService } from '../auth/rbac.service';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: RbacService,
          useValue: {
            getAccessibleUserIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        status: 'pending',
        category: 'work',
        priority: 'high',
        dueDate: new Date(),
        userId: 1,
        assigneeId: 2,
      };

      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask as any);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask as any);

      const result = await service.create(createTaskDto);

      expect(result).toEqual(mockTask);
      expect(taskRepository.create).toHaveBeenCalledWith(createTaskDto);
      expect(taskRepository.save).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a user', async () => {
      const mockTasks = [mockTask];
      jest.spyOn(taskRepository, 'find').mockResolvedValue(mockTasks as any);

      const result = await service.findAll(1);

      expect(result).toEqual(mockTasks);
      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: ['user'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a specific task', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        relations: ['user'],
      });
    });

    it('should return null if task not found', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999, 1);

      expect(result).toBeNull();
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
      jest.spyOn(taskRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(updatedTask as any);

      const result = await service.update(1, updateTaskDto, 1);

      expect(result).toEqual(updatedTask);
      expect(taskRepository.update).toHaveBeenCalledWith({ id: 1, userId: 1 }, updateTaskDto);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        relations: ['user'],
      });
    });

    it('should throw error if task not found', async () => {
      jest.spyOn(taskRepository, 'update').mockResolvedValue({ affected: 0 } as any);
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(999, {}, 1)).rejects.toThrow('Task not found');
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      jest.spyOn(taskRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, 1);

      expect(taskRepository.delete).toHaveBeenCalledWith({ id: 1, userId: 1 });
    });
  });
});
