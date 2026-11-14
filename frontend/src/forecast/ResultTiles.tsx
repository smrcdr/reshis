import type { ForecastResponse } from '../api/client';
import { fmtInt, fmtOne, fmtPct, fmtRub, people } from '../lib/format';
interface Props {
    result: ForecastResponse;
    onApplyPrice: (price: number) => void;
}
export function ResultTiles({ result, onApplyPrice }: Props) {
    const { seats, wish, buy, soldOut, loadFactor = buy / seats, revenue, profit, recommendedPrice, price } = result;
    const unmet = Math.max(0, wish - seats);
    const displayedWish = Math.max(0, wish);
    return (<div className="tiles">
      <article className="tile tile-hero">
        <h3>Купят билетов</h3>
        <p className="tile-value">
          {fmtOne(buy)}
          <span className="tile-unit"> из {fmtInt(seats)}</span>
        </p>
        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={seats} aria-valuenow={buy} aria-label="Заполняемость самолёта">
          <span style={{ width: `${Math.min(100, loadFactor * 100)}%` }}/>
        </div>
        {soldOut ? (<p className="status status-warning">
            <span aria-hidden="true">●</span> Самолёт заполнен: спрос выше числа мест
            {unmet > 0 && ` на ${fmtOne(unmet)}`}
          </p>) : (<p className="muted">
            Заполняемость {fmtPct(loadFactor)} · свободно {fmtOne(seats - buy)} мест
          </p>)}
      </article>

      <article className="tile">
        <h3>Желают купить</h3>
        <p className="tile-value">
          {fmtOne(displayedWish)}
          <span className="tile-unit"> {people(displayedWish)}</span>
        </p>
        <p className="muted">медианный спрос при цене {fmtRub(price)}</p>
        {wish < 0 && (<p className="muted small">
            Результат линейной формулы: {fmtOne(wish)}. При этой цене модель не ожидает покупателей.
          </p>)}
      </article>

      <article className="tile">
        <h3>Мест в самолёте</h3>
        <p className="tile-value">{fmtInt(seats)}</p>
        <p className="muted">вместимость рейса</p>
      </article>

      {revenue !== undefined && (<article className="tile">
          <h3>Выручка</h3>
          <p className="tile-value">{fmtRub(revenue)}</p>
          {profit !== undefined && (<p className="muted">
              прибыль <strong className={profit < 0 ? 'neg' : undefined}>{fmtRub(profit)}</strong>
            </p>)}
        </article>)}

      {recommendedPrice !== undefined && (<article className="tile">
          <h3>Оптимальная цена (ML)</h3>
          <p className="tile-value">{fmtRub(recommendedPrice)}</p>
          {Math.round(recommendedPrice) === Math.round(price) ? (<p className="muted">уже подставлена</p>) : (<button className="btn btn-secondary btn-sm" type="button" onClick={() => onApplyPrice(recommendedPrice)}>
              Подставить эту цену
            </button>)}
        </article>)}
    </div>);
}
