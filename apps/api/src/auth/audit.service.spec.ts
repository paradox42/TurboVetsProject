import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('AuditService', () => {
  let service: AuditService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get<AuditService>(AuditService);
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAction', () => {
    it('should log action with all parameters', async () => {
      const mockLogEntry = {
        timestamp: expect.any(String),
        userId: 1,
        action: 'create_task',
        resource: 'tasks',
        status: 'success',
        details: { taskId: 123 },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      mockedFs.appendFileSync.mockImplementation();

      await service.logAction(
        1,
        'create_task',
        'tasks',
        'success',
        { taskId: 123 },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(mockedFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('audit.log'),
        expect.stringContaining('create_task')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]')
      );
    });

    it('should log action with minimal parameters', async () => {
      const mockLogEntry = {
        timestamp: expect.any(String),
        userId: 'anonymous',
        action: 'login',
        resource: 'auth',
        status: 'success',
        details: null,
        ipAddress: null,
        userAgent: null
      };

      mockedFs.appendFileSync.mockImplementation();

      await service.logAction(null, 'login', 'auth');

      expect(mockedFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('audit.log'),
        expect.stringContaining('login')
      );
    });

    it('should handle file write errors gracefully', async () => {
      mockedFs.appendFileSync.mockImplementation(() => {
        throw new Error('File write error');
      });

      await service.logAction(1, 'test_action', 'test_resource');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to write audit log:',
        expect.any(Error)
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return parsed audit logs', async () => {
      const mockLogContent = JSON.stringify({
        timestamp: '2024-01-01T00:00:00.000Z',
        userId: 1,
        action: 'create_task',
        resource: 'tasks',
        status: 'success'
      }) + '\n' + JSON.stringify({
        timestamp: '2024-01-01T01:00:00.000Z',
        userId: 2,
        action: 'update_task',
        resource: 'tasks',
        status: 'success'
      });

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(mockLogContent);

      const result = await service.getAuditLogs();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        timestamp: '2024-01-01T01:00:00.000Z',
        userId: 2,
        action: 'update_task',
        resource: 'tasks',
        status: 'success'
      });
      expect(result[1]).toEqual({
        timestamp: '2024-01-01T00:00:00.000Z',
        userId: 1,
        action: 'create_task',
        resource: 'tasks',
        status: 'success'
      });
    });

    it('should return empty array when log file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = await service.getAuditLogs();

      expect(result).toEqual([]);
    });

    it('should limit results to specified limit', async () => {
      const mockLogContent = Array.from({ length: 5 }, (_, i) => 
        JSON.stringify({
          timestamp: `2024-01-0${i + 1}T00:00:00.000Z`,
          userId: i + 1,
          action: 'test_action',
          resource: 'test_resource',
          status: 'success'
        })
      ).join('\n');

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(mockLogContent);

      const result = await service.getAuditLogs(3);

      expect(result).toHaveLength(3);
    });

    it('should handle file read errors gracefully', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = await service.getAuditLogs();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to read audit logs:',
        expect.any(Error)
      );
    });

    it('should filter out invalid JSON lines', async () => {
      const mockLogContent = 
        JSON.stringify({ valid: 'log' }) + '\n' +
        'invalid json line\n' +
        JSON.stringify({ another: 'valid' });

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(mockLogContent);

      const result = await service.getAuditLogs();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ another: 'valid' });
      expect(result[1]).toEqual({ valid: 'log' });
    });
  });

  describe('clearAuditLogs', () => {
    it('should clear audit logs when file exists', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.writeFileSync.mockImplementation();

      await service.clearAuditLogs();

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('audit.log'),
        ''
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Audit logs cleared');
    });

    it('should handle clear errors gracefully', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('File write error');
      });

      await service.clearAuditLogs();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to clear audit logs:',
        expect.any(Error)
      );
    });

    it('should not attempt to clear when file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      await service.clearAuditLogs();

      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});
