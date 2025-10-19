import { IsString, IsInt, Min, Max, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty({
    description: 'Movie title',
    example: 'Inception',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Movie description',
    example: 'A mind-bending thriller about dream infiltration',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Movie genre',
    example: 'Sci-Fi',
  })
  @IsString()
  @IsNotEmpty()
  genre: string;

  @ApiProperty({
    description: 'Year the movie was released',
    example: 2010,
    minimum: 1888,
    maximum: 2030,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1888)
  @Max(2030)
  releaseYear: number;

  @ApiPropertyOptional({
    description: 'Movie duration in minutes',
    example: 148,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsOptional()
  duration?: number;
}