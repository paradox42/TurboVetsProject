import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
      relations: ['user']
    });
  }

  async findOne(id: number, userId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
      relations: ['user']
    });
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }


  async update(id: number, updateTaskDto: Partial<Task>, userId: number): Promise<Task> {
    await this.taskRepository.update({ id, userId }, updateTaskDto);
    return await this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.taskRepository.delete({ id, userId });
  }
}