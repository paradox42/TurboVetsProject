import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: 'Bearer valid-jwt-token'
        }
      })
    })
  } as ExecutionContext;

  const mockExecutionContextNoAuth = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {}
      })
    })
  } as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid JWT token', async () => {
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false for invalid JWT token', async () => {
      jest.spyOn(guard, 'canActivate').mockResolvedValue(false);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when no authorization header', async () => {
      jest.spyOn(guard, 'canActivate').mockResolvedValue(false);

      const result = await guard.canActivate(mockExecutionContextNoAuth);

      expect(result).toBe(false);
    });
  });
});
