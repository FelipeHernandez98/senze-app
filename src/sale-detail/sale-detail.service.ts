import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSaleDetailDto } from './dto/create-sale-detail.dto';
import { UpdateSaleDetailDto } from './dto/update-sale-detail.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SaleDetail } from './entities/sale-detail.entity';
import { Product } from 'src/product/entities/product.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class SaleDetailService {
  constructor(
    @InjectRepository(SaleDetail)
    private readonly saleDetailRepository: Repository<SaleDetail>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSaleDetailDto: CreateSaleDetailDto): Promise<SaleDetail> {
    if (!createSaleDetailDto.saleId) {
      throw new BadRequestException('saleId is required to create sale detail directly');
    }

    return this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, { where: { id: createSaleDetailDto.saleId } });
      if (!sale) {
        throw new NotFoundException(`Sale with id ${createSaleDetailDto.saleId} not found`);
      }

      const product = await manager.findOne(Product, { where: { id: createSaleDetailDto.productId } });
      if (!product) {
        throw new NotFoundException(`Product with id ${createSaleDetailDto.productId} not found`);
      }

      if (product.stock < createSaleDetailDto.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.reference}`);
      }

      product.stock -= createSaleDetailDto.quantity;
      await manager.save(Product, product);

      const detail = manager.create(SaleDetail, {
        sale,
        product,
        quantity: createSaleDetailDto.quantity,
        price: Number(product.price),
      });

      const savedDetail = await manager.save(SaleDetail, detail);
      await this.recalculateSaleTotal(sale.id, manager);

      return manager.findOneOrFail(SaleDetail, {
        where: { id: savedDetail.id },
        relations: { sale: true, product: true },
      });
    });
  }

  async findAll(): Promise<SaleDetail[]> {
    return this.saleDetailRepository.find({
      relations: { sale: true, product: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SaleDetail> {
    const detail = await this.saleDetailRepository.findOne({
      where: { id },
      relations: { sale: true, product: true },
    });

    if (!detail) {
      throw new NotFoundException(`Sale detail with id ${id} not found`);
    }

    return detail;
  }

  async update(id: string, updateSaleDetailDto: UpdateSaleDetailDto): Promise<SaleDetail> {
    const existingDetail = await this.findOne(id);

    return this.dataSource.transaction(async (manager) => {
      const oldProduct = await manager.findOneOrFail(Product, { where: { id: existingDetail.product.id } });
      oldProduct.stock += existingDetail.quantity;
      await manager.save(Product, oldProduct);

      let newProduct = oldProduct;
      if (updateSaleDetailDto.productId && updateSaleDetailDto.productId !== oldProduct.id) {
        newProduct = await manager.findOne(Product, { where: { id: updateSaleDetailDto.productId } });
        if (!newProduct) {
          throw new NotFoundException(`Product with id ${updateSaleDetailDto.productId} not found`);
        }
      }

      const newQuantity = updateSaleDetailDto.quantity ?? existingDetail.quantity;
      if (newProduct.stock < newQuantity) {
        throw new BadRequestException(`Insufficient stock for product ${newProduct.reference}`);
      }

      newProduct.stock -= newQuantity;
      await manager.save(Product, newProduct);

      existingDetail.product = newProduct;
      existingDetail.quantity = newQuantity;
      existingDetail.price = Number(newProduct.price);

      await manager.save(SaleDetail, existingDetail);
      await this.recalculateSaleTotal(existingDetail.sale.id, manager);

      return manager.findOneOrFail(SaleDetail, {
        where: { id },
        relations: { sale: true, product: true },
      });
    });
  }

  async remove(id: string): Promise<void> {
    const detail = await this.findOne(id);

    await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOneOrFail(Product, { where: { id: detail.product.id } });
      product.stock += detail.quantity;
      await manager.save(Product, product);

      await manager.delete(SaleDetail, { id });
      await this.recalculateSaleTotal(detail.sale.id, manager);
    });
  }

  private async recalculateSaleTotal(saleId: string, manager: Repository<SaleDetail>['manager']): Promise<void> {
    const sale = await manager.findOne(Sale, {
      where: { id: saleId },
      relations: { details: true },
    });

    if (!sale) {
      return;
    }

    const total = sale.details.reduce((acc, detail) => {
      return acc + Number(detail.price) * detail.quantity;
    }, 0);

    sale.total = Number(total.toFixed(2));
    await manager.save(Sale, sale);
  }
}
