import { NotFoundException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetFilmDto } from 'src/films/schedule/schedule';
import { CinemaFilm } from 'src/films/schema/films.schema';
import { GetScheduleDto } from 'src/films/dto/films.dto';

@Injectable()
export class FilmsDataProvider {
  constructor(
    @InjectModel(CinemaFilm.name)
    private readonly cinemaFilmModel: Model<CinemaFilm>,
  ) {}

  private convertToFilmDto(): (film: CinemaFilm) => GetFilmDto {
    return (filmData) => {
      return {
        id: filmData.id,
        rating: filmData.rating,
        director: filmData.director,
        tags: filmData.tags,
        image: filmData.image,
        cover: filmData.cover,
        title: filmData.title,
        about: filmData.about,
        description: filmData.description,
        schedule: filmData.schedule,
      };
    };
  }

  async obtainAllFilms(): Promise<{ total: number; items: GetFilmDto[] }> {
    const filmCollection = await this.cinemaFilmModel.find().exec();
    const filmCount = await this.cinemaFilmModel.countDocuments().exec();

    return {
      total: filmCount,
      items: filmCollection.map(this.convertToFilmDto()),
    };
  }

  async obtainFilmSchedule(
    filmId: string,
  ): Promise<{ total: number; items: GetScheduleDto[] | null }> {
    const filmData = await this.cinemaFilmModel.findOne({ id: filmId }).exec();

    if (!filmData) {
      throw new NotFoundException(
        `Фильм с идентификатором ${filmId} не найден в системе`,
      );
    }

    return {
      total: filmData.schedule.length,
      items: filmData.schedule,
    };
  }

  async locateFilmById(filmId: string) {
    const filmData = await this.cinemaFilmModel.findOne({ id: filmId }).exec();
    return filmData;
  }
}
