import { ClientController } from './client.controller';
import { ClientService } from './client.service';

describe('ClientController', () => {
  let controller: ClientController;
  let clientService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    clientService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new ClientController(clientService as unknown as ClientService);
  });

  it('delegates create to the service', async () => {
    const dto = { firstName: 'Ana', lastName: 'Lopez' };
    const created = { id: 'client-1', ...dto };
    clientService.create.mockResolvedValue(created);

    await expect(controller.create(dto as any)).resolves.toEqual(created);
    expect(clientService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates findOne to the service', async () => {
    const client = { id: 'client-1' };
    clientService.findOne.mockResolvedValue(client);

    await expect(controller.findOne('client-1')).resolves.toEqual(client);
    expect(clientService.findOne).toHaveBeenCalledWith('client-1');
  });

  it('delegates remove to the service', async () => {
    clientService.remove.mockResolvedValue(undefined);

    await expect(controller.remove('client-1')).resolves.toBeUndefined();
    expect(clientService.remove).toHaveBeenCalledWith('client-1');
  });
});
