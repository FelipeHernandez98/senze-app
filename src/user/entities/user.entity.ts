import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users', { schema: 'senzeschema' })
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ name: 'first_name' })
    firstName: string;

    @Column({ name: 'last_name' })
    lastName: string;

    @Column()
    password: string;

    @Column({ name: 'state_id' })
    stateId: number;

    @Column({ name: 'role_id' })
    roleId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

