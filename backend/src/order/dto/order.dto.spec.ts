import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateOrderDto } from './order.dto';

describe('CreateOrderDto validation', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    transform: true,
  });
  const ticket = {
    film: 'film-1',
    session: 'session-1',
    daytime: '2026-10-03T18:00:00Z',
    row: 1,
    seat: 1,
    price: 500,
  };

  function validateTicket(coordinates: Record<string, unknown>) {
    return validationPipe.transform(
      { tickets: [{ ...ticket, ...coordinates }] },
      { type: 'body', metatype: CreateOrderDto },
    );
  }

  it.each(['row', 'seat'])(
    'accepts a positive integer for %s',
    async (field) => {
      await expect(validateTicket({ [field]: 1 })).resolves.toBeInstanceOf(
        CreateOrderDto,
      );
    },
  );

  describe.each(['row', 'seat'])('%s', (field) => {
    it.each([-1, 0, 1.5, 99.5, '1', null, undefined])(
      'rejects %p with HTTP 400',
      async (value) => {
        await expect(validateTicket({ [field]: value })).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );
  });

  it('rejects the reported negative row and fractional seat', async () => {
    await expect(
      validateTicket({ row: -1, seat: 99.5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
