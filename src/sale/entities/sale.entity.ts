import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Client } from '../../client/entities/client.entity';
import { SaleDetail } from '../../sale-detail/entities/sale-detail.entity';

@Entity('sales', { schema: 'senzeschema' })
export class Sale {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column('decimal', { precision: 10, scale: 2 })
    total: number;

    @OneToMany(() => SaleDetail, detail => detail.sale)
    details: SaleDetail[];

    @CreateDateColumn()
    createdAt: Date;
}

