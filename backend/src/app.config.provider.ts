import { ConfigModule } from '@nestjs/config';

export const configProvider = {
  imports: [ConfigModule.forRoot()],
  provide: 'CONFIG',
  useValue: <AppConfig>{
    database: {
      driver: process.env.DATABASE_DRIVER || 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT || '5432',
      user: process.env.DATABASE_USERNAME || 'film_user',
      password: process.env.DATABASE_PASSWORD || 'film_pass',
      name: process.env.DATABASE_NAME || 'film_db',
    },
  },
};

export interface AppConfig {
  database: AppConfigDatabase;
}

export interface AppConfigDatabase {
  driver: string;
  host: string;
  port: string;
  user: string;
  password: string;
  name: string;
}
