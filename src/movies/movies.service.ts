import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    trailerPath?: string,
  ): Promise<any> {
    const movie = this.moviesRepository.create({
      ...createMovieDto,
      uploadedById: userId,
      posterPath,
      videoPath,
      trailerPath,
    });

    return this.moviesRepository.save(movie);
  }

  async findAll(): Promise<Movie[]> {
    // Return movies without video paths for security
    return this.moviesRepository.find({ 
      relations: ['uploadedBy'],
      select: ['id', 'title', 'description', 'genre', 'releaseYear', 'duration', 'posterPath', 'createdAt'],
    });
  }

  async findByUser(userId: string): Promise<any> {
    return this.moviesRepository.find({ 
      where: { uploadedById: userId },
      relations: ['uploadedBy'],
    });
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
      select: ['id', 'title', 'description', 'genre', 'releaseYear', 'duration', 'posterPath', 'createdAt'],
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }

  async getFullMovie(id: string, userId: string): Promise<Movie & { message: string; streamUrl: string }> {
    const movie = await this.moviesRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    if (!movie.videoPath) {
      throw new NotFoundException('Full movie video not available');
    }

    // Return movie with full video path
    return {
      ...movie,
      message: 'Access granted to full movie',
      streamUrl: `http://localhost:3000/${movie.videoPath}`,
    } as Movie & { message: string; streamUrl: string };
  }

  async getTrailer(id: string): Promise<any> {
    const movie = await this.moviesRepository.findOne({
      where: { id },
      select: ['id', 'title', 'description', 'genre', 'releaseYear', 'posterPath', 'trailerPath'],
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    if (!movie.trailerPath) {
      throw new NotFoundException('Trailer not available for this movie');
    }

    return {
      ...movie,
      message: 'Trailer access',
      streamUrl: `http://localhost:3000/${movie.trailerPath}`,
    };
  }

  async delete(id: string, userId: string): Promise<any> {
    const movie = await this.findOne(id);
    
    if (movie.uploadedById !== userId) {
      throw new ForbiddenException('You can only delete your own movies');
    }

    await this.moviesRepository.remove(movie);
  }
}