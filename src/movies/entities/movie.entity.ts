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
  duration: number;

  // R2 Storage paths
  @Column({ nullable: true })
  posterPath: string; // R2 file key: posters/xxx.jpg

  @Column({ nullable: true })
  videoPath: string; // R2 file key: videos/xxx.mp4

  @Column({ nullable: true })
  trailerPath: string; // R2 file key: trailers/xxx.mp4

  // Public URLs (for CDN)
  @Column({ nullable: true })
  posterUrl: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  trailerUrl: string;

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
