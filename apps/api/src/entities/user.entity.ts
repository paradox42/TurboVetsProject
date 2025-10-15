import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Role } from './role.entity';
import { Task } from './task.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string; // Will be hashed

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(
    () => Organization,
    (organization: Organization) => organization.users,
    { nullable: true }
  )
  @JoinColumn({
    name: 'organizationId',
    referencedColumnName: 'id',
  })
  organization?: Organization;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles!: Role[];

  @OneToMany(() => Task, (task) => task.user)
  tasks!: Task[];
}
