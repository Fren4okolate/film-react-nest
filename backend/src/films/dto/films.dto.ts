import { IsNumber, IsString, IsArray } from 'class-validator';

export class GetScheduleDto {
  @IsString()
  id: string;

  @IsString()
  daytime: string;

  @IsNumber()
  hall: number;

  @IsNumber()
  rows: number;

  @IsNumber()
  seats: number;

  @IsNumber()
  price: number;

  @IsArray()
  taken: string[];
}

export class GetFilmDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  image: string;

  @IsString()
  cover: string;

  @IsArray()
  schedule: GetScheduleDto[];
}
