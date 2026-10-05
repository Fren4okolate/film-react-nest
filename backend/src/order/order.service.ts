import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto, OrderResponseDto } from './dto/order.dto';
import { Schedule } from '../films/entities/schedule.entity';
import { FilmsRepository } from '../repository/films.repository';

@Injectable()
export class OrderService {
  constructor(
    @Inject(FilmsRepository)
    private readonly filmsRepository: FilmsRepository,
  ) {}

  async processOrderCreation(
    orderInfo: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const { tickets } = orderInfo;

    if (!tickets || tickets.length === 0) {
      throw new ConflictException('Не указаны билеты для заказа');
    }

    return this.filmsRepository.withTransaction(async (repository) => {
      const schedules = new Map<string, Schedule>();
      // Один порядок блокировок предотвращает взаимные блокировки заказов.
      const sessionIds = [
        ...new Set(tickets.map((ticket) => ticket.session)),
      ].sort();

      for (const sessionId of sessionIds) {
        const schedule = await repository.findScheduleForUpdate(sessionId);
        if (!schedule) {
          throw new ConflictException(`Сеанс с кодом ${sessionId} не найден`);
        }
        schedules.set(sessionId, schedule);
      }

      for (const { film, session, row, seat } of tickets) {
        const schedule = schedules.get(session);
        if (!schedule) {
          throw new ConflictException(`Сеанс с кодом ${session} не найден`);
        }
        if (schedule.filmId !== film) {
          throw new ConflictException(
            `Сеанс ${session} не относится к фильму ${film}`,
          );
        }

        const seatPosition = `${row}:${seat}`;
        if (schedule.taken.includes(seatPosition)) {
          throw new ConflictException(
            'Место уже забронировано другим зрителем',
          );
        }
        schedule.taken.push(seatPosition);
      }

      const updatedSchedules = [...schedules.values()];
      await repository.saveSchedules(updatedSchedules);

      return {
        total: tickets.length,
        items: tickets,
        updatedSessions: updatedSchedules.map((schedule) => ({
          sessionId: schedule.id,
          taken: schedule.taken,
        })),
      };
    });
  }
}
