import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';

const mockUserModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
});

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
          useFactory: mockUserModel,
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
    userModel.create.mockResolvedValue({ _id: '123', email: 'test@example.com', name: 'Test User' });
    const result = await service.validateOAuthLogin('test@example.com', 'Test User');
    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(userModel.create).toHaveBeenCalledWith({ email: 'test@example.com', name: 'Test User' });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: '123', email: 'test@example.com', name: 'Test User' });
    expect(result.token).toBe('signed-jwt-token');
    expect(result.user).toEqual({ _id: '123', email: 'test@example.com', name: 'Test User' });
  });

  it('should return existing user and generate a token if user exists', async () => {
    userModel.findOne.mockResolvedValue({ _id: '456', email: 'exist@example.com', name: 'Exist User' });
    const result = await service.validateOAuthLogin('exist@example.com', 'Exist User');
    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'exist@example.com' });
    expect(userModel.create).not.toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: '456', email: 'exist@example.com', name: 'Exist User' });
    expect(result.token).toBe('signed-jwt-token');
    expect(result.user).toEqual({ _id: '456', email: 'exist@example.com', name: 'Exist User' });
  });

  it('should find user by id', async () => {
    userModel.findById.mockResolvedValue({ _id: '789', email: 'find@example.com', name: 'Find User' });
    const user = await service.findUserById('789');
    expect(userModel.findById).toHaveBeenCalledWith('789');
    expect(user).toEqual({ _id: '789', email: 'find@example.com', name: 'Find User' });
  });
}); 