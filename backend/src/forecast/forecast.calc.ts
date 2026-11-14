export const round = (x: number, digits: number) => {
  const k = 10 ** digits;
  return Math.round(x * k) / k;
};
// Формула из задания без промежуточного округления:
// желают = base_demand − price_sensitivity × (цена − base_price)
export function calcWish(
  baseDemand: number,
  priceSensitivity: number,
  price: number,
  basePrice: number,
): number {
  return baseDemand - priceSensitivity * (price - basePrice);
}
// купят = min(seats, max(0, желают))
export function calcBuy(wish: number, seats: number): number {
  return Math.min(seats, Math.max(0, wish));
}
