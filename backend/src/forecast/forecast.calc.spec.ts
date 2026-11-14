import { calcBuy, calcWish } from './forecast.calc';
describe('forecast formula', () => {
  it('считает «желают» по формуле из задания', () => {
    expect(calcWish(836, 0.141, 10000, 9000)).toBeCloseTo(695, 9);
    expect(calcWish(836, 0.141, 9000, 9000)).toBe(836);
    expect(calcWish(836, 0.141, 8000, 9000)).toBeCloseTo(977, 9);
  });
  it('не округляет промежуточный результат', () => {
    expect(calcWish(836, 0.141, 10064, 9000)).toBeCloseTo(685.976, 9);
    expect(calcBuy(685.976, 900)).toBeCloseTo(685.976, 9);
  });
  it('«купят» не меньше 0', () => {
    expect(calcBuy(-50, 900)).toBe(0);
  });
  it('«купят» не больше числа мест', () => {
    expect(calcBuy(977, 900)).toBe(900);
  });
});
