import { paginationSchema } from './pagination-schemas.js';

describe('paginationSchema', () => {
  it('aplica defaults page=1 y limit=100', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 100 });
  });

  it('coerciona strings del query string', () => {
    expect(paginationSchema.parse({ page: '2', limit: '10' })).toEqual({
      page: 2,
      limit: 10,
    });
  });

  it.each([
    { page: 0 },
    { page: -1 },
    { page: 1.5 },
    { limit: 0 },
    { limit: 101 },
    { limit: 'abc' },
  ])('rechaza %j', (input) => {
    expect(() => paginationSchema.parse(input)).toThrow();
  });
});
