import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

export class CreateMovieDto{
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    genre: string;

    @IsInt()
    @Min(1888) // The year the first film was made
    @Max(new Date().getFullYear() + 5) // Current year
    releaseYear: number;
}