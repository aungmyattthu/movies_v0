import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}

  async create(
    createMovieDto: CreateMovieDto,
    userId: string,
    posterPath?: string,
    videoPath?: string,
  ): Promise<Movie> {
    const movie = this.moviesRepository.create({
      ...createMovieDto,
      userId,
      posterPath,
      videoPath,
    });

    return this.moviesRepository.save(movie);
  }

  async findAll(): Promise<Movie[]> {
    return this.moviesRepository.find({ relations: ['user'] });
  }

  async findByUser(userId: string): Promise<Movie[]> {
    return this.moviesRepository.find({ where: { userId }, relations: ['user'] });
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }

  async delete(id: string, userId: string): Promise<void> {
    const movie = await this.findOne(id);
    
    if (movie.userId !== userId) {
      throw new NotFoundException('Movie not found or unauthorized');
    }

    await this.moviesRepository.remove(movie);
  }
}