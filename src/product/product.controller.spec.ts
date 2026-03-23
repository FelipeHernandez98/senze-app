import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    productService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new ProductController(productService as unknown as ProductService);
  });

  it('delegates create to the service', async () => {
    const dto = { reference: 'REF-01', size: 'M', stock: 10, price: 150 };
    const created = { id: 'product-1', ...dto, minStock: 5 };
    productService.create.mockResolvedValue(created);

    await expect(controller.create(dto as any)).resolves.toEqual(created);
    expect(productService.create).toHaveBeenCalledWith(dto);
  });

  it('returns the product list from the service', async () => {
    const products = [{ id: 'product-1' }, { id: 'product-2' }];
    productService.findAll.mockResolvedValue(products);

    await expect(controller.findAll()).resolves.toEqual(products);
  });

  it('passes id and payload to update', async () => {
    const dto = { minStock: 3 };
    const updated = { id: 'product-1', minStock: 3 };
    productService.update.mockResolvedValue(updated);

    await expect(controller.update('product-1', dto as any)).resolves.toEqual(updated);
    expect(productService.update).toHaveBeenCalledWith('product-1', dto);
  });
});
