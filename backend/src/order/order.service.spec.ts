import { ConflictException } from '@nestjs/common';
import { Schedule } from '../films/entities/schedule.entity';
import { FilmsRepository } from '../repository/films.repository';
import { TicketDto } from './dto/order.dto';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let repository: jest.Mocked<FilmsRepository>;
  let service: OrderService;
  let schedule: Schedule;

  const ticket = (row: number, seat: number): TicketDto => ({
    film: 'film',
    session: 'session',
    daytime: '2026-10-04T12:00:00+03:00',
    row,
    seat,
    price: 350,
  });

  beforeEach(() => {
    schedule = Object.assign(new Schedule(), {
      id: 'session',
      filmId: 'film',
      taken: [],
    });
    repository = {
      findAllFilms: jest.fn(),
      findFilmById: jest.fn(),
      findScheduleForUpdate: jest.fn().mockResolvedValue(schedule),
      saveSchedules: jest.fn().mockResolvedValue(undefined),
      withTransaction: jest.fn(),
    };
    repository.withTransaction.mockImplementation((work) => work(repository));
    service = new OrderService(repository);
  });

  it('rejects an empty order before opening a transaction', async () => {
    await expect(service.processOrderCreation({ tickets: [] })).rejects.toThrow(
      ConflictException,
    );
    expect(repository.withTransaction).not.toHaveBeenCalled();
  });

  it('does not save any seats when a later ticket is occupied', async () => {
    schedule.taken = ['1:1'];

    await expect(
      service.processOrderCreation({ tickets: [ticket(2, 2), ticket(1, 1)] }),
    ).rejects.toThrow(ConflictException);

    expect(repository.saveSchedules).not.toHaveBeenCalled();
  });

  it('rejects duplicate seats within one order before saving', async () => {
    await expect(
      service.processOrderCreation({ tickets: [ticket(2, 2), ticket(2, 2)] }),
    ).rejects.toThrow(ConflictException);

    expect(repository.saveSchedules).not.toHaveBeenCalled();
  });

  it('saves all tickets once after validation', async () => {
    const result = await service.processOrderCreation({
      tickets: [ticket(2, 2), ticket(2, 3)],
    });

    expect(repository.saveSchedules).toHaveBeenCalledTimes(1);
    expect(result.updatedSessions).toEqual([
      { sessionId: 'session', taken: ['2:2', '2:3'] },
    ]);
    expect(result.total).toBe(2);
  });

  it('rejects a session belonging to a different film', async () => {
    await expect(
      service.processOrderCreation({
        tickets: [{ ...ticket(2, 2), film: 'other-film' }],
      }),
    ).rejects.toThrow(ConflictException);

    expect(repository.saveSchedules).not.toHaveBeenCalled();
  });
});
