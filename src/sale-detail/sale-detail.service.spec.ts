import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SaleDetailService } from './sale-detail.service';
import { SaleDetail } from './entities/sale-detail.entity';

describe('SaleDetailService', () => {
  let service: SaleDetailService;
  let saleDetailRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    saleDetailRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleDetailService,
        {
          provide: getRepositoryToken(SaleDetail),
          useValue: saleDetailRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<SaleDetailService>(SaleDetailService);
  });

  it('requires saleId for direct creation', async () => {
    await expect(service.create({ productId: 'product-1', quantity: 1 } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates a detail, decreases stock and recalculates sale total', async () => {
    const sale = { id: 'sale-1' };
    const product = { id: 'product-1', reference: 'REF-01', stock: 5, price: 10 };
    const savedDetail = { id: 'detail-1', sale, product, quantity: 2, price: 10 };
    const hydratedDetail = { ...savedDetail, product: { ...product, stock: 3 } };
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(sale)
        .mockResolvedValueOnce(product)
        .mockResolvedValueOnce({ id: 'sale-1', details: [{ price: 10, quantity: 2 }] }),
      save: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(savedDetail)
        .mockResolvedValueOnce(undefined),
      create: jest.fn((entity, payload) => payload),
      findOneOrFail: jest.fn().mockResolvedValue(hydratedDetail),
    };

    dataSource.transaction.mockImplementation(async (callback: (manager: any) => unknown) => callback(manager));

    const result = await service.create({ saleId: 'sale-1', productId: 'product-1', quantity: 2 } as any);

    expect(manager.save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ stock: 3 }));
    expect(manager.save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 'sale-1', total: 20 }));
    expect(result).toEqual(hydratedDetail);
  });

  it('returns ordered details with relations', async () => {
    const details = [{ id: 'detail-1' }];
    saleDetailRepository.find.mockResolvedValue(details);

    const result = await service.findAll();

    expect(saleDetailRepository.find).toHaveBeenCalledWith({
      relations: { sale: true, product: true },
      order: { id: 'DESC' },
    });
    expect(result).toEqual(details);
  });
});
