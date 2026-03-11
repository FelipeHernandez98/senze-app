import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { Client } from 'src/client/entities/client.entity';
import { Product } from 'src/product/entities/product.entity';
import { SaleDetail } from 'src/sale-detail/entities/sale-detail.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Client, Product, SaleDetail]), UserModule],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService, TypeOrmModule],
})
export class SaleModule {}
