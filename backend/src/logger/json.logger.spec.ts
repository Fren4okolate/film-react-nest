import { JsonLogger } from './json.logger';

describe('JsonLogger formatting', () => {
  const logger = new JsonLogger();

  it('writes a parseable JSON record and keeps optional parameters flat', () => {
    expect(
      JSON.parse(logger.formatMessage('log', 'Started', 'Bootstrap', 3000)),
    ).toEqual({
      level: 'log',
      message: 'Started',
      optionalParams: ['Bootstrap', 3000],
    });
  });

  it('preserves object messages, arrays, numbers and null', () => {
    const message = { status: 200, items: ['one', null], enabled: false };
    expect(JSON.parse(logger.formatMessage('debug', message))).toEqual({
      level: 'debug',
      message,
      optionalParams: [],
    });
  });

  it('escapes control characters so each call occupies one physical line', () => {
    const message = 'First\nSecond\t"quoted"\\path\r\0';
    const record = logger.formatMessage('warn', message);
    expect(record).not.toMatch(/[\n\r\t\0]/);
    expect(JSON.parse(record).message).toBe(message);
  });

  it('keeps error details and stack traces', () => {
    const error = new Error('Database unavailable');
    expect(JSON.parse(logger.formatMessage('error', error)).message).toEqual({
      name: 'Error',
      message: error.message,
      stack: error.stack,
    });
  });

  it('handles undefined, bigint and circular objects without crashing', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(
      JSON.parse(logger.formatMessage('log', undefined, 42n, circular)),
    ).toEqual({
      level: 'log',
      message: null,
      optionalParams: ['42', { self: '[Circular]' }],
    });
  });
});
