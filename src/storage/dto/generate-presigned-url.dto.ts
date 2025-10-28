import { IsEnum, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePresignedUrlDto {
  @ApiProperty({
    description: 'Type of file to upload',
    enum: ['video', 'trailer', 'poster'],
    example: 'video',
  })
  @IsEnum(['video', 'trailer', 'poster'])
  fileType: 'video' | 'trailer' | 'poster';

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'video/mp4',
  })
  @IsString()
  @IsIn(['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
  contentType: string;

  @ApiPropertyOptional({
    description: 'Optional custom file name',
    example: 'my-movie.mp4',
  })
  @IsString()
  @IsOptional()
  fileName?: string;
}