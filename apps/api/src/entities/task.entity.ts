import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  
  @Entity('tasks')
  export class Task {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column({ type: 'varchar', length: 255 })
    title!: string;
  
    @Column({ type: 'text', nullable: true })
    description?: string;
  
    @Column({ type: 'varchar', length: 50, default: 'pending' })
    status!: string; // 'pending', 'in_progress', 'completed', 'cancelled'
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    category?: string; // 'work', 'personal', etc.
  
    @Column({ type: 'varchar', length: 20, nullable: true })
    priority?: string; // 'low', 'medium', 'high', 'urgent'
  
    @Column({ type: 'datetime', nullable: true })
    dueDate?: Date;
  
    // Task belongs to a user only
    @ManyToOne(() => User, user => user.tasks)
    @JoinColumn({ name: 'userId' })
    user!: User;
  
    @Column()
    userId!: number;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  }