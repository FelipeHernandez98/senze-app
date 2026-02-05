import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { SaleModule } from './sale/sale.module';
import { ClientModule } from './client/client.module';
import { SaleDetailModule } from './sale-detail/sale-detail.module';
import { User } from './user/entities/user.entity';
import { Client } from './client/entities/client.entity';
import { Sale } from './sale/entities/sale.entity';
import { SaleDetail } from './sale-detail/entities/sale-detail.entity';
import { Product } from './product/entities/product.entity';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? +process.env.DB_PORT : 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      schema: process.env.DB_SCHEMA,
      entities: [User, Client, Sale, SaleDetail, Product],
      //synchronize: true,
    }),
    UserModule, ProductModule, AuthModule, SaleModule, ClientModule, SaleDetailModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
