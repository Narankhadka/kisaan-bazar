import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DISTRICTS_BY_PROVINCE } from '../data/districts';

const ROLES = [
  { value: 'FARMER', label: 'किसान',      desc: 'बाली बेच्न र मूल्य हेर्न' },
  { value: 'BUYER',  label: 'खरिदकर्ता',  desc: 'किसानसँग सीधा किन्न' },
];

const INPUT = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-colors';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]       = useState('login');
  const [form, setForm]     = useState({
    username: '', password: '', email: '', phone: '', district: '', role: 'FARMER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch {
      setError('प्रयोगकर्ता नाम वा पासवर्ड गलत छ।');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const d = err.response?.data;
      if (typeof d === 'object') {
        const msgs = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        setError(msgs.join(' | '));
      } else {
        setError('दर्ता गर्न सकिएन। पुनः प्रयास गर्नुस्।');
      }
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
        {/* Home button (top-left) */}
        <div className="absolute top-4 left-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-green-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            ← किसान बजार
          </Link>
        </div>

        <div className="text-4xl md:text-7xl mb-2 md:mb-4">🌾</div>
        <h1 className="text-2xl md:text-4xl font-bold">किसान बजार</h1>
        <p className="text-green-200 text-sm md:text-base mt-1 md:mt-3 md:max-w-xs">
          किसान र बजार एकै ठाउँमा।<br />बिचौलिया हटाऊँ, किसानलाई सही मूल्य दिलाऊँ।
        </p>
        <div className="hidden md:grid grid-cols-3 gap-6 mt-8">
          {[{ n: '120+', l: 'तरकारी' }, { n: '850+', l: 'किसान' }, { n: '77', l: 'जिल्ला' }].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-2xl font-bold">{s.n}</div>
              <div className="text-xs text-green-200 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 px-4 -mt-4 md:mt-0 md:flex md:items-center md:justify-center md:bg-gray-50 md:px-12">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden md:w-full md:max-w-md">

          {/* Tabs */}
          <div className="grid grid-cols-2">
            {[
              { key: 'login',    label: 'लगइन' },
              { key: 'register', label: 'दर्ता' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setError(''); }}
                className="py-4 text-sm font-bold transition-colors"
                style={tab === t.key
                  ? { color: '#1a6b2e', borderBottom: '2px solid #1a6b2e' }
                  : { color: '#9ca3af', borderBottom: '2px solid #e5e7eb' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">प्रयोगकर्ता नाम</label>
                  <input
                    type="text" required
                    value={form.username} onChange={e => set('username', e.target.value)}
                    placeholder="आफ्नो नाम"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">पासवर्ड</label>
                  <input
                    type="password" required
                    value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder="••••••••"
                    className={INPUT}
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#1a6b2e' }}
                >
                  {loading ? 'लोड हुँदैछ...' : 'लगइन गर्नुस्'}
                </button>
                <p className="text-center text-sm text-gray-500">
                  खाता छैन?{' '}
                  <button type="button" onClick={() => setTab('register')} className="font-bold hover:underline" style={{ color: '#f97316' }}>
                    दर्ता गर्नुस्
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-3.5">

                {/* Role selection */}
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      type="button" key={r.value}
                      onClick={() => set('role', r.value)}
                      className="rounded-xl p-3 border-2 text-left transition-all hover:border-green-400"
                      style={form.role === r.value
                        ? { borderColor: '#1a6b2e', backgroundColor: '#f0fdf4' }
                        : { borderColor: '#e5e7eb', backgroundColor: 'white' }
                      }
                    >
                      <div className="font-bold text-sm text-gray-800">{r.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">प्रयोगकर्ता नाम *</label>
                  <input
                    type="text" required
                    value={form.username} onChange={e => set('username', e.target.value)}
                    placeholder="अङ्ग्रेजी अक्षर/नम्बर मात्र"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">इमेल *</label>
                  <input
                    type="email" required
                    value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="name@example.com"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">फोन *</label>
                  <input
                    type="tel" required
                    value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="98XXXXXXXX"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">जिल्ला *</label>
                  <select
                    required
                    value={form.district} onChange={e => set('district', e.target.value)}
                    className={INPUT + ' bg-white'}
                  >
                    <option value="">-- जिल्ला छान्नुस् --</option>
                    {DISTRICTS_BY_PROVINCE.map(p => (
                      <optgroup key={p.province} label={p.province}>
                        {p.districts.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">पासवर्ड *</label>
                  <input
                    type="password" required minLength={8}
                    value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder="कम्तिमा ८ अक्षर"
                    className={INPUT}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm mt-1 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#1a6b2e' }}
                >
                  {loading ? 'लोड हुँदैछ...' : 'दर्ता गर्नुस्'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="h-8 md:hidden" />
    </div>
  );
}
