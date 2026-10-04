import { NotFoundException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Film } from 'src/films/entities/film.entity';
import { Schedule } from 'src/films/entities/schedule.entity';
import { GetFilmDto, GetScheduleDto } from 'src/films/dto/films.dto';

@Injectable()
export class FilmsDataProvider {
  constructor(
    @InjectRepository(Film)
    private readonly filmRepository: Repository<Film>,
    @InjectRepository(Schedule) 
    public readonly scheduleRepository: Repository<Schedule>,
  ) {}

  private convertToScheduleDto(schedule: Schedule): GetScheduleDto {
    const takenArray = schedule.taken
      ? schedule.taken.split(',').filter((item) => item.trim() !== '')
      : [];

    return {
      id: schedule.id,
      daytime: schedule.daytime,
      hall: schedule.hall,
      rows: schedule.rows,
      seats: schedule.seats,
      price: Number(schedule.price),
      taken: takenArray,
    };
  }

private convertToFilmDto(filmData: Film): GetFilmDto {
  return {
    id: filmData.id,
    title: filmData.title,
    description: filmData.description,
    image: filmData.image,
    cover: filmData.cover,  
    schedule: filmData.schedules?.map(this.convertToScheduleDto.bind(this)) || [],
  };
}

  async obtainAllFilms(): Promise<{ total: number; items: GetFilmDto[] }> {
    const filmCollection = await this.filmRepository.find({
      relations: ['schedules'],
    });
    const filmCount = filmCollection.length;

    return {
      total: filmCount,
      items: filmCollection.map(this.convertToFilmDto.bind(this)),
    };
  }

  async obtainFilmSchedule(
    filmId: string, 
  ): Promise<{ total: number; items: GetScheduleDto[] | null }> {
    const filmData = await this.filmRepository.findOne({
      where: { id: filmId },
      relations: ['schedules'],
    });

    if (!filmData) {
      throw new NotFoundException(
        `Фильм с идентификатором ${filmId} не найден в системе`,
      );
    }

    return {
      total: filmData.schedules.length,
      items: filmData.schedules.map(this.convertToScheduleDto.bind(this)),
    };
  }

  async locateFilmById(filmId: string) {
    const filmData = await this.filmRepository.findOne({
      where: { id: filmId },
      relations: ['schedules'],
    });
    return filmData;
  }
}
