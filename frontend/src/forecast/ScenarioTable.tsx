import type { ForecastResponse } from '../api/client';
import { fmtInt, fmtOne } from '../lib/format';
const scenarioName = (q: number) => q === 0.1 ? 'пессимистичный' : q === 0.5 ? 'медиана' : q === 0.9 ? 'оптимистичный' : '';
export function ScenarioTable({ result }: {
    result: ForecastResponse;
}) {
    return (<details className="card scenarios">
      <summary>
        <h3>Все 9 сценариев спроса</h3>
        <span className="muted">таблица к графику</span>
      </summary>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Сценарий</th>
              <th scope="col" className="num">Спрос при базовой цене</th>
              <th scope="col" className="num">Желают при вашей цене</th>
              <th scope="col" className="num">Купят</th>
            </tr>
          </thead>
          <tbody>
            {result.quantiles.map((s) => (<tr key={s.q} className={s.q === 0.5 ? 'is-median' : undefined}>
                <th scope="row">
                  {Math.round(s.q * 100)}%{' '}
                  <span className="muted">{scenarioName(s.q)}</span>
                </th>
                <td className="num">{fmtInt(s.baseDemand)}</td>
                <td className="num">
                  {fmtOne(Math.max(0, s.wish))}
                  {s.wish < 0 && <div className="muted small">По формуле: {fmtOne(s.wish)}</div>}
                </td>
                <td className="num">
                  {fmtOne(s.buy)}
                  {s.capped && <span className="tag">все места</span>}
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Сценарий X% — спрос окажется ниже этого значения с вероятностью X%. Между соседними сценариями — 10% вероятности.
      </p>
    </details>);
}
