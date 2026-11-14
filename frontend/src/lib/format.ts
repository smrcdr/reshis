const int = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', weekday: 'short', timeZone: 'UTC' });
export const fmtInt = (n: number) => int.format(n);
export const fmtOne = (n: number) => one.format(n);
export const fmtRub = (n: number) => `${int.format(n)} ₽`;
export const fmtPct = (n: number) => pct.format(n);
export const fmtDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`));
export function people(n: number): string {
    if (!Number.isInteger(n))
        return 'человека';
    const abs = Math.abs(Math.trunc(n));
    const mod10 = abs % 10;
    const mod100 = abs % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
        return 'человека';
    return 'человек';
}
