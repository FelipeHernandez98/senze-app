import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Client } from '../../client/entities/client.entity';
import { SaleDetail } from '../../sale-detail/entities/sale-detail.entity';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { SaleStatus } from 'src/common/enums/sale-status.enum';

@Index('IDX_SALES_CREATED_AT', ['createdAt'])
@Index('IDX_SALES_USER_CREATED_AT', ['user', 'createdAt'])
@Index('IDX_SALES_CLIENT_CREATED_AT', ['client', 'createdAt'])
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

    @Index('UQ_SALES_INVOICE_NUMBER', { unique: true })
    @Column({ name: 'invoice_number', type: 'int', nullable: true })
    invoiceNumber?: number;

    @Column({
        name: 'payment_method',
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CASH,
    })
    paymentMethod: PaymentMethod;

    @Column({
        name: 'status',
        type: 'enum',
        enum: SaleStatus,
        default: SaleStatus.PAID,
    })
    status: SaleStatus;

    @Column('decimal', { precision: 10, scale: 2 })
    total: number;

    @OneToMany(() => SaleDetail, detail => detail.sale)
    details: SaleDetail[];

    @CreateDateColumn()
    createdAt: Date;
}

