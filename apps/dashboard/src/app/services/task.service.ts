import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get all tasks (role-based filtering handled by API)
  getAllTasks(filters?: TaskFilters): Observable<Task[]> {
    let url = `${this.API_URL}/tasks`;
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.assigneeId) {
      params.append('assigneeId', filters.assigneeId.toString());
    }
    if (filters?.organizationId) {
      params.append('organizationId', filters.organizationId.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<Task[]>(url, { headers: this.getHeaders() });
  }

  // Get tasks for admin (all tasks across organizations)
  getAllTasksAdmin(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.API_URL}/tasks/admin/all`, { 
      headers: this.getHeaders() 
    });
  }

  // Get tasks within organization
  getTasksInOrganization(organizationId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.API_URL}/tasks/organization/${organizationId}`, { 
      headers: this.getHeaders() 
    });
  }

  // Get single task
  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.API_URL}/tasks/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  // Create new task
  createTask(taskData: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.API_URL}/tasks`, taskData, { 
      headers: this.getHeaders() 
    });
  }

  // Update task
  updateTask(id: number, taskData: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.API_URL}/tasks/${id}`, taskData, { 
      headers: this.getHeaders() 
    });
  }

  // Delete task
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/tasks/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  // Get organization statistics
  getOrganizationStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/tasks/organization/stats`, { 
      headers: this.getHeaders() 
    });
  }

  // Get organization hierarchy
  getOrganizationHierarchy(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/tasks/organization/hierarchy`, { 
      headers: this.getHeaders() 
    });
  }
}
