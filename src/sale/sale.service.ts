import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { Client } from 'src/client/entities/client.entity';
import { Product } from 'src/product/entities/product.entity';
import { Repository, DataSource } from 'typeorm';
import { SaleDetail } from 'src/sale-detail/entities/sale-detail.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSaleDto: CreateSaleDto, user: User): Promise<Sale> {
    const client = await this.clientRepository.findOne({ where: { id: createSaleDto.clientId } });

    if (!client) {
      throw new NotFoundException(`Client with id ${createSaleDto.clientId} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      const sale = manager.create(Sale, {
        user: { id: user.id } as User,
        client,
        total: 0,
      });

      const savedSale = await manager.save(Sale, sale);
      let total = 0;

      for (const detailDto of createSaleDto.details) {
        const product = await manager.findOne(Product, { where: { id: detailDto.productId } });

        if (!product) {
          throw new NotFoundException(`Product with id ${detailDto.productId} not found`);
        }

        if (product.stock < detailDto.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.reference}`);
        }

        product.stock -= detailDto.quantity;
        await manager.save(Product, product);

        const linePrice = Number(product.price) * detailDto.quantity;
        total += linePrice;

        const detail = manager.create(SaleDetail, {
          sale: savedSale,
          product,
          quantity: detailDto.quantity,
          price: Number(product.price),
        });

        await manager.save(SaleDetail, detail);
      }

      savedSale.total = Number(total.toFixed(2));
      await manager.save(Sale, savedSale);

      return manager.findOneOrFail(Sale, {
        where: { id: savedSale.id },
        relations: { user: true, client: true, details: { product: true } },
      });
    });
  }

  async findAll(): Promise<Sale[]> {
    return this.saleRepository.find({
      relations: { user: true, client: true, details: { product: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: { user: true, client: true, details: { product: true } },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with id ${id} not found`);
    }

    return sale;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<Sale> {
    const existingSale = await this.findOne(id);

    return this.dataSource.transaction(async (manager) => {
      if (updateSaleDto.clientId) {
        const client = await manager.findOne(Client, { where: { id: updateSaleDto.clientId } });
        if (!client) {
          throw new NotFoundException(`Client with id ${updateSaleDto.clientId} not found`);
        }
        existingSale.client = client;
      }

      if (updateSaleDto.details && updateSaleDto.details.length > 0) {
        const currentDetails = await manager.find(SaleDetail, {
          where: { sale: { id } },
          relations: { product: true },
        });

        for (const detail of currentDetails) {
          detail.product.stock += detail.quantity;
          await manager.save(Product, detail.product);
        }

        await manager.delete(SaleDetail, { sale: { id } });

        let total = 0;
        for (const detailDto of updateSaleDto.details) {
          const product = await manager.findOne(Product, { where: { id: detailDto.productId } });

          if (!product) {
            throw new NotFoundException(`Product with id ${detailDto.productId} not found`);
          }

          if (product.stock < detailDto.quantity) {
            throw new BadRequestException(`Insufficient stock for product ${product.reference}`);
          }

          product.stock -= detailDto.quantity;
          await manager.save(Product, product);

          total += Number(product.price) * detailDto.quantity;

          const newDetail = manager.create(SaleDetail, {
            sale: { id } as Sale,
            product,
            quantity: detailDto.quantity,
            price: Number(product.price),
          });

          await manager.save(SaleDetail, newDetail);
        }

        existingSale.total = Number(total.toFixed(2));
      }

      await manager.save(Sale, existingSale);

      return manager.findOneOrFail(Sale, {
        where: { id },
        relations: { user: true, client: true, details: { product: true } },
      });
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.dataSource.transaction(async (manager) => {
      const details = await manager.find(SaleDetail, {
        where: { sale: { id } },
        relations: { product: true },
      });

      for (const detail of details) {
        detail.product.stock += detail.quantity;
        await manager.save(Product, detail.product);
      }

      await manager.delete(SaleDetail, { sale: { id } });
      await manager.delete(Sale, { id });
    });
  }
}
