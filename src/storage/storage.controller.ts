import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Body,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';
import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get('presigned-url')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate presigned URL for file upload (Admin only)',
    description:
      'Generates a presigned URL for uploading files directly to Cloudflare R2',
  })
  @ApiQuery({
    name: 'fileType',
    enum: ['video', 'trailer', 'poster'],
    description: 'Type of file to upload',
  })
  @ApiQuery({
    name: 'contentType',
    example: 'video/mp4',
    description: 'MIME type of the file',
  })
  @ApiQuery({
    name: 'fileName',
    required: false,
    description: 'Optional custom file name',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    schema: {
      example: {
        uploadUrl:
          'https://cc1f0883b28c2eba06bf5eaf5dafc273.r2.cloudflarestorage.com/video-streaming/videos/sample.mp4?X-Amz-Algorithm=...',
        fileKey: 'videos/550e8400-e29b-41d4-a716-446655440000.mp4',
        publicUrl:
          'https://your-r2-public-domain.com/videos/550e8400-e29b-41d4-a716-446655440000.mp4',
        expiresIn: 3600,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async generatePresignedUrl(
    @Query('fileType') fileType: 'video' | 'trailer' | 'poster',
    @Query('contentType') contentType: string,
    @Query('fileName') fileName?: string,
  ) {
    return this.storageService.generatePresignedUrl(
      fileType,
      contentType,
      fileName,
    );
  }

  @Post('movie-upload-urls')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate all presigned URLs for movie upload (Admin only)',
    description:
      'Generates presigned URLs for poster, video, and trailer in one request',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        movieId: {
          type: 'string',
          description: 'Optional movie ID for consistent naming',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'All presigned URLs generated successfully',
    schema: {
      example: {
        poster: {
          uploadUrl: 'https://...',
          fileKey: 'posters/550e8400-poster.jpg',
          publicUrl: 'https://your-domain.com/posters/550e8400-poster.jpg',
          expiresIn: 3600,
        },
        video: {
          uploadUrl: 'https://...',
          fileKey: 'videos/550e8400-video.mp4',
          publicUrl: 'https://your-domain.com/videos/550e8400-video.mp4',
          expiresIn: 3600,
        },
        trailer: {
          uploadUrl: 'https://...',
          fileKey: 'trailers/550e8400-trailer.mp4',
          publicUrl: 'https://your-domain.com/trailers/550e8400-trailer.mp4',
          expiresIn: 3600,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async generateMovieUploadUrls(@Body() body: { movieId?: string }) {
    return this.storageService.generateMovieUploadUrls(body.movieId);
  }
}
