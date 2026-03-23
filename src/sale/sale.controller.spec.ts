import { SaleController } from './sale.controller';
import { SaleService } from './sale.service';

describe('SaleController', () => {
  let controller: SaleController;
  let saleService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    saleService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new SaleController(saleService as unknown as SaleService);
  });

  it('passes dto and user to create', async () => {
    const dto = { clientId: 'client-1', details: [] };
    const user = { id: 'user-1' };
    const created = { id: 'sale-1' };
    saleService.create.mockResolvedValue(created);

    await expect(controller.create(dto as any, user as any)).resolves.toEqual(created);
    expect(saleService.create).toHaveBeenCalledWith(dto, user);
  });

  it('delegates update to the service', async () => {
    const dto = { clientId: 'client-2' };
    saleService.update.mockResolvedValue({ id: 'sale-1', clientId: 'client-2' });

    await expect(controller.update('sale-1', dto as any)).resolves.toEqual({
      id: 'sale-1',
      clientId: 'client-2',
    });
  });

  it('delegates remove to the service', async () => {
    saleService.remove.mockResolvedValue(undefined);

    await expect(controller.remove('sale-1')).resolves.toBeUndefined();
    expect(saleService.remove).toHaveBeenCalledWith('sale-1');
  });
});
