export const round = (x: number, digits: number) => {
  const k = 10 ** digits;
  return Math.round(x * k) / k;
};
export function calcWish(
  baseDemand: number,
  priceSensitivity: number,
  price: number,
  basePrice: number,
): number {
  return round(baseDemand - priceSensitivity * (price - basePrice), 1);
}
export function calcBuy(wish: number, seats: number): number {
  return Math.floor(Math.min(seats, Math.max(0, wish)));
}
