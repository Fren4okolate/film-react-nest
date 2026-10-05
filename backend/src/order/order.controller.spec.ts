import {
  ConflictException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

describe('OrderController HTTP routes and validation', () => {
  let app: INestApplication;
  const service = { processOrderCreation: jest.fn() };
  const ticket = {
    film: 'film',
    session: 'session',
    daytime: '2026-10-05T12:00:00Z',
    row: 2,
    seat: 2,
    price: 350,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    app.setGlobalPrefix('api/afisha');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });
  afterEach(() => jest.resetAllMocks());
  afterAll(async () => {
    await app.close();
  });

  it('passes a multi-ticket order to the service and returns 201', async () => {
    const order = {
      email: 'viewer@example.com',
      phone: '+79991234567',
      tickets: [ticket, { ...ticket, seat: 3 }],
    };
    const result = {
      total: 2,
      items: order.tickets,
      updatedSessions: [{ sessionId: 'session', taken: ['2:2', '2:3'] }],
    };
    service.processOrderCreation.mockResolvedValue(result);
    await request(app.getHttpServer())
      .post('/api/afisha/order')
      .send(order)
      .expect(201, result);
    expect(service.processOrderCreation).toHaveBeenCalledWith(order);
  });

  it.each([
    ['missing tickets', {}],
    ['invalid email', { email: 'not-an-email', tickets: [ticket] }],
    ['invalid nested seat', { tickets: [{ ...ticket, seat: 'two' }] }],
    ['non-array tickets', { tickets: ticket }],
  ])('rejects %s before invoking the service', async (_description, body) => {
    await request(app.getHttpServer())
      .post('/api/afisha/order')
      .send(body)
      .expect(400);
    expect(service.processOrderCreation).not.toHaveBeenCalled();
  });

  it('returns 409 when the service detects an occupied seat', async () => {
    service.processOrderCreation.mockRejectedValue(
      new ConflictException('Seat is occupied'),
    );
    const response = await request(app.getHttpServer())
      .post('/api/afisha/order')
      .send({ tickets: [ticket] })
      .expect(409);
    expect(response.body.message).toBe('Seat is occupied');
  });

  it('returns 500 without exposing an internal error message', async () => {
    service.processOrderCreation.mockRejectedValue(
      new Error('Database connection failed'),
    );
    const response = await request(app.getHttpServer())
      .post('/api/afisha/order')
      .send({ tickets: [ticket] })
      .expect(500);
    expect(response.body.message).toBe('Internal server error');
  });
});
