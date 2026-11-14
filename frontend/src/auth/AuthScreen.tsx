import { useState, type FormEvent } from 'react';
import { api, errorText, NETWORK_ERROR, type User } from '../api/client';
import { Logo } from '../ui/Logo';
type Mode = 'login' | 'register';
export function AuthScreen({ onAuth }: {
    onAuth: (token: string, user: User) => void;
}) {
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const switchMode = (m: Mode) => {
        setMode(m);
        setError(null);
    };
    async function submit(e: FormEvent) {
        e.preventDefault();
        if (new TextEncoder().encode(password).length > 72) {
            setError('Пароль должен занимать не более 72 байт UTF-8');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const res = mode === 'login'
                ? await api.POST('/auth/login', { body: { email, password } })
                : await api.POST('/auth/register', { body: { email, password, name: name.trim() || undefined } });
            if (res.data)
                onAuth(res.data.accessToken, res.data.user);
            else
                setError(errorText(res.error));
        }
        catch {
            setError(NETWORK_ERROR);
        }
        finally {
            setBusy(false);
        }
    }
    return (<main className="auth">
      <section className="auth-card card">
        <div className="auth-brand">
          <Logo />
          <div>
            <h1>Решись Авиа</h1>
            <p className="muted">Прогноз продаж билетов по цене — для менеджеров</p>
          </div>
        </div>

        <div className="segmented" role="tablist" aria-label="Вход или регистрация">
          <button role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')} type="button">
            Вход
          </button>
          <button role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')} type="button">
            Регистрация
          </button>
        </div>

        <form onSubmit={submit} className="stack" noValidate={false}>
          {mode === 'register' && (<label className="field">
              <span>Имя <span className="muted">(необязательно)</span></span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100}/>
            </label>)}
          <label className="field">
            <span>Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="manager@reshis.avia"/>
          </label>
          <label className="field">
            <span>Пароль</span>
            <input type="password" required minLength={mode === 'register' ? 8 : 1} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/>
            {mode === 'register' && <small className="muted">От 8 символов, не более 72 байт UTF-8 (кириллица занимает по 2 байта)</small>}
          </label>

          {error && (<p className="alert alert-error" role="alert">
              {error}
            </p>)}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
      </section>
    </main>);
}
