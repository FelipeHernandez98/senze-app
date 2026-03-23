import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    create: jest.Mock;
    CreateUserWithRole: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    login: jest.Mock;
    checkAuthStatus: jest.Mock;
  };

  beforeEach(() => {
    userService = {
      create: jest.fn(),
      CreateUserWithRole: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      login: jest.fn(),
      checkAuthStatus: jest.fn(),
    };

    controller = new UserController(userService as unknown as UserService);
  });

  it('delegates admin creation to the service', async () => {
    const dto = { username: 'admin' };
    const created = { id: 'user-1', username: 'admin' };
    userService.CreateUserWithRole.mockResolvedValue(created);

    await expect(controller.createAdmin(dto as any)).resolves.toEqual(created);
    expect(userService.CreateUserWithRole).toHaveBeenCalledWith(dto);
  });

  it('reads current user id in findOne', async () => {
    const user = { id: 'user-1' };
    const found = { id: 'user-1', username: 'andres' };
    userService.findOne.mockResolvedValue(found);

    await expect(controller.findOne(user as any)).resolves.toEqual(found);
    expect(userService.findOne).toHaveBeenCalledWith('user-1');
  });

  it('delegates login to the service', async () => {
    const dto = { username: 'andres', password: 'Secret123' };
    userService.login.mockResolvedValue({ token: 'signed-token' });

    await expect(controller.loginUser(dto as any)).resolves.toEqual({ token: 'signed-token' });
    expect(userService.login).toHaveBeenCalledWith(dto);
  });

  it('delegates auth status check to the service', async () => {
    const user = { id: 'user-1' };
    userService.checkAuthStatus.mockResolvedValue({ id: 'user-1', token: 'signed-token' });

    await expect(controller.checkAuthStatus(user as any)).resolves.toEqual({
      id: 'user-1',
      token: 'signed-token',
    });
  });
});
