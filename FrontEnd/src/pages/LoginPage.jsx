import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const INPUT = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-colors';

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [form, setForm]                 = useState({ username: '', password: '' });
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.username, form.password);
      navigate(searchParams.get('next') || '/');
    } catch {
      setError(t('login.err_creds'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left panel — hero / branding */}
      <div
        className="relative px-4 pt-12 pb-10 text-white text-center md:flex md:flex-col md:items-center md:justify-center md:flex-1 md:pt-0 md:pb-0"
        style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
      >
        <div className="absolute top-4 left-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-green-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            {t('login.back')}
          </Link>
        </div>
        <div className="flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/20 mb-2 md:mb-4 mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 md:w-12 md:h-12 text-white">
            <path d="M12 2a10 10 0 0 1 10 10c0 4-2.5 7.5-6 9M12 2C8 6 6 10 6 14c0 3 1.5 5.5 4 7"/>
            <path d="M12 22V10M8 14c1.5-1 3-1.5 4-2M16 14c-1.5-1-3-1.5-4-2"/>
          </svg>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold">{t('app.name')}</h1>
        <p className="text-green-200 text-sm md:text-base mt-1 md:mt-3 md:max-w-xs">
          {t('app.tagline')}
        </p>
        <div className="hidden md:grid grid-cols-3 gap-6 mt-8">
          {[
            { n: '120+', l: t('stats.vegetables') },
            { n: '850+', l: t('stats.farmers') },
            { n: '77',   l: t('stats.districts') },
          ].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-2xl font-bold">{s.n}</div>
              <div className="text-xs text-green-200 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 px-4 -mt-4 md:mt-0 md:flex md:items-center md:justify-center md:bg-gray-50 md:px-12">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden md:w-full md:max-w-md">
          <div className="py-4 px-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-center" style={{ color: '#1a6b2e' }}>{t('login.tab_login')}</h2>
          </div>

          <div className="p-5">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.username')}</label>
                <input
                  type="text" required autoFocus
                  value={form.username} onChange={e => set('username', e.target.value)}
                  placeholder={t('login.username')}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('login.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder="••••••••"
                    className={INPUT + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: '#1a6b2e', minHeight: '48px' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    {t('loading')}
                  </span>
                ) : t('login.login_btn')}
              </button>
              <p className="text-center text-sm text-gray-500">
                {t('login.no_account')}{' '}
                <Link to="/register" className="font-bold hover:underline" style={{ color: '#f97316' }}>
                  {t('login.register_link')}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
      <div className="h-8 md:hidden" />
    </div>
  );
}
