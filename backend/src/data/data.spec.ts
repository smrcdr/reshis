import { csvNumber } from './data.service';
describe('CSV numbers', () => {
  it.each(['', '  ', 'abc'])('rejects invalid cell %j', (value) => {
    expect(csvNumber.safeParse(value).success).toBe(false);
  });
  it.each(['0', '0.141', '900'])('accepts numeric cell %j', (value) => {
    expect(csvNumber.parse(value)).toBe(Number(value));
  });
});
