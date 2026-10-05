import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FilmsRepository } from '../repository/films.repository';
import { GetFilmDto, GetScheduleDto } from './dto/films.dto';
import { Film } from './entities/film.entity';
import { Schedule } from './entities/schedule.entity';

@Injectable()
export class FilmsService {
  constructor(
    @Inject(FilmsRepository)
    private readonly filmsRepository: FilmsRepository,
  ) {}

  async fetchAllFilms(): Promise<{ total: number; items: GetFilmDto[] }> {
    const films = await this.filmsRepository.findAllFilms();
    return {
      total: films.length,
      items: films.map((film) => this.convertToFilmDto(film)),
    };
  }

  async fetchFilmSchedule(
    filmId: string,
  ): Promise<{ total: number; items: GetScheduleDto[] }> {
    const film = await this.filmsRepository.findFilmById(filmId);
    if (!film) {
      throw new NotFoundException(
        `Фильм с идентификатором ${filmId} не найден в системе`,
      );
    }

    return {
      total: film.schedules.length,
      items: film.schedules.map((schedule) =>
        this.convertToScheduleDto(schedule),
      ),
    };
  }

  private convertToScheduleDto(schedule: Schedule): GetScheduleDto {
    return {
      id: schedule.id,
      daytime: schedule.daytime,
      hall: schedule.hall,
      rows: schedule.rows,
      seats: schedule.seats,
      price: Number(schedule.price),
      taken: schedule.taken,
    };
  }

  private convertToFilmDto(film: Film): GetFilmDto {
    return {
      id: film.id,
      rating: Number(film.rating),
      director: film.director,
      tags: film.tags,
      about: film.about,
      title: film.title,
      description: film.description,
      image: film.image,
      cover: film.cover,
      schedule: film.schedules.map((schedule) =>
        this.convertToScheduleDto(schedule),
      ),
    };
  }
}
