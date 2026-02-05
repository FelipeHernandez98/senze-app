import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('clients', { schema: 'senzeschema' })
export class Client {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'document_number'})
    documentNumber: string;

    @Column({ name: 'document_type'})
    documentType: string;

    @Column({ name: 'first_name'})
    firstName: string;

    @Column({ name: 'last_name'})
    lastName: string;

    @Column({ unique: true })
    phone: string;

    @Column()
    city: string;

    @Column()
    address: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
