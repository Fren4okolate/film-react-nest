import { LogLevel } from '@nestjs/common';
import { JsonLogger } from './json.logger';
import { TSKVLogger } from './tskv.logger';

describe.each([
  {
    name: 'JsonLogger',
    logger: new JsonLogger(),
    expected: (level: string) =>
      `{"level":"${level}","message":"Hello","optionalParams":["Context",1]}`,
  },
  {
    name: 'TSKVLogger',
    logger: new TSKVLogger(),
    expected: (level: string) =>
      `tskv\tlevel=${level}\tmessage=Hello\toptionalParams=["Context",1]`,
  },
])('$name console output', ({ logger, expected }) => {
  afterEach(() => jest.restoreAllMocks());

  const levels: Array<[LogLevel, 'log' | 'error' | 'warn' | 'debug']> = [
    ['log', 'log'],
    ['error', 'error'],
    ['warn', 'warn'],
    ['debug', 'debug'],
    ['verbose', 'log'],
    ['fatal', 'error'],
  ];
  it.each(levels)('writes %s to console.%s exactly once', (level, output) => {
    const spy = jest.spyOn(console, output).mockImplementation(() => undefined);
    logger[level]('Hello', 'Context', 1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expected(level));
  });
});
