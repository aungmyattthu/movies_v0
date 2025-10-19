import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  genre: string;

  @Column({ type: 'int' })
  releaseYear: number;

  @Column({ type: 'int', nullable: true })
  duration: number; // in minutes

  @Column({ nullable: true })
  posterPath: string;

  @Column({ nullable: true })
  videoPath: string; // Full movie path

  @Column({ nullable: true })
  trailerPath: string; // Trailer path for free users

  @ManyToOne(() => User, (user) => user.movies, { eager: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploadedBy: User;

  @Column({ nullable: true })
  uploadedById: string;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
