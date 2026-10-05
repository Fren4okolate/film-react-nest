import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Film } from '../src/films/entities/film.entity';
import { Schedule } from '../src/films/entities/schedule.entity';
import { TicketDto } from '../src/order/dto/order.dto';

// Each run owns a separate schema; application data is never cleared.
describe('Films and orders (PostgreSQL e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const schema = `film_test_${randomUUID().replaceAll('-', '')}`;
  const filmId = randomUUID();
  const sessionIds = [randomUUID(), randomUUID()].sort();
  const daytime = '2026-10-04T12:00:00+03:00';

  const ticket = (
    row: number,
    seat: number,
    session = sessionIds[0],
  ): TicketDto => ({ film: filmId, session, daytime, row, seat, price: 350 });

  const placeOrder = (tickets: TicketDto[]) =>
    request(app.getHttpServer()).post('/api/afisha/order').send({ tickets });

  const takenSeats = async (sessionId = sessionIds[0]) =>
    (await dataSource.manager.findOneByOrFail(Schedule, { id: sessionId }))
      .taken;

  beforeAll(async () => {
    const url = new ConfigService().getOrThrow<string>('TEST_DATABASE_URL');
    dataSource = new DataSource({
      type: 'postgres',
      url,
      schema,
      entities: [Film, Schedule],
    });
    await dataSource.initialize();
    await dataSource.query(`CREATE SCHEMA "${schema}"`);
    await dataSource.synchronize();
    await dataSource.manager.save(Film, {
      id: filmId,
      rating: 8.5,
      director: 'Test director',
      tags: ['Драма', 'Рекомендуемые'],
      image: '/image.jpg',
      cover: '/cover.jpg',
      title: 'Test film',
      about: 'Test about',
      description: 'Test description',
    });
    await dataSource.manager.save(
      Schedule,
      sessionIds.map((id) => ({
        id,
        filmId,
        daytime,
        hall: 1,
        rows: 5,
        seats: 10,
        price: 350,
        taken: [],
      })),
    );

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ DATABASE_DRIVER: 'postgres' }))
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    app.setGlobalPrefix('api/afisha');
    await app.init();
  });

  beforeEach(async () => {
    await dataSource.manager
      .createQueryBuilder()
      .update(Schedule)
      .set({ taken: [] })
      .execute();
  });

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) {
        await dataSource.query(`DROP SCHEMA "${schema}" CASCADE`);
      }
    } finally {
      await app?.close();
      if (dataSource?.isInitialized) await dataSource.destroy();
    }
  });

  it('returns films and schedules with array fields', async () => {
    const films = await request(app.getHttpServer())
      .get('/api/afisha/films')
      .expect(200);
    expect(films.body.total).toBe(1);
    expect(films.body.items[0]).toMatchObject({
      id: filmId,
      tags: ['Драма', 'Рекомендуемые'],
      rating: 8.5,
    });
    expect(films.body.items[0].schedule).toHaveLength(2);

    const schedule = await request(app.getHttpServer())
      .get(`/api/afisha/films/${filmId}/schedule`)
      .expect(200);
    expect(schedule.body.total).toBe(2);
    expect(schedule.body.items[0].taken).toEqual([]);
    expect(schedule.body.items[0].price).toBe(350);
  });

  it('returns 404 for the schedule of an unknown film', async () => {
    await request(app.getHttpServer())
      .get(`/api/afisha/films/${randomUUID()}/schedule`)
      .expect(404);
  });

  it('preserves existing seats when the second ticket is occupied', async () => {
    await dataSource.manager.update(Schedule, sessionIds[0], {
      taken: ['1:1'],
    });
    await placeOrder([ticket(2, 2), ticket(1, 1)]).expect(409);
    expect(await takenSeats()).toEqual(['1:1']);
  });

  it('does not reserve seats in another session when an order fails', async () => {
    await dataSource.manager.update(Schedule, sessionIds[1], {
      taken: ['1:1'],
    });
    await placeOrder([ticket(2, 2), ticket(1, 1, sessionIds[1])]).expect(409);
    expect(await takenSeats()).toEqual([]);
    expect(await takenSeats(sessionIds[1])).toEqual(['1:1']);
  });

  it('rejects duplicate tickets without persisting either seat', async () => {
    await placeOrder([ticket(2, 2), ticket(2, 2)]).expect(409);
    expect(await takenSeats()).toEqual([]);
  });

  it('saves all seats from a successful multi-session order', async () => {
    const result = await placeOrder([
      ticket(2, 2),
      ticket(2, 3),
      ticket(3, 1, sessionIds[1]),
    ]).expect(201);

    expect(result.body.total).toBe(3);
    expect(result.body.items).toHaveLength(3);
    expect(result.body.updatedSessions).toEqual([
      { sessionId: sessionIds[0], taken: ['2:2', '2:3'] },
      { sessionId: sessionIds[1], taken: ['3:1'] },
    ]);
    expect(await takenSeats()).toEqual(['2:2', '2:3']);
    expect(await takenSeats(sessionIds[1])).toEqual(['3:1']);
  });

  it('allows only one concurrent order for the same seat', async () => {
    const responses = await Promise.all([
      placeOrder([ticket(2, 2)]),
      placeOrder([ticket(2, 2)]),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect(await takenSeats()).toEqual(['2:2']);
  });

  it('preserves both different seats booked concurrently', async () => {
    const responses = await Promise.all([
      placeOrder([ticket(2, 2)]),
      placeOrder([ticket(2, 3)]),
    ]);

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect((await takenSeats()).sort()).toEqual(['2:2', '2:3']);
  });

  it('handles concurrent orders with opposite session order', async () => {
    const responses = await Promise.all([
      placeOrder([ticket(2, 2), ticket(2, 2, sessionIds[1])]),
      placeOrder([ticket(2, 3, sessionIds[1]), ticket(2, 3)]),
    ]);

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    for (const sessionId of sessionIds) {
      expect((await takenSeats(sessionId)).sort()).toEqual(['2:2', '2:3']);
    }
  });

  it('rolls back all sessions if the database rejects a save', async () => {
    await dataSource.query(
      `ALTER TABLE "${schema}".schedules ADD CONSTRAINT test_reject_seat CHECK (taken <> '4:4')`,
    );
    try {
      await placeOrder([ticket(2, 2), ticket(4, 4, sessionIds[1])]).expect(500);
      expect(await takenSeats()).toEqual([]);
      expect(await takenSeats(sessionIds[1])).toEqual([]);
    } finally {
      await dataSource.query(
        `ALTER TABLE "${schema}".schedules DROP CONSTRAINT test_reject_seat`,
      );
    }
  });

  it('rejects empty orders, missing sessions and mismatched films', async () => {
    await placeOrder([]).expect(409);
    await placeOrder([ticket(2, 2), ticket(2, 3, randomUUID())]).expect(409);
    await placeOrder([{ ...ticket(2, 2), film: randomUUID() }]).expect(409);
    expect(await takenSeats()).toEqual([]);
  });
});
