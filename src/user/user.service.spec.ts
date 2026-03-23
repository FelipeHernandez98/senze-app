import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { StatesEnum } from 'src/common/enums/states.enum';

describe('UserService', () => {
  let service: UserService;
  let userRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed-password');
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a user with hashed password and sanitized response', async () => {
    const dto = {
      username: 'andres',
      firstName: 'Andres',
      lastName: 'Hernandez',
      password: 'Secret123',
    };
    const createdUser = {
      id: 'user-1',
      ...dto,
      password: 'hashed-password',
      roleId: 1,
      stateId: StatesEnum.ACTIVE,
      createdAt: new Date('2026-03-15T00:00:00.000Z'),
    };

    userRepository.findOne.mockResolvedValue(null);
    userRepository.create.mockReturnValue(createdUser);
    userRepository.save.mockResolvedValue(createdUser);

    const result = await service.create(dto as any);

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'andres',
        password: 'hashed-password',
        roleId: 1,
        stateId: StatesEnum.ACTIVE,
      }),
    );
    expect(result).not.toHaveProperty('password');
  });

  it('throws when there are no users', async () => {
    userRepository.find.mockResolvedValue([]);

    await expect(service.findAll()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hashes password during update and returns sanitized user', async () => {
    userRepository.findOne
      .mockResolvedValueOnce({ id: 'user-1', username: 'andres' })
      .mockResolvedValueOnce({
        id: 'user-1',
        username: 'andres',
        firstName: 'Andres',
        lastName: 'Hernandez',
        password: 'hashed-password',
        roleId: 1,
        stateId: StatesEnum.ACTIVE,
      });
    userRepository.update.mockResolvedValue(undefined);

    const result = await service.update('user-1', { password: 'NewSecret123' } as any);

    expect(userRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ password: 'hashed-password' }),
    );
    expect(result).not.toHaveProperty('password');
  });

  it('returns a token when login credentials are valid', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      username: 'andres',
      password: 'hashed-password',
      roleId: 1,
    });

    const result = await service.login({ username: 'andres', password: 'Secret123' });

    expect(jwtService.sign).toHaveBeenCalledWith({ id: 'user-1', roleId: 1 });
    expect(result).toEqual({ token: 'signed-token' });
  });

  it('rejects invalid login credentials', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      username: 'andres',
      password: 'hashed-password',
      roleId: 1,
    });
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    await expect(service.login({ username: 'andres', password: 'bad-password' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
