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
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';
import { SubscriptionGuard } from '../common/guards/subscription.guard';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Upload a new movie (Admin only)',
    description: 'Uploads a movie with poster, full video, and trailer. Only accessible by admin users.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'genre', 'releaseYear'],
      properties: {
        title: { type: 'string', example: 'Inception' },
        description: { type: 'string', example: 'A mind-bending thriller' },
        genre: { type: 'string', example: 'Sci-Fi' },
        releaseYear: { type: 'integer', example: 2010 },
        duration: { type: 'integer', example: 148 },
        poster: { type: 'string', format: 'binary' },
        video: { type: 'string', format: 'binary' },
        trailer: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Movie successfully uploaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
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
          fileSize: 500 * 1024 * 1024,
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

  @Get()
  @ApiOperation({ 
    summary: 'Get all movies',
    description: 'Returns list of all movies with metadata only (no video paths)',
  })
  @ApiResponse({ status: 200, description: 'List of movies retrieved successfully' })
  async findAll() {
    return this.moviesService.findAll();
  }

  @Get(':id/watch')
  @UseGuards(AuthGuard('jwt'), SubscriptionGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Watch full movie (Premium/Admin only)',
    description: 'Access full movie video. Requires active premium subscription or admin role.',
  })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Movie access granted',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Inception',
        videoPath: 'uploads/videos/123456-movie.mp4',
        message: 'Access granted to full movie',
        streamUrl: 'http://localhost:3000/uploads/videos/123456-movie.mp4',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Subscription required or expired' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async watchMovie(@Param('id') id: string, @Request() req) {
    return this.moviesService.getFullMovie(id, req.user.id);
  }

  @Get(':id/trailer')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Watch movie trailer',
    description: 'Access movie trailer. Available to all authenticated users.',
  })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Trailer access granted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trailer not found' })
  async watchTrailer(@Param('id') id: string) {
    return this.moviesService.getTrailer(id);
  }

  @Get('my-uploads')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get my uploaded movies (Admin only)',
    description: 'Returns list of movies uploaded by the authenticated admin.',
  })
  @ApiResponse({ status: 200, description: 'List of uploaded movies' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findMyMovies(@Request() req) {
    return this.moviesService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get movie details',
    description: 'Returns movie details without video paths',
  })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Movie details retrieved' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findOne(@Param('id') id: string) {
    return this.moviesService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete movie (Admin only)',
    description: 'Deletes a movie. Admin can only delete their own uploads.',
  })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only delete own movies' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async delete(@Param('id') id: string, @Request() req) {
    await this.moviesService.delete(id, req.user.id);
    return { message: 'Movie deleted successfully' };
  }
}