import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientService } from './client.service';
import { Client } from './entities/client.entity';

describe('ClientService', () => {
  let service: ClientService;
  let clientRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    clientRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getRepositoryToken(Client),
          useValue: clientRepository,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
  });

  it('rejects duplicate phone or document on create', async () => {
    clientRepository.findOne.mockResolvedValue({ id: 'client-1' });

    await expect(
      service.create({ phone: '3000000000', documentNumber: '123' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns ordered clients from repository', async () => {
    const clients = [{ id: 'client-1' }, { id: 'client-2' }];
    clientRepository.find.mockResolvedValue(clients);

    const result = await service.findAll();

    expect(clientRepository.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    expect(result).toEqual(clients);
  });

  it('rejects updating to an existing phone or document', async () => {
    clientRepository.findOne
      .mockResolvedValueOnce({ id: 'client-1', phone: '300', documentNumber: '123' })
      .mockResolvedValueOnce({ id: 'client-2', phone: '301', documentNumber: '999' });

    await expect(service.update('client-1', { phone: '301' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws when deleting a missing client', async () => {
    clientRepository.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
