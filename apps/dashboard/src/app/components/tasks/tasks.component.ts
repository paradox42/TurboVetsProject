import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, AssignableUser } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskFilters,
  TaskListFilters,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../../models/task.model';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, DragDropModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
})
export class TasksComponent implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Signals for reactive state
  tasks = signal<Task[]>([]);
  filteredTasks = signal<Task[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedTask = signal<Task | null>(null);
  showTaskForm = signal(false);
  isEditing = signal(false);
  assignableUsers = signal<AssignableUser[]>([]);

  // Drag and drop state
  draggedTask = signal<Task | null>(null);

  // Filter form
  filterForm: FormGroup;

  // Computed values
  taskStats = computed(() => {
    const tasks = this.tasks();
    const total = tasks.length;
    const byStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<TaskStatus, number>);

    const byPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<TaskPriority, number>);

    const today = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(
      (task) => task.dueDate && task.dueDate < today && task.status !== TaskStatus.COMPLETED
    ).length;

    const dueToday = tasks.filter(
      (task) => task.dueDate === today && task.status !== TaskStatus.COMPLETED
    ).length;

    return { total, byStatus, byPriority, overdue, dueToday };
  });

  // Task form
  taskForm: FormGroup;

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      status: ['all'],
      priority: ['all'],
      assigneeId: ['all'],
      sortBy: ['createdAt'],
      sortOrder: ['desc'],
    });

    this.taskForm = this.fb.group({
      title: [''],
      description: [''],
      status: [TaskStatus.PENDING],
      priority: [TaskPriority.MEDIUM],
      assigneeId: [null],
      dueDate: [''],
    });
  }

  ngOnInit(): void {
    this.loadTasks();
    this.loadAssignableUsers();

    // Watch filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Use appropriate API based on user role
    const taskObservable =
      this.authService.isAdmin() || this.authService.isOwner()
        ? this.taskService.getAllTasksAdmin()
        : this.taskService.getAllTasks();

    taskObservable.subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load tasks');
        this.isLoading.set(false);
        console.error('Error loading tasks:', error);
      },
    });
  }

  loadAssignableUsers(): void {
    this.taskService.getAssignableUsers().subscribe({
      next: (users) => {
        this.assignableUsers.set(users);
      },
      error: (error) => {
        console.error('Error loading assignable users:', error);
      },
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.tasks()];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    // Apply assignee filter
    if (filters.assigneeId !== 'all') {
      if (filters.assigneeId === 'unassigned') {
        filtered = filtered.filter((task) => !task.assigneeId);
      } else {
        filtered = filtered.filter((task) => task.assigneeId === filters.assigneeId);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = this.getSortValue(a, filters.sortBy);
      const bValue = this.getSortValue(b, filters.sortBy);

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    this.filteredTasks.set(filtered);
  }

  private getSortValue(task: Task, sortBy: string): any {
    switch (sortBy) {
      case 'title':
        return task.title.toLowerCase();
      case 'status':
        return task.status;
      case 'priority':
        return task.priority;
      case 'dueDate':
        return task.dueDate || '';
      case 'createdAt':
        return task.createdAt;
      default:
        return task.createdAt;
    }
  }

  openTaskForm(task?: Task): void {
    if (task) {
      this.isEditing.set(true);
      this.selectedTask.set(task);
      this.taskForm.patchValue({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate || '',
      });
    } else {
      this.isEditing.set(false);
      this.selectedTask.set(null);
      this.taskForm.setValue({
        title: '',
        description: '',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        assigneeId: null,
        dueDate: '',
      });
    }
    this.showTaskForm.set(true);
  }

  closeTaskForm(): void {
    this.showTaskForm.set(false);
    this.selectedTask.set(null);
    this.isEditing.set(false);
    this.taskForm.reset();
  }

  saveTask(): void {
    if (this.taskForm.valid) {
      const formData = this.taskForm.value;

      if (this.isEditing()) {
        const taskId = this.selectedTask()!.id;
        const updateData: UpdateTaskRequest = {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          assigneeId: formData.assigneeId || undefined,
          dueDate: formData.dueDate || undefined,
        };

        this.taskService.updateTask(taskId, updateData).subscribe({
          next: () => {
            this.loadTasks();
            this.closeTaskForm();
          },
          error: (error) => {
            this.error.set('Failed to update task');
            console.error('Error updating task:', error);
          },
        });
      } else {
        const createData: CreateTaskRequest = {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          assigneeId: formData.assigneeId || undefined,
          dueDate: formData.dueDate || undefined,
        };

        this.taskService.createTask(createData).subscribe({
          next: () => {
            this.loadTasks();
            this.closeTaskForm();
          },
          error: (error) => {
            this.error.set('Failed to create task');
            console.error('Error creating task:', error);
          },
        });
      }
    }
  }

  deleteTask(task: Task): void {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error) => {
          this.error.set('Failed to delete task');
          console.error('Error deleting task:', error);
        },
      });
    }
  }

  updateTaskStatus(task: Task, status: TaskStatus): void {
    const updateData: UpdateTaskRequest = { status };
    this.taskService.updateTask(task.id, updateData).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (error) => {
        this.error.set('Failed to update task status');
        console.error('Error updating task status:', error);
      },
    });
  }

  // Helper methods for template
  getPriorityText(priority: string): string {
    // Priority is now always a string from the backend
    return priority;
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.PENDING:
        return 'status-pending';
      case TaskStatus.IN_PROGRESS:
        return 'status-in-progress';
      case TaskStatus.COMPLETED:
        return 'status-completed';
      case TaskStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return 'priority-low';
      case TaskPriority.MEDIUM:
        return 'priority-medium';
      case TaskPriority.HIGH:
        return 'priority-high';
      case TaskPriority.URGENT:
        return 'priority-urgent';
      default:
        return '';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
    return new Date(task.dueDate) < new Date();
  }

  // Helper method to get user name by ID
  getUserName(userId: number): string {
    const user = this.assignableUsers().find(u => u.id === userId);
    return user ? `${user.name} (${user.email})` : 'Unknown User';
  }

  // Helper method to get tasks by status for Kanban board
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.filteredTasks().filter(task => task.status === status);
  }

  // Drag and drop methods
  onTaskDragStarted(event: any, task: Task): void {
    this.draggedTask.set(task);
  }

  onTaskDragEnded(event: any): void {
    this.draggedTask.set(null);
  }

  onStatusDrop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus): void {
    console.log('Drop event:', event);
    console.log('New status:', newStatus);
    
    if (event.previousContainer === event.container) {
      // Reordering within the same status column
      console.log('Reordering within same column');
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateTaskOrder();
    } else {
      // Moving between different status columns
      const task = event.previousContainer.data[event.previousIndex];
      console.log('Moving task between columns:', task);
      
      if (task) {
        // Update the task status in the backend
        this.updateTaskStatus(task, newStatus);
        
        // Update local state immediately for better UX
        this.updateLocalTaskStatus(task.id, newStatus);
      }
    }
  }

  private updateTaskOrder(): void {
    // Refresh the filtered tasks to reflect any reordering
    this.applyFilters();
  }

  private updateLocalTaskStatus(taskId: number, newStatus: TaskStatus): void {
    // Update the task status in the local state immediately
    const currentTasks = this.tasks();
    console.log('Current tasks before update:', currentTasks.length);
    
    const updatedTasks = currentTasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    
    console.log('Updated tasks after status change:', updatedTasks.length);
    console.log('Task with new status:', updatedTasks.find(t => t.id === taskId));
    
    this.tasks.set(updatedTasks);
    this.applyFilters();
  }

  // Enum getters for template
  get TaskStatus() {
    return TaskStatus;
  }
  get TaskPriority() {
    return TaskPriority;
  }
}
