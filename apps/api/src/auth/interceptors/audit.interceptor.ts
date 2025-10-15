import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { AuditService } from '../audit.service';
  import { Request } from 'express';
  
  @Injectable()
  export class AuditInterceptor implements NestInterceptor {
    constructor(private auditService: AuditService) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest<Request>();
      const user = (request as any).user;
      const method = request.method;
      const url = request.url;
      const ipAddress = request.ip || request.connection.remoteAddress;
      const userAgent = request.get('User-Agent');
  
      // Map HTTP methods to actions
      const actionMap = {
        'GET': 'read',
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'update',
        'DELETE': 'delete',
      } as const;

      const action = actionMap[method as keyof typeof actionMap] || 'unknown';
      const resource = this.extractResource(url);

      return next.handle().pipe(
        tap({
          next: () => {
            // Log successful actions
            this.auditService.logAction(
              user?.id || null,
              action,
              resource,
              'success',
              { method, url },
              ipAddress,
              userAgent,
            );
          },
          error: (error) => {
            // Log failed actions
            this.auditService.logAction(
              user?.id || null,
              action,
              resource,
              'failure',
              { method, url, error: error.message },
              ipAddress,
              userAgent,
            );
          },
        }),
      );
    }
  
    private extractResource(url: string): string {
      if (url.includes('/auth')) return 'auth';
      if (url.includes('/tasks')) return 'tasks';
      if (url.includes('/users')) return 'users';
      return 'unknown';
    }
  }