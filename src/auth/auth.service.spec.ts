import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';

const mockUser = {
  _id: '123',
  email: 'test@example.com',
  name: 'Test User',
  googleId: 'google123',
  accessToken: 'test-token',
  refreshToken: 'test-refresh-token',
};

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<User>;
  let jwtService: JwtService;
  let mockUserModel: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
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
    userModel = module.get<Model<User>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);

    mockUserModel = {
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn().mockImplementation((_id, update) => Promise.resolve({ ...mockUser, ...update })),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new user and generate a token if user does not exist', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'test-access-token',
    };

    jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
    jest.spyOn(userModel, 'create').mockResolvedValue(mockUser as any);

    const result = await service.validateOAuthLogin('test@example.com', 'Test User', 'test-access-token');

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(userModel.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'test-access-token',
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: '123',
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(result.token).toBe('signed-jwt-token');
    expect(result.user).toEqual({
      _id: '123',
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'test-access-token',
    });
  });

  it('should return existing user and generate a token if user exists', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'old-token',
    };

    jest.spyOn(userModel, 'findOne').mockResolvedValue(mockUser as any);
    jest.spyOn(userModel, 'findByIdAndUpdate').mockResolvedValue({
      ...mockUser,
      accessToken: 'test-access-token',
    } as any);

    const result = await service.validateOAuthLogin('test@example.com', 'Test User', 'test-access-token');

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('123', {
      accessToken: 'test-access-token',
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: '123',
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(result.token).toBe('signed-jwt-token');
    expect(result.user).toEqual({
      _id: '123',
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'test-access-token',
    });
  });
}); 