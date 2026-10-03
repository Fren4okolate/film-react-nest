import { GetScheduleDto } from '../dto/films.dto';
import { IsFQDN, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetFilmDto {
  @IsString()
  id: string;

  @IsNumber()
  rating: number;

  @IsString()
  director: string;

  @IsNotEmpty()
  tags: string[];

  @IsFQDN()
  image: string;

  @IsFQDN()
  cover: string;

  @IsString()
  title: string;

  @IsString()
  about: string;

  @IsString()
  description: string;

  @IsNotEmpty()
  schedule: GetScheduleDto[];
}
