import { useEffect, useMemo, useRef, useState } from 'react';
import { api, errorText, NETWORK_ERROR, type ForecastResponse, type Route, type User } from '../api/client';
import { Logo } from '../ui/Logo';
import { DemandChart } from './DemandChart';
import { ForecastForm, type FormState } from './ForecastForm';
import { ResultTiles } from './ResultTiles';
import { ScenarioTable } from './ScenarioTable';
const DEBOUNCE_MS = 250;
export function Dashboard({ user, onLogout }: {
    user: User;
    onLogout: () => void;
}) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [dates, setDates] = useState<string[]>([]);
    const [form, setForm] = useState<FormState>({ origin: '', destination: '', date: '', priceText: '' });
    const [result, setResult] = useState<ForecastResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const requestId = useRef(0);
    const route = useMemo(() => routes.find((r) => r.origin.code === form.origin && r.destination.code === form.destination), [routes, form.origin, form.destination]);
    useEffect(() => {
        api
            .GET('/routes')
            .then(({ data, error: err }) => {
            if (!data)
                return setError(errorText(err));
            setRoutes(data);
            const first = data[0];
            if (first) {
                setForm((f) => ({
                    ...f,
                    origin: first.origin.code,
                    destination: first.destination.code,
                    priceText: String(first.basePrice),
                }));
            }
        })
            .catch(() => setError(NETWORK_ERROR));
    }, []);
    useEffect(() => {
        if (!route)
            return;
        let cancelled = false;
        api
            .GET('/routes/{route}/dates', { params: { path: { route: route.code } } })
            .then(({ data }) => {
            if (cancelled || !data)
                return;
            setDates(data.dates);
            setForm((f) => (data.dates.includes(f.date) ? f : { ...f, date: data.dates[0] ?? '' }));
        })
            .catch(() => setError(NETWORK_ERROR));
        return () => {
            cancelled = true;
        };
    }, [route]);
    const price = Number(form.priceText.replace(',', '.'));
    const dateOk = dates.includes(form.date);
    const priceOk = form.priceText.trim() !== '' && Number.isFinite(price) && price > 0;
    const canForecast = Boolean(route) && dateOk && priceOk;
    useEffect(() => {
        const id = ++requestId.current;
        if (!canForecast) {
            setLoading(false);
            setResult(null);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const { data, error: err, response } = await api.POST('/forecast', {
                    body: { origin: form.origin, destination: form.destination, date: form.date, price },
                    signal: controller.signal,
                });
                if (id !== requestId.current)
                    return;
                if (response.status === 401)
                    return onLogout();
                if (data) {
                    setResult(data);
                    setError(null);
                }
                else {
                    setError(errorText(err));
                }
            }
            catch {
                if (id === requestId.current)
                    setError(NETWORK_ERROR);
            }
            finally {
                if (id === requestId.current)
                    setLoading(false);
            }
        }, DEBOUNCE_MS);
        return () => {
            clearTimeout(timer);
            controller.abort();
            if (requestId.current === id)
                requestId.current = id + 1;
        };
    }, [canForecast, form.origin, form.destination, form.date, price, onLogout]);
    const formError = !route
        ? null
        : !dateOk && form.date
            ? 'На эту дату рейса нет — выберите дату с 1 июня по 1 июля 2026'
            : !priceOk
                ? 'Введите цену больше 0'
                : null;
    return (<div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <Logo size={32}/>
          <div>
            <strong>Решись Авиа</strong>
            <span className="muted"> · прогноз продаж</span>
          </div>
        </div>
        <div className="topbar-user">
          <span className="muted" title={user.email}>
            {user.name || user.email}
          </span>
          <button className="btn btn-ghost" onClick={onLogout} type="button">
            Выйти
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="card form-card">
          <h2>Параметры рейса</h2>
          <ForecastForm routes={routes} dates={dates} route={route} value={form} onChange={setForm} error={formError}/>
        </aside>

        <section className="results" aria-live="polite" aria-busy={loading}>
          {error && (<p className="alert alert-error" role="alert">
              {error}
            </p>)}
          {result ? (<div className={loading ? 'results-inner is-stale' : 'results-inner'}>
              <div className="results-head">
                <h2>
                  {result.routeName}
                  <span className="muted"> · {result.date.split('-').reverse().join('.')}</span>
                </h2>
                {result.warnings.map((w) => (<p key={w} className="alert alert-warning">
                    <span aria-hidden="true">⚠</span> {w}
                  </p>))}
              </div>
              <ResultTiles result={result} onApplyPrice={(p) => setForm((f) => ({ ...f, priceText: String(p) }))}/>
              <DemandChart result={result}/>
              <ScenarioTable result={result}/>
            </div>) : (!error && <div className="card empty">{canForecast ? 'Загружаем прогноз…' : 'Укажите корректные параметры рейса'}</div>)}
        </section>
      </main>

      <footer className="footer muted">
        Прогноз: модель AutoGluon (ML-часть кейса), 9 квантилей спроса. Формула: желают = спрос при базовой цене −
        чувствительность × (цена − базовая цена), купят = min(мест, max(0, желают)).
        <br/>
        Разработка: Claude Code (Claude Opus 5.5). Аудит: OpenAI Codex (GPT-6.1 Sol).
      </footer>
    </div>);
}
