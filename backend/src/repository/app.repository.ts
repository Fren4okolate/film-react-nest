import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Film } from '../films/entities/film.entity';
import { Schedule } from '../films/entities/schedule.entity';
import { FilmsRepository } from './films.repository';

@Injectable()
export class AppRepository implements FilmsRepository {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  findAllFilms(): Promise<Film[]> {
    return this.manager.find(Film, { relations: ['schedules'] });
  }

  findFilmById(filmId: string): Promise<Film | null> {
    return this.manager.findOne(Film, {
      where: { id: filmId },
      relations: ['schedules'],
    });
  }

  findScheduleForUpdate(sessionId: string): Promise<Schedule | null> {
    return this.manager.findOne(Schedule, {
      where: { id: sessionId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async saveSchedules(schedules: Schedule[]): Promise<void> {
    await this.manager.save(Schedule, schedules);
  }

  withTransaction<T>(
    work: (repository: FilmsRepository) => Promise<T>,
  ): Promise<T> {
    return this.manager.transaction((manager) =>
      work(new AppRepository(manager)),
    );
  }
}
