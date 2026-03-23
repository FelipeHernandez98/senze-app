import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SaleService } from './sale.service';
import { Sale } from './entities/sale.entity';
import { Client } from 'src/client/entities/client.entity';

describe('SaleService', () => {
  let service: SaleService;
  let saleRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let clientRepository: {
    findOne: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    saleRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    clientRepository = {
      findOne: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleService,
        {
          provide: getRepositoryToken(Sale),
          useValue: saleRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: clientRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<SaleService>(SaleService);
  });

  it('rejects creating a sale when the client does not exist', async () => {
    clientRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({ clientId: 'missing-client', details: [] } as any, { id: 'user-1' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a sale, updates stock and calculates total', async () => {
    const client = { id: 'client-1' };
    const product = { id: 'product-1', reference: 'REF-01', stock: 5, price: 10 };
    const savedSale = { id: 'sale-1', total: 0, client };
    const finalSale = {
      id: 'sale-1',
      total: 20,
      client,
      user: { id: 'user-1' },
      details: [{ product, quantity: 2, price: 10 }],
    };
    const qb = {
      select: jest.fn(),
      getRawOne: jest.fn(),
    };
    qb.select.mockReturnValue(qb);
    qb.getRawOne.mockResolvedValue({ max: '10' });

    const manager = {
      create: jest.fn((entity, payload) => payload),
      save: jest
        .fn()
        .mockResolvedValueOnce(savedSale)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(finalSale),
      findOne: jest.fn().mockResolvedValue(product),
      findOneOrFail: jest.fn().mockResolvedValue(finalSale),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    clientRepository.findOne.mockResolvedValue(client);
    dataSource.transaction.mockImplementation(async (callback: (manager: any) => unknown) => callback(manager));

    const result = await service.create(
      {
        clientId: 'client-1',
        details: [{ productId: 'product-1', quantity: 2 }],
      } as any,
      { id: 'user-1' } as any,
    );

    expect(manager.save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ stock: 3 }));
    expect(manager.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ invoiceNumber: 11 }),
    );
    expect(manager.save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 'sale-1', total: 20 }));
    expect(result).toEqual(finalSale);
  });

  it('rejects creating a sale with insufficient stock', async () => {
    const client = { id: 'client-1' };
    const qb = {
      select: jest.fn(),
      getRawOne: jest.fn(),
    };
    qb.select.mockReturnValue(qb);
    qb.getRawOne.mockResolvedValue({ max: '10' });

    const manager = {
      create: jest.fn((entity, payload) => payload),
      save: jest.fn().mockResolvedValue({ id: 'sale-1' }),
      findOne: jest.fn().mockResolvedValue({ id: 'product-1', reference: 'REF-01', stock: 1, price: 15 }),
      findOneOrFail: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    clientRepository.findOne.mockResolvedValue(client);
    dataSource.transaction.mockImplementation(async (callback: (manager: any) => unknown) => callback(manager));

    await expect(
      service.create(
        {
          clientId: 'client-1',
          details: [{ productId: 'product-1', quantity: 2 }],
        } as any,
        { id: 'user-1' } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
