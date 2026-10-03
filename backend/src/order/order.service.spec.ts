import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FilmsDataProvider } from '../repository/films.repository';
import { CreateOrderDto, TicketDto } from './dto/order.dto';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  const filmsDataProvider = {
    locateFilmById: jest.fn(),
    reserveSeat: jest.fn(),
  };
  const screening = Object.freeze({
    id: 'session-1',
    rows: 5,
    seats: 8,
    taken: Object.freeze(['2:3']),
  });

  function createOrder(coordinates: Partial<TicketDto> = {}): CreateOrderDto {
    return {
      tickets: [
        {
          film: 'film-1',
          session: screening.id,
          daytime: '2026-10-03T18:00:00Z',
          row: 1,
          seat: 1,
          price: 500,
          ...coordinates,
        },
      ],
    };
  }

  beforeEach(async () => {
    jest.resetAllMocks();
    filmsDataProvider.locateFilmById.mockResolvedValue({
      schedule: [screening],
    });
    filmsDataProvider.reserveSeat.mockResolvedValue(true);

    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: FilmsDataProvider, useValue: filmsDataProvider },
      ],
    }).compile();

    service = module.get(OrderService);
  });

  it.each([{ row: 6 }, { seat: 9 }, { row: 6, seat: 9 }])(
    'rejects coordinates outside the hall: %p',
    async (coordinates) => {
      await expect(
        service.processOrderCreation(createOrder(coordinates)),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(filmsDataProvider.reserveSeat).not.toHaveBeenCalled();
    },
  );

  it('validates all ticket coordinates before saving any reservations', async () => {
    const order = createOrder();
    order.tickets.push(...createOrder({ seat: 9 }).tickets);

    await expect(service.processOrderCreation(order)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(filmsDataProvider.reserveSeat).not.toHaveBeenCalled();
  });

  it.each([
    { row: 1, seat: 1 },
    { row: 5, seat: 8 },
  ])(
    'reserves a valid boundary seat through the repository: %p',
    async (seat) => {
      const order = createOrder(seat);

      await expect(service.processOrderCreation(order)).resolves.toEqual({
        total: 1,
        items: order.tickets,
      });

      expect(filmsDataProvider.reserveSeat).toHaveBeenCalledWith(
        'film-1',
        screening.id,
        `${seat.row}:${seat.seat}`,
      );
      expect(screening.taken).toEqual(['2:3']);
    },
  );

  it('rejects an already reserved seat without writing', async () => {
    await expect(
      service.processOrderCreation(createOrder({ row: 2, seat: 3 })),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(filmsDataProvider.reserveSeat).not.toHaveBeenCalled();
  });

  it('rejects a seat that was reserved between reading and writing', async () => {
    filmsDataProvider.reserveSeat.mockResolvedValue(false);

    await expect(
      service.processOrderCreation(createOrder()),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
