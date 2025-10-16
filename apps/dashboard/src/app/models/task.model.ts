export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number;
  assignee?: {
    id: number;
    name: string;
    email: string;
  };
  organizationId: number;
  organization?: {
    id: number;
    name: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  dueDate?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  organizationId?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface TaskStats {
  total: number;
  byStatus: {
    [key in TaskStatus]: number;
  };
  byPriority: {
    [key in TaskPriority]: number;
  };
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

// UI Helper types
export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number | null;
  dueDate: string;
}

export interface TaskListFilters {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  assigneeId: number | 'all' | 'unassigned';
  sortBy: 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
