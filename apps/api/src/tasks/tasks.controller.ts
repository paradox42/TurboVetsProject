import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: { 
    title: string; 
    description?: string; 
    userId: number; 
    category?: string;
    priority?: number;
    dueDate?: Date;
  }) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll(@Body() body: { userId: number }) {
    return this.tasksService.findAll(body.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Body() body: { userId: number }) {
    return this.tasksService.findOne(+id, body.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: any, @Body() body: { userId: number }) {
    return this.tasksService.update(+id, updateTaskDto, body.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body() body: { userId: number }) {
    return this.tasksService.remove(+id, body.userId);
  }
}