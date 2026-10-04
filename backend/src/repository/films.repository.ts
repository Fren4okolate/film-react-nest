import { Film } from '../films/entities/film.entity';
import { Schedule } from '../films/entities/schedule.entity';

export const FilmsRepository = Symbol('FilmsRepository');

export interface FilmsRepository {
  findAllFilms(): Promise<Film[]>;
  findFilmById(filmId: string): Promise<Film | null>;
  // Вызывать внутри withTransaction: блокировка держится до её завершения.
  findScheduleForUpdate(sessionId: string): Promise<Schedule | null>;
  saveSchedules(schedules: Schedule[]): Promise<void>;
  withTransaction<T>(
    work: (repository: FilmsRepository) => Promise<T>,
  ): Promise<T>;
}
