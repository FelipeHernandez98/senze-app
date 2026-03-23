import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { Sale } from 'src/sale/entities/sale.entity';
import { SaleDetail } from 'src/sale-detail/entities/sale-detail.entity';
import { Product } from 'src/product/entities/product.entity';

type MockQueryBuilder = {
  innerJoin: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  groupBy: jest.Mock;
  addGroupBy: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  getRawOne: jest.Mock;
  getRawMany: jest.Mock;
  getMany: jest.Mock;
};

const createMockQueryBuilder = (): MockQueryBuilder => {
  const qb = {
    innerJoin: jest.fn(),
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
    addGroupBy: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
  } as MockQueryBuilder;

  qb.innerJoin.mockReturnValue(qb);
  qb.select.mockReturnValue(qb);
  qb.addSelect.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.groupBy.mockReturnValue(qb);
  qb.addGroupBy.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.limit.mockReturnValue(qb);

  return qb;
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let saleRepository: { createQueryBuilder: jest.Mock };
  let saleDetailRepository: { createQueryBuilder: jest.Mock };
  let productRepository: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    saleRepository = { createQueryBuilder: jest.fn() };
    saleDetailRepository = { createQueryBuilder: jest.fn() };
    productRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Sale),
          useValue: saleRepository,
        },
        {
          provide: getRepositoryToken(SaleDetail),
          useValue: saleDetailRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should calculate dashboard values and average ticket', async () => {
    const serviceAny = service as any;

    jest.spyOn(serviceAny, 'getSalesTotal').mockResolvedValueOnce(200).mockResolvedValueOnce(1200);
    jest.spyOn(serviceAny, 'getSalesCount').mockResolvedValueOnce(4);
    jest.spyOn(serviceAny, 'getUnitsSold').mockResolvedValueOnce(15);
    jest.spyOn(serviceAny, 'getSalesTrend').mockResolvedValueOnce([
      { date: '2026-03-10', total: 150, salesCount: 3 },
      { date: '2026-03-11', total: 50, salesCount: 1 },
    ]);

    const result = await service.getDashboard({ trendDays: 2 });

    expect(result.salesToday).toBe(200);
    expect(result.salesCurrentMonth).toBe(1200);
    expect(result.salesCountToday).toBe(4);
    expect(result.unitsSoldToday).toBe(15);
    expect(result.averageTicketToday).toBe(50);
    expect(result.salesTrend).toHaveLength(2);
  });

  it('should get low stock using product minStock when threshold is not provided', async () => {
    const qb = createMockQueryBuilder();
    qb.getMany.mockResolvedValue([{ id: 'p1', stock: 2, minStock: 5 }]);
    productRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getLowStock();

    expect(productRepository.createQueryBuilder).toHaveBeenCalledWith('product');
    expect(qb.where).toHaveBeenCalledWith('product.stock <= product.minStock');
    expect(result).toHaveLength(1);
  });

  it('should get low stock using explicit global threshold', async () => {
    const qb = createMockQueryBuilder();
    qb.getMany.mockResolvedValue([{ id: 'p2', stock: 1, minStock: 0 }]);
    productRepository.createQueryBuilder.mockReturnValue(qb);

    await service.getLowStock(3);

    expect(qb.where).toHaveBeenCalledWith('product.stock <= :threshold', { threshold: 3 });
  });

  it('should map top products ranking response to numbers', async () => {
    const qb = createMockQueryBuilder();
    qb.getRawMany.mockResolvedValue([
      {
        productId: 'p1',
        reference: 'REF-01',
        size: 'M',
        unitsSold: '7',
        totalSold: '350.50',
      },
    ]);
    saleDetailRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getTopProducts({ limit: 5 });

    expect(qb.limit).toHaveBeenCalledWith(5);
    expect(result).toEqual([
      {
        productId: 'p1',
        reference: 'REF-01',
        size: 'M',
        unitsSold: 7,
        totalSold: 350.5,
      },
    ]);
  });

  it('should map sales by user and top clients rankings with calculated numbers', async () => {
    const saleQb = createMockQueryBuilder();
    saleQb.getRawMany
      .mockResolvedValueOnce([
        {
          userId: 'u1',
          username: 'vendedor1',
          firstName: 'Ana',
          lastName: 'Lopez',
          totalSold: '1000.00',
          salesCount: '4',
        },
      ])
      .mockResolvedValueOnce([
        {
          clientId: 'c1',
          documentNumber: '1010',
          firstName: 'Luis',
          lastName: 'Perez',
          totalSpent: '820.40',
          purchasesCount: '3',
        },
      ]);

    saleRepository.createQueryBuilder.mockReturnValue(saleQb);

    const byUser = await service.getSalesByUser({ limit: 10 });
    const byClient = await service.getTopClients({ limit: 10 });

    expect(byUser[0].averageTicket).toBe(250);
    expect(byUser[0].totalSold).toBe(1000);
    expect(byClient[0].totalSpent).toBe(820.4);
    expect(byClient[0].purchasesCount).toBe(3);
  });
});
