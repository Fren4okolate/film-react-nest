import { ConflictException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/order.dto';
import { Schedule } from 'src/films/entities/schedule.entity';
import { FilmsDataProvider } from 'src/repository/films.repository';
import { InjectRepository } from '@nestjs/typeorm'; 
import { Repository } from 'typeorm'; 

@Injectable()
export class OrderService {
  constructor(
    private readonly filmsDataProvider: FilmsDataProvider,
    @InjectRepository(Schedule) 
    private readonly scheduleRepository: Repository<Schedule>,
  ) {}

  async processOrderCreation(orderInfo: CreateOrderDto) {
    const { tickets } = orderInfo;

    if (!tickets || tickets.length === 0) {
      throw new ConflictException('Не указаны билеты для заказа');
    }

    const updates = [];
    const updatedSessions = []; 

    for (const ticketItem of tickets) {
      const { film, session, row, seat } = ticketItem;
      
      const filmData = await this.filmsDataProvider.locateFilmById(film);
      if (!filmData) {
        throw new ConflictException(`Фильм с кодом ${film} не существует`);
      }
      
      const scheduleData = await this.scheduleRepository.findOne({ 
        where: { id: session } 
      });
      
      if (!scheduleData) {
        throw new ConflictException(`Сеанс с кодом ${session} не найден`);
      }
      
      const seatPosition = `${row}:${seat}`;
      const takenArray = scheduleData.taken ? scheduleData.taken.split(',').filter(item => item.trim() !== '') : [];
      
      if (takenArray.includes(seatPosition)) {
        throw new ConflictException('Место уже забронировано другим зрителем');
      }
      
      takenArray.push(seatPosition);
      scheduleData.taken = takenArray.join(',');
      
      await this.scheduleRepository.save(scheduleData);
      
      updatedSessions.push({
        sessionId: session,
        taken: scheduleData.taken
      });
    }

    return {
      total: tickets.length,
      items: tickets,
      updatedSessions: updatedSessions, 
    };
  }
}