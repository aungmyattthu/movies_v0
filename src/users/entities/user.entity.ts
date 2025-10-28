import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Movie } from '../../movies/entities/movie.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  @Exclude()
  password: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  roleId: string;

  @OneToOne(() => Subscription, (subscription) => subscription.user)
  subscription: Subscription;

  @OneToMany(() => Movie, (movie) => movie.uploadedBy)
  movies: Movie[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  @Exclude()
  refreshToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
