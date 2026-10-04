import {
  Controller,
  Get,
  Param
} from '@nestjs/common';
import { FilmsService } from './films.service';

@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Get()
  obtainFilmsCollection() {
    return this.filmsService.fetchAllFilms();
  }

  @Get('/:id/schedule')
  obtainFilmScreenings(@Param('id') filmId: string) { 
    return this.filmsService.fetchFilmSchedule(filmId);
  }
}