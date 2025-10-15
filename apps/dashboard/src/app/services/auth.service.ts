import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  organization?: {
    id: number;
    name: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // Signals for reactive state management
  private _isAuthenticated = signal(false);
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);

  // Public readonly signals
  public readonly isAuthenticated = this._isAuthenticated.asReadonly();
  public readonly user = this._user.asReadonly();
  public readonly token = this._token.asReadonly();

  // Computed signals
  public readonly userRoles = computed(() => this._user()?.roles || []);
  public readonly isAdmin = computed(() => this.userRoles().includes('admin'));
  public readonly isOwner = computed(() => this.userRoles().includes('owner'));
  public readonly isViewer = computed(() => this.userRoles().includes('viewer'));

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const user = localStorage.getItem(this.USER_KEY);
    
    if (token && user) {
      try {
        this._token.set(token);
        this._user.set(JSON.parse(user));
        this._isAuthenticated.set(true);
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setAuthData(response.access_token, response.user);
        }),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  register(userData: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        tap(response => {
          this.setAuthData(response.access_token, response.user);
        }),
        catchError(error => {
          console.error('Registration error:', error);
          throw error;
        })
      );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  private setAuthData(token: string, user: User): void {
    this._token.set(token);
    this._user.set(user);
    this._isAuthenticated.set(true);
    
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearAuth(): void {
    this._token.set(null);
    this._user.set(null);
    this._isAuthenticated.set(false);
    
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this._token();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  refreshToken(): Observable<LoginResponse> {
    // This would typically call a refresh endpoint
    // For now, we'll just return the current token
    const token = this._token();
    const user = this._user();
    
    if (token && user) {
      return of({ access_token: token, user });
    }
    
    throw new Error('No valid token to refresh');
  }
}
