import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuditService {
  private readonly auditLogPath: string;

  constructor() {
    // Create logs directory if it doesn't exist
    this.auditLogPath = path.join(process.cwd(), 'logs', 'audit.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    const logDir = path.dirname(this.auditLogPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async logAction(
    userId: number | null,
    action: string,
    resource: string,
    status: 'success' | 'failure' | 'denied' = 'success',
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      userId: userId || 'anonymous',
      action,
      resource,
      status,
      details: details || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    };

    // Format log entry
    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      // Append to audit log file
      fs.appendFileSync(this.auditLogPath, logLine);
      
      // Also log to console for development
      console.log(`[AUDIT] ${timestamp} - User ${userId || 'anonymous'} ${action} ${resource} - ${status}`);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async getAuditLogs(limit: number = 100): Promise<any[]> {
    try {
      if (!fs.existsSync(this.auditLogPath)) {
        return [];
      }

      const logContent = fs.readFileSync(this.auditLogPath, 'utf8');
      const logLines = logContent.trim().split('\n').filter(line => line.trim());
      
      // Parse JSON lines and reverse to get newest first
      const logs = logLines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null)
        .reverse()
        .slice(0, limit);

      return logs;
    } catch (error) {
      console.error('Failed to read audit logs:', error);
      return [];
    }
  }

  async clearAuditLogs() {
    try {
      if (fs.existsSync(this.auditLogPath)) {
        fs.writeFileSync(this.auditLogPath, '');
        console.log('Audit logs cleared');
      }
    } catch (error) {
      console.error('Failed to clear audit logs:', error);
    }
  }
}