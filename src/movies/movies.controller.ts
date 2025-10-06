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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';

@Controller('movies')
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'poster', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = file.fieldname === 'poster' ? './uploads/posters' : './uploads/videos';
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB
        },
      },
    ),
  )
  async create(
    @Body(ValidationPipe) createMovieDto: CreateMovieDto,
    @UploadedFiles() files: { poster?: Express.Multer.File[]; video?: Express.Multer.File[] },
    @Request() req,
  ) {
    const posterPath = files.poster?.[0]?.path;
    const videoPath = files.video?.[0]?.path;

    return this.moviesService.create(createMovieDto, req.user.id, posterPath, videoPath);
  }

  @Get()
  async findAll() {
    return this.moviesService.findAll();
  }

  @Get('my-movies')
  @UseGuards(AuthGuard('jwt'))
  async findMyMovies(@Request() req) {
    return this.moviesService.findByUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.moviesService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: string, @Request() req) {
    await this.moviesService.delete(id, req.user.id);
    return { message: 'Movie deleted successfully' };
  }
}