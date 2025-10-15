import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get user() {
    return this.authService.user();
  }

  get userRoles() {
    return this.authService.userRoles();
  }

  get isAdmin() {
    return this.authService.isAdmin();
  }

  get isOwner() {
    return this.authService.isOwner();
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToTasks(): void {
    this.router.navigate(['/tasks']);
  }

  navigateToOrganization(): void {
    this.router.navigate(['/organization']);
  }

  navigateToAnalytics(): void {
    this.router.navigate(['/analytics']);
  }

  navigateToAuditLogs(): void {
    this.router.navigate(['/audit-logs']);
  }
}
