import { ConfigService } from '@nestjs/config';
import { createDatabaseOptions } from './app.config.provider';

describe('Database configuration', () => {
  it('reads the connection URL and credentials through ConfigService', () => {
    const config = new ConfigService({
      DATABASE_DRIVER: 'postgres',
      DATABASE_URL: 'postgresql://db.example:5433/films',
      DATABASE_USERNAME: 'test_user',
      DATABASE_PASSWORD: 'test_password',
    });

    expect(createDatabaseOptions(config)).toMatchObject({
      type: 'postgres',
      url: 'postgresql://test_user:test_password@db.example:5433/films',
      username: 'test_user',
      password: 'test_password',
      synchronize: false,
    });
  });

  it('supports separate host, port and database settings', () => {
    const config = new ConfigService({
      DATABASE_DRIVER: 'postgres',
      DATABASE_HOST: 'db.example',
      DATABASE_PORT: '5433',
      DATABASE_NAME: 'films',
    });

    expect(createDatabaseOptions(config)).toMatchObject({
      host: 'db.example',
      port: 5433,
      database: 'films',
    });
  });

  it('lets explicit settings override URL values and escapes credentials', () => {
    const config = new ConfigService({
      DATABASE_DRIVER: 'postgres',
      DATABASE_URL: 'postgresql://old:old@old.example:5432/old?sslmode=require',
      DATABASE_HOST: 'db.example',
      DATABASE_PORT: '5433',
      DATABASE_NAME: 'films',
      DATABASE_USERNAME: 'test_user',
      DATABASE_PASSWORD: 'pass@word:secret',
    });

    expect(createDatabaseOptions(config)).toMatchObject({
      url: 'postgresql://test_user:pass%40word%3Asecret@db.example:5433/films?sslmode=require',
    });
  });

  it('preserves credentials supplied only in the URL', () => {
    const config = new ConfigService({
      DATABASE_DRIVER: 'postgres',
      DATABASE_URL: 'postgresql://url_user:url_password@db.example:5433/films',
    });

    expect(createDatabaseOptions(config)).toMatchObject({
      url: 'postgresql://url_user:url_password@db.example:5433/films',
    });
  });
});
