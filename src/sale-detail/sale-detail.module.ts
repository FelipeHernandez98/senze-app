import { Module } from '@nestjs/common';
import { SaleDetailService } from './sale-detail.service';
import { SaleDetailController } from './sale-detail.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleDetail } from './entities/sale-detail.entity';
import { Product } from 'src/product/entities/product.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([SaleDetail, Product, Sale]), UserModule],
  controllers: [SaleDetailController],
  providers: [SaleDetailService],
  exports: [SaleDetailService, TypeOrmModule],
})
export class SaleDetailModule {}
