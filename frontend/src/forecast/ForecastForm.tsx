import type { Route } from '../api/client';
import { fmtDate, fmtRub } from '../lib/format';
export interface FormState {
    origin: string;
    destination: string;
    date: string;
    priceText: string;
}
interface Props {
    routes: Route[];
    dates: string[];
    route: Route | undefined;
    value: FormState;
    onChange: (next: FormState | ((prev: FormState) => FormState)) => void;
    error: string | null;
}
export function ForecastForm({ routes, dates, route, value, onChange, error }: Props) {
    const origins = [...new Map(routes.map((r) => [r.origin.code, r.origin])).values()];
    const destinations = routes.filter((r) => r.origin.code === value.origin);
    const set = (patch: Partial<FormState>) => onChange((f) => ({ ...f, ...patch }));
    const changeDestination = (code: string) => {
        const r = routes.find((x) => x.origin.code === value.origin && x.destination.code === code);
        set({ destination: code, priceText: r ? String(r.basePrice) : value.priceText });
    };
    const priceNum = Number(value.priceText.replace(',', '.'));
    return (<form className="stack" onSubmit={(e) => e.preventDefault()}>
      <div className="row-2">
        <label className="field">
          <span>Откуда</span>
          <select value={value.origin} onChange={(e) => set({ origin: e.target.value })}>
            {origins.map((o) => (<option key={o.code} value={o.code}>
                {o.city} ({o.code})
              </option>))}
          </select>
        </label>
        <label className="field">
          <span>Куда</span>
          <select value={value.destination} onChange={(e) => changeDestination(e.target.value)}>
            {destinations.map((r) => (<option key={r.destination.code} value={r.destination.code}>
                {r.destination.city} ({r.destination.code})
              </option>))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Дата вылета</span>
        <input type="date" value={value.date} min={dates[0]} max={dates[dates.length - 1]} onChange={(e) => set({ date: e.target.value })} required/>
        {dates.includes(value.date) && <small className="muted">{fmtDate(value.date)}</small>}
      </label>

      <div className="field">
        <label htmlFor="price">Цена билета, ₽</label>
        <input id="price" type="number" inputMode="numeric" min={1} step={100} value={value.priceText} onChange={(e) => set({ priceText: e.target.value })} required/>
        {route && (<>
            <input type="range" aria-label="Цена билета, ползунок" min={route.priceMin} max={route.priceMax} step={50} value={Number.isFinite(priceNum) ? Math.min(route.priceMax, Math.max(route.priceMin, priceNum)) : route.basePrice} onChange={(e) => set({ priceText: e.target.value })}/>
            <div className="range-legend muted">
              <span>{fmtRub(route.priceMin)}</span>
              <button type="button" className="link" onClick={() => set({ priceText: String(route.basePrice) })}>
                базовая {fmtRub(route.basePrice)}
              </button>
              <span>{fmtRub(route.priceMax)}</span>
            </div>
          </>)}
      </div>

      {route && (<dl className="route-facts">
          <div>
            <dt>Чувствительность к цене</dt>
            <dd>−{route.priceSensitivity} чел. на каждый +1 ₽</dd>
          </div>
          <div>
            <dt>Себестоимость пассажира</dt>
            <dd>{fmtRub(route.costPerPassenger)}</dd>
          </div>
        </dl>)}

      {error && (<p className="alert alert-error" role="alert">
          {error}
        </p>)}
    </form>);
}
