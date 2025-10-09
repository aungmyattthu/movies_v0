import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  ValidationPipe,
  ForbiddenException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';
import { SubscriptionGuard } from '../common/guards/subscription.guard';

@Controller('movies')
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  // Admin only - Upload movie with full video and trailer
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'poster', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'trailer', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            let uploadPath = './uploads/';
            if (file.fieldname === 'poster') uploadPath += 'posters';
            else if (file.fieldname === 'video') uploadPath += 'videos';
            else if (file.fieldname === 'trailer') uploadPath += 'trailers';
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
        limits: {
          fileSize: 500 * 1024 * 1024, // 500MB
        },
      },
    ),
  )
  async create(
    @Body(ValidationPipe) createMovieDto: CreateMovieDto,
    @UploadedFiles() files: { 
      poster?: Express.Multer.File[]; 
      video?: Express.Multer.File[];
      trailer?: Express.Multer.File[];
    },
    @Request() req,
  ) {
    const posterPath = files.poster?.[0]?.path;
    const videoPath = files.video?.[0]?.path;
    const trailerPath = files.trailer?.[0]?.path;

    return this.moviesService.create(
      createMovieDto, 
      req.user.id, 
      posterPath, 
      videoPath,
      trailerPath,
    );
  }

  // Public - Get all movies (metadata only)
  @Get()
  async findAll() {
    return this.moviesService.findAll();
  }

  // Premium/Admin - Watch full movie (with subscription check)
  @Get(':id/watch')
  @UseGuards(AuthGuard('jwt'), SubscriptionGuard)
  async watchMovie(@Param('id') id: string, @Request() req) {
    return this.moviesService.getFullMovie(id, req.user.id);
  }

  // Free/Premium/Admin - Watch trailer
  @Get(':id/trailer')
  @UseGuards(AuthGuard('jwt'))
  async watchTrailer(@Param('id') id: string) {
    return this.moviesService.getTrailer(id);
  }

  // Public - Get movie details (no video paths)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.moviesService.findOne(id);
  }

  // Admin only - Get user's uploaded movies
  @Get('my-uploads')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async findMyMovies(@Request() req) {
    return this.moviesService.findByUser(req.user.id);
  }

  // Admin only - Delete movie
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string, @Request() req) {
    await this.moviesService.delete(id, req.user.id);
    return { message: 'Movie deleted successfully' };
  }
}