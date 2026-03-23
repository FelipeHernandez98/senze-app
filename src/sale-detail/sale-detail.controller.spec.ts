import { SaleDetailController } from './sale-detail.controller';
import { SaleDetailService } from './sale-detail.service';

describe('SaleDetailController', () => {
  let controller: SaleDetailController;
  let saleDetailService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    saleDetailService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new SaleDetailController(saleDetailService as unknown as SaleDetailService);
  });

  it('delegates create to the service', async () => {
    const dto = { saleId: 'sale-1', productId: 'product-1', quantity: 2 };
    const detail = { id: 'detail-1', ...dto };
    saleDetailService.create.mockResolvedValue(detail);

    await expect(controller.create(dto as any)).resolves.toEqual(detail);
    expect(saleDetailService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update to the service', async () => {
    const dto = { quantity: 4 };
    saleDetailService.update.mockResolvedValue({ id: 'detail-1', quantity: 4 });

    await expect(controller.update('detail-1', dto as any)).resolves.toEqual({
      id: 'detail-1',
      quantity: 4,
    });
    expect(saleDetailService.update).toHaveBeenCalledWith('detail-1', dto);
  });

  it('delegates remove to the service', async () => {
    saleDetailService.remove.mockResolvedValue(undefined);

    await expect(controller.remove('detail-1')).resolves.toBeUndefined();
    expect(saleDetailService.remove).toHaveBeenCalledWith('detail-1');
  });
});
