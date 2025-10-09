import { IsString, IsInt, Min, Max, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  genre: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1888)
  @Max(2030)
  releaseYear: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsOptional()
  duration?: number; // in minutes
}