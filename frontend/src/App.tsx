import { useEffect, useState } from 'react';
import { api, tokenStore, type User } from './api/client';
import { AuthScreen } from './auth/AuthScreen';
import { Dashboard } from './forecast/Dashboard';
export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [checking, setChecking] = useState(() => tokenStore.get() !== null);
    useEffect(() => {
        if (!tokenStore.get())
            return;
        api
            .GET('/auth/me')
            .then(({ data }) => {
            if (data)
                setUser(data);
            else
                tokenStore.clear();
        })
            .catch(() => tokenStore.clear())
            .finally(() => setChecking(false));
    }, []);
    const logout = () => {
        tokenStore.clear();
        setUser(null);
    };
    if (checking)
        return <div className="splash">Загрузка…</div>;
    return user ? (<Dashboard user={user} onLogout={logout}/>) : (<AuthScreen onAuth={(token, u) => {
            tokenStore.set(token);
            setUser(u);
        }}/>);
}
