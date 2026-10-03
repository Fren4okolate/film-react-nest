import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/order.dto';
import { Screening } from '../films/schema/films.schema';
import { FilmsDataProvider } from '../repository/films.repository';

@Injectable()
export class OrderService {
  constructor(private readonly filmsDataProvider: FilmsDataProvider) {}

  async processOrderCreation(orderInfo: CreateOrderDto) {
    const { tickets } = orderInfo;

    if (!tickets || tickets.length === 0) {
      throw new ConflictException('Не указаны билеты для заказа');
    }

    for (const ticketItem of tickets) {
      const { film, session, row, seat } = ticketItem;
      const filmData = await this.filmsDataProvider.locateFilmById(film);

      if (!filmData) {
        throw new ConflictException(`Фильм с кодом ${film} не существует`);
      }

      const screeningData: Screening = filmData.schedule.find(
        (screening) => screening.id === session,
      );

      if (!screeningData) {
        throw new ConflictException(`Сеанс с кодом ${session} не найден`);
      }

      if (row > screeningData.rows || seat > screeningData.seats) {
        throw new BadRequestException('Указанное место не существует в зале');
      }

      const seatPosition = `${row}:${seat}`;
      if (screeningData.taken.includes(seatPosition)) {
        throw new ConflictException('Место уже забронировано другим зрителем');
      }
    }

    for (const { film, session, row, seat } of tickets) {
      const reserved = await this.filmsDataProvider.reserveSeat(
        film,
        session,
        `${row}:${seat}`,
      );

      if (!reserved) {
        throw new ConflictException('Место уже забронировано другим зрителем');
      }
    }

    return {
      total: tickets.length,
      items: tickets,
    };
  }
}
