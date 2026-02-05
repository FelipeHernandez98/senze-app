import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from '../../sale/entities/sale.entity';
import { Product } from '../../product/entities/product.entity';

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

