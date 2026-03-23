import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { Sale } from 'src/sale/entities/sale.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Sale])],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
