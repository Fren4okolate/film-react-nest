import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';

describe('FilmsController HTTP routes', () => {
  let app: INestApplication;
  const service = { fetchAllFilms: jest.fn(), fetchFilmSchedule: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FilmsController],
      providers: [{ provide: FilmsService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/afisha');
    await app.init();
  });
  afterEach(() => jest.resetAllMocks());
  afterAll(async () => {
    await app.close();
  });

  it('returns the film collection from the service', async () => {
    const result = {
      total: 1,
      items: [{ id: 'film', title: 'Film', tags: ['Драма'] }],
    };
    service.fetchAllFilms.mockResolvedValue(result);
    await request(app.getHttpServer())
      .get('/api/afisha/films')
      .expect(200, result);
    expect(service.fetchAllFilms).toHaveBeenCalledTimes(1);
  });

  it('returns an empty collection when there are no films', async () => {
    service.fetchAllFilms.mockResolvedValue({ total: 0, items: [] });
    await request(app.getHttpServer())
      .get('/api/afisha/films')
      .expect(200, { total: 0, items: [] });
  });

  it('passes the route film ID to the service and returns its schedule', async () => {
    const result = { total: 1, items: [{ id: 'session', taken: ['1:1'] }] };
    service.fetchFilmSchedule.mockResolvedValue(result);
    await request(app.getHttpServer())
      .get('/api/afisha/films/film-id/schedule')
      .expect(200, result);
    expect(service.fetchFilmSchedule).toHaveBeenCalledWith('film-id');
  });

  it('preserves the 404 response for an unknown film', async () => {
    service.fetchFilmSchedule.mockRejectedValue(
      new NotFoundException('Film not found'),
    );
    await request(app.getHttpServer())
      .get('/api/afisha/films/missing/schedule')
      .expect(404);
  });
});
