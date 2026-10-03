import { ConflictException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/order.dto';
import { Screening } from 'src/films/schema/films.schema';
import { FilmsDataProvider } from 'src/repository/films.repository';

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

      const seatPosition = `${row}:${seat}`;
      if (screeningData.taken.includes(seatPosition)) {
        throw new ConflictException('Место уже забронировано другим зрителем');
      }

      screeningData.taken.push(seatPosition);
      await filmData.save();
    }

    return {
      total: tickets.length,
      items: tickets,
    };
  }
}
