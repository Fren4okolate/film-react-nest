import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Film } from './films/entities/film.entity';
import { Schedule } from './films/entities/schedule.entity';

export function createDatabaseOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  const port = config.get<string>('DATABASE_PORT');
  const host = config.get<string>('DATABASE_HOST');
  const username = config.get<string>('DATABASE_USERNAME');
  const password = config.get<string>('DATABASE_PASSWORD');
  const database = config.get<string>('DATABASE_NAME');
  const databaseUrl = config.get<string>('DATABASE_URL');
  const url = databaseUrl ? new URL(databaseUrl) : undefined;

  if (url) {
    // pg отдаёт приоритет URL, поэтому включаем в него явные настройки.
    if (host !== undefined) url.hostname = host;
    if (port !== undefined) url.port = port;
    if (username !== undefined) url.username = username;
    if (password !== undefined) url.password = password;
    if (database !== undefined)
      url.pathname = `/${encodeURIComponent(database)}`;
  }

  return {
    type: config.getOrThrow<'postgres'>('DATABASE_DRIVER'),
    url: url?.toString(),
    host,
    port: port ? Number(port) : undefined,
    username,
    password,
    database,
    entities: [Film, Schedule],
    synchronize: false,
  };
}
