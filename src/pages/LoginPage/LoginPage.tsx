import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.scss';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (user) navigate('/search', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/search', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      {/* Top header — brand mark only, left-aligned */}
      <header className="login-page__header">
        <div className="login-page__brand">
          <div className="login-page__gem">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
              <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="8" x2="22" y2="8" />
              <line x1="2" y1="16" x2="22" y2="16" />
            </svg>
          </div>
          <div>
            <div className="login-page__brand-name">OreBase</div>
            <div className="login-page__brand-tag">Mineral Intelligence</div>
          </div>
        </div>
      </header>

      {/* Centered main content */}
      <main className="login-page__main">

        {/* Hero text — same style as SearchPage */}
        <div className="login-page__hero">
          <h1>
            The structured intelligence layer for{' '}
            <em>mining metallurgy</em>
          </h1>
          <p>
            Search, explore, and analyse mineral properties, extraction processes,
            and supply chains — powered by structured data and AI.
          </p>
        </div>

        {/* Login card */}
        <div className="login-page__card">
          <h2 className="login-page__title">Sign in to your account</h2>

          <form className="login-page__form" onSubmit={handleSubmit}>
            <div className="login-page__field">
              <label className="login-page__label" htmlFor="email">Email</label>
              <input
                id="email"
                className="login-page__input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="login-page__field">
              <label className="login-page__label" htmlFor="password">Password</label>
              <input
                id="password"
                className="login-page__input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <div className="login-page__error">{error}</div>}

            <button className="login-page__submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
