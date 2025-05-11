import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';

const mockUser = {
  _id: '123',
  email: 'test@example.com',
  name: 'Test User',
  accessToken: 'test-access-token',
};

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should create a new user and generate a token if user does not exist', async () => {
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue(mockUser);
    
    const result = await service.validateOAuthLogin('test@example.com', 'Test User', 'test-access-token');
    
    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(userModel.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'test-access-token',
    });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: '123', email: 'test@example.com', name: 'Test User' });
    expect(result.token).toBe('signed-jwt-token');
    expect(result.user).toEqual(mockUser);
  });

  it('should return existing user and generate a token if user exists', async () => {
    const existingUser = { ...mockUser, _id: '456' };
    userModel.findOne.mockResolvedValue(existingUser);
    userModel.findByIdAndUpdate.mockResolvedValue(existingUser);
    
    const result = await service.validateOAuthLogin('test@example.com', 'Test User', 'test-access-token');
    
    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '456',
      { accessToken: 'test-access-token' },
      { new: true }
    );
    expect(userModel.create).not.toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: '456', email: 'test@example.com', name: 'Test User' });
    expect(result.token).toBe('signed-jwt-token');
    expect(result.user).toEqual(existingUser);
  });

  it('should find user by id', async () => {
    const mockUser = { _id: '789', email: 'find@example.com', name: 'Find User', accessToken: 'test-token' };
    userModel.findById.mockResolvedValue(mockUser);
    
    const user = await service.findUserById('789');
    
    expect(userModel.findById).toHaveBeenCalledWith('789');
    expect(user).toEqual(mockUser);
  });

  it('should return null when user is not found by id', async () => {
    userModel.findById.mockResolvedValue(null);
    
    const user = await service.findUserById('nonexistent');
    
    expect(userModel.findById).toHaveBeenCalledWith('nonexistent');
    expect(user).toBeNull();
  });
}); 