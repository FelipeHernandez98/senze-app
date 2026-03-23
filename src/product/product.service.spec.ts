import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    productRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('assigns default minStock when it is omitted on create', async () => {
    const dto = { reference: 'REF-01', size: 'M', stock: 10, price: 120 };
    const createdProduct = { id: 'product-1', ...dto, minStock: 5 };

    productRepository.findOne.mockResolvedValue(null);
    productRepository.create.mockReturnValue(createdProduct);
    productRepository.save.mockResolvedValue(createdProduct);

    const result = await service.create(dto as any);

    expect(productRepository.create).toHaveBeenCalledWith({ ...dto, minStock: 5 });
    expect(result).toEqual(createdProduct);
  });

  it('rejects duplicate reference on create', async () => {
    productRepository.findOne.mockResolvedValue({ id: 'existing-product' });

    await expect(
      service.create({ reference: 'REF-01', size: 'L', stock: 4, price: 99 } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when product does not exist', async () => {
    productRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects updating to a reference owned by another product', async () => {
    productRepository.findOne
      .mockResolvedValueOnce({ id: 'product-1', reference: 'REF-01' })
      .mockResolvedValueOnce({ id: 'product-2', reference: 'REF-02' });

    await expect(service.update('product-1', { reference: 'REF-02' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
