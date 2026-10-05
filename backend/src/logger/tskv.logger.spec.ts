import { TSKVLogger } from './tskv.logger';

describe('TSKVLogger formatting', () => {
  const logger = new TSKVLogger();

  it('separates flat key-value fields with tabs and includes the TSKV marker', () => {
    expect(logger.formatMessage('log', 'Started', 'Bootstrap', 3000)).toBe(
      'tskv\tlevel=log\tmessage=Started\toptionalParams=["Bootstrap",3000]',
    );
  });

  it('escapes tabs, newlines, carriage returns, nulls, equals and backslashes', () => {
    expect(logger.formatMessage('warn', 'a\tb\nc\rd\0e=f\\g')).toBe(
      'tskv\tlevel=warn\tmessage=a\\tb\\nc\\rd\\0e\\=f\\\\g\toptionalParams=[]',
    );
  });

  it('serializes object messages into a single string field', () => {
    expect(
      logger.formatMessage('debug', { rows: [1, 2], enabled: false }),
    ).toBe(
      'tskv\tlevel=debug\tmessage={"rows":[1,2],"enabled":false}\toptionalParams=[]',
    );
  });

  it('escapes optional parameters without introducing extra fields or records', () => {
    const record = logger.formatMessage(
      'error',
      'Failed',
      'stack\nline',
      'a=b',
    );
    expect(record).toBe(
      'tskv\tlevel=error\tmessage=Failed\toptionalParams=["stack\\\\nline","a\\=b"]',
    );
    expect(record.split('\t')).toHaveLength(4);
    expect(record).not.toMatch(/[\n\r\0]/);
  });

  it.each([undefined, null, 0, false])(
    'supports the primitive message %s',
    (value) => {
      const expected = value == null ? 'null' : String(value);
      expect(logger.formatMessage('log', value)).toBe(
        `tskv\tlevel=log\tmessage=${expected}\toptionalParams=[]`,
      );
    },
  );
});
