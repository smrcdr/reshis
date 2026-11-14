import { useEffect, useId, useRef, useState } from 'react';
import type { ForecastResponse } from '../api/client';
import { fmtInt, fmtOne } from '../lib/format';
const HEIGHT = 300;
const M = { top: 52, right: 20, bottom: 40, left: 20 };
const TAIL_LABEL_PX = 64;
interface Bin {
    from: number;
    to: number;
    density: number;
    qFrom: number;
    qTo: number;
}
function niceTicks(lo: number, hi: number, count = 6): number[] {
    const raw = (hi - lo) / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? raw;
    const ticks: number[] = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step)
        ticks.push(Math.round(v * 1e6) / 1e6);
    return ticks;
}
function topRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.max(0, Math.min(r, w / 2, h));
    return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}
function useWidth<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(640);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return [ref, width] as const;
}
export function DemandChart({ result }: {
    result: ForecastResponse;
}) {
    const [wrapRef, width] = useWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);
    const uid = useId().replace(/:/g, '');
    const { quantiles, seats, wish: median } = result;
    const w = quantiles.map((q) => q.wish);
    const span = Math.max(w[w.length - 1] - w[0], 1);
    const minWidth = span * 0.01;
    const bins: Bin[] = [];
    for (let i = 0; i < w.length - 1; i++) {
        const from = w[i];
        const to = Math.max(w[i + 1], from + minWidth);
        bins.push({ from, to, density: 0.1 / (to - from), qFrom: quantiles[i].q, qTo: quantiles[i + 1].q });
    }
    const lo = Math.min(w[0], seats);
    const hi = Math.max(bins[bins.length - 1].to, seats);
    const pad = Math.max((hi - lo) * 0.1, 5);
    const x0 = lo - pad;
    const x1 = hi + pad;
    const innerW = width - M.left - M.right;
    const innerH = HEIGHT - M.top - M.bottom;
    const x = (v: number) => M.left + ((v - x0) / (x1 - x0)) * innerW;
    const maxDensity = Math.max(...bins.map((b) => b.density));
    const y = (d: number) => M.top + innerH - (d / maxDensity) * innerH * 0.92;
    const baseY = M.top + innerH;
    const seatsX = x(seats);
    const medianX = x(median);
    const ticks = niceTicks(x0, x1, width < 480 ? 4 : 7);
    const anchor = (px: number) => (px > width - 110 ? 'end' : px < 110 ? 'start' : 'middle');
    const hovered = hover !== null ? bins[hover] : null;
    const capped = result.quantiles.some((q) => q.capped);
    return (<figure className="card chart-card">
      <figcaption>
        <h3>Распределение спроса при цене {fmtInt(result.price)} ₽</h3>
        <p className="muted">
          Каждый столбец — 10% вероятности. Высота показывает плотность вероятности: более узкие интервалы выше, но вероятность каждого интервала одинакова — 10%.
          {capped
            ? ' Часть сценариев упирается в число мест — продажи там ограничены вместимостью.'
            : ' Во всех сценариях мест хватает.'}
        </p>
        {w.some((value) => value < 0) && (<p className="muted small">
            График показывает исходные значения по формуле, включая отрицательные.
            Отрицательный результат означает, что при этой цене модель не ожидает покупателей.
            {median < 0 && ` Медиана по формуле: ${fmtOne(median)}; в карточке «Желают купить» — 0 человек.`}
          </p>)}
      </figcaption>

      <div className="chart-wrap" ref={wrapRef}>
        <svg width={width} height={HEIGHT} role="img" aria-label={`Распределение спроса: от ${fmtInt(w[0])} до ${fmtInt(w[8])} человек, медиана ${fmtOne(median)}, мест ${fmtInt(seats)}`}>
          <defs>
            <pattern id={`hatch-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chart-hatch)" strokeWidth="2"/>
            </pattern>
            <clipPath id={`below-${uid}`}>
              <rect x={0} y={0} width={Math.max(0, seatsX)} height={HEIGHT}/>
            </clipPath>
            <clipPath id={`above-${uid}`}>
              <rect x={seatsX} y={0} width={Math.max(0, width - seatsX)} height={HEIGHT}/>
            </clipPath>
          </defs>

          
          {seatsX < width - M.right && (<g>
              <rect x={seatsX} y={M.top} width={width - M.right - seatsX} height={innerH} fill={`url(#hatch-${uid})`}/>
              {width - M.right - seatsX > 90 && (<text x={seatsX + 8} y={M.top + 14} textAnchor="start" className="chart-note">
                  мест не хватит →
                </text>)}
            </g>)}

          
          {ticks.map((t) => (<g key={t}>
              <line x1={x(t)} x2={x(t)} y1={M.top} y2={baseY} className="chart-grid"/>
              <text x={x(t)} y={baseY + 18} textAnchor="middle" className="chart-tick">
                {fmtInt(t)}
              </text>
            </g>))}
          <line x1={M.left} x2={width - M.right} y1={baseY} y2={baseY} className="chart-axis"/>
          <text x={width - M.right} y={HEIGHT - 4} textAnchor="end" className="chart-tick">
            спрос, человек
          </text>

          
          {(['below', 'above'] as const).map((part) => (<g key={part} clipPath={`url(#${part}-${uid})`} className={part === 'above' ? 'bars-capped' : 'bars'}>
              {bins.map((b, i) => {
                const bx = x(b.from) + 1;
                const bw = Math.max(1, x(b.to) - x(b.from) - 2);
                const by = y(b.density);
                return (<path key={i} d={topRoundedRect(bx, by, bw, baseY - by, 4)} className={hover === i ? 'bar is-hover' : 'bar'}/>);
            })}
            </g>))}

          
          {x(w[0]) - M.left > TAIL_LABEL_PX && (<text x={x(w[0]) - 6} y={baseY - 8} textAnchor="end" className="chart-note">
              10% ниже
            </text>)}
          {width - M.right - x(bins[bins.length - 1].to) > TAIL_LABEL_PX && (<text x={x(bins[bins.length - 1].to) + 6} y={baseY - 8} textAnchor="start" className="chart-note">
              10% выше
            </text>)}

          
          <line x1={seatsX} x2={seatsX} y1={M.top - 30} y2={baseY} className="chart-seats"/>
          <text x={seatsX} y={M.top - 36} textAnchor={anchor(seatsX)} className="chart-label">
            Мест: {fmtInt(seats)}
          </text>

          
          <line x1={medianX} x2={medianX} y1={M.top - 12} y2={baseY} className="chart-median"/>
          <text x={medianX} y={M.top - 18} textAnchor={anchor(medianX)} className="chart-label chart-label-median">
            {median < 0 ? 'По формуле' : 'Медиана'}: {fmtOne(median)}
          </text>

          
          {bins.map((b, i) => (<rect key={i} x={x(b.from)} y={M.top} width={Math.max(8, x(b.to) - x(b.from))} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`Спрос от ${fmtInt(b.from)} до ${fmtInt(b.to)} человек с вероятностью 10%`}/>))}
        </svg>

        {hovered && (<div className="tooltip" style={{
                left: Math.min(width - 210, Math.max(0, x((hovered.from + hovered.to) / 2) - 105)),
                top: Math.max(0, y(hovered.density) - 92),
            }} role="status">
            <strong>
              {fmtInt(hovered.from)} – {fmtInt(hovered.to)} чел.
            </strong>
            <span>вероятность 10% (сценарии {Math.round(hovered.qFrom * 100)}–{Math.round(hovered.qTo * 100)}%)</span>
            <span>
              купят:{' '}
              {hovered.from >= seats
                ? `${fmtInt(seats)} — все места`
                : hovered.to > seats
                    ? `${fmtOne(Math.max(0, hovered.from))} – ${fmtInt(seats)}`
                    : `${fmtOne(Math.max(0, hovered.from))} – ${fmtOne(Math.max(0, hovered.to))}`}
            </span>
          </div>)}
      </div>

      <ul className="chart-legend" aria-label="Обозначения">
        <li>
          <i className="sw sw-bar"/> вероятность спроса
        </li>
        <li>
          <i className="sw sw-median"/> {median < 0 ? 'медиана — результат формулы' : 'медиана — «желают»'}
        </li>
        <li>
          <i className="sw sw-seats"/> число мест
        </li>
        <li>
          <i className="sw sw-hatch"/> спрос больше мест
        </li>
      </ul>
    </figure>);
}
