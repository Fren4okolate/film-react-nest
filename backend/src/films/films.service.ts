import { Injectable } from '@nestjs/common';
import { FilmsDataProvider } from '../repository/films.repository';

@Injectable()
export class FilmsService {
  constructor(private readonly filmsDataProvider: FilmsDataProvider) {}

  fetchAllFilms() {
    return this.filmsDataProvider.obtainAllFilms();
  }

  fetchFilmSchedule(filmId: string) {
    return this.filmsDataProvider.obtainFilmSchedule(filmId);
  }
}
