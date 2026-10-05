import { ConfigService } from '@nestjs/config';
import { DevLogger } from './dev.logger';
import { JsonLogger } from './json.logger';
import { selectLogger } from './logger.module';
import { TSKVLogger } from './tskv.logger';

describe('Logger selection', () => {
  const dev = new DevLogger();
  const json = new JsonLogger();
  const tskv = new TSKVLogger();

  const configuration = (values: Record<string, string>) => {
    const config = new ConfigService();
    jest
      .spyOn(config, 'get')
      .mockImplementation(
        (key: string, fallback?: unknown) => values[key] ?? fallback,
      );
    return config;
  };

  it.each([
    ['dev', dev],
    ['json', json],
    ['tskv', tskv],
  ])(
    'selects the logger configured by LOGGER_FORMAT=%s',
    (format, expected) => {
      expect(
        selectLogger(
          configuration({ LOGGER_FORMAT: String(format) }),
          dev,
          json,
          tskv,
        ),
      ).toBe(expected);
    },
  );

  it('uses JSON in production unless explicitly configured otherwise', () => {
    const config = configuration({ NODE_ENV: 'production' });
    expect(selectLogger(config, dev, json, tskv)).toBe(json);
  });

  it('uses the native development logger locally', () => {
    const config = configuration({ NODE_ENV: 'development' });
    expect(selectLogger(config, dev, json, tskv)).toBe(dev);
  });

  it('fails clearly for an unsupported format', () => {
    expect(() =>
      selectLogger(configuration({ LOGGER_FORMAT: 'xml' }), dev, json, tskv),
    ).toThrow('LOGGER_FORMAT must be dev, json or tskv');
  });
});
