import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Sale } from '../../sale/entities/sale.entity';
import { Product } from '../../product/entities/product.entity';

@Index('IDX_SALE_DETAILS_PRODUCT', ['product'])
@Entity('sale_details' , { schema: 'senzeschema' })
export class SaleDetail {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Sale, sale => sale.details)
    @JoinColumn({ name: 'sale_id' })
    sale: Sale;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column()
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;
}

