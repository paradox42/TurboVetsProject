import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Self-referencing relationship for 2-level hierarchy
  @ManyToOne(() => Organization, (organization) => organization.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Organization;

  @Column({ nullable: true })
  parentId?: number;

  @OneToMany(() => Organization, (organization) => organization.parent)
  children!: Organization[];

  // Users belonging to this organization
  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods for hierarchy
  isRoot(): boolean {
    return this.parentId === null;
  }

  isSubOrganization(): boolean {
    return this.parentId !== null;
  }
}
