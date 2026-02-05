import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('products', { schema: 'senzeschema' })
export class Product {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    reference: string;

    @Column()
    size: string;

    @Column()
    stock: number;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

