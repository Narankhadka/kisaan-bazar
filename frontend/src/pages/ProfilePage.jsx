import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Spinner from '../components/Spinner';

const STATUS_LABELS = {
  PENDING:   { ne: 'पेन्डिङ',   en: 'Pending',   color: '#f59e0b' },
  ACCEPTED:  { ne: 'स्वीकृत',   en: 'Accepted',  color: '#16a34a' },
  REJECTED:  { ne: 'अस्वीकृत', en: 'Rejected',  color: '#dc2626' },
  COMPLETED: { ne: 'सम्पन्न',  en: 'Completed', color: '#6366f1' },
};

function AlertSection({ crops, t }) {
  const [alerts, setAlerts]   = useState([]);
  const [form, setForm]       = useState({ crop: '', threshold_price: '', condition: 'BELOW', via_sms: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/alerts/my/', { signal: controller.signal })
      .then(({ data }) => setAlerts(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/alerts/', form);
      setAlerts(prev => [data, ...prev]);
      setForm({ crop: '', threshold_price: '', condition: 'BELOW', via_sms: true });
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : t('prof.no_alerts'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/alerts/${id}/`);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3">{t('prof.alerts_title')}</h3>

      <form onSubmit={handleAdd} className="bg-orange-50 rounded-2xl p-4 mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600 block mb-1">{t('prof.crop')}</label>
            <select
              required value={form.crop}
              onChange={e => setForm(f => ({ ...f, crop: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="">{t('prof.select_crop')}</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name_nepali}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">{t('prof.threshold')}</label>
            <input
              required type="number" min="1"
              value={form.threshold_price}
              onChange={e => setForm(f => ({ ...f, threshold_price: e.target.value }))}
              placeholder="रु."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['BELOW', 'ABOVE'].map(c => (
            <button
              type="button" key={c}
              onClick={() => setForm(f => ({ ...f, condition: c }))}
              className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
              style={form.condition === c
                ? { backgroundColor: '#f97316', color: 'white', borderColor: '#f97316' }
                : { backgroundColor: 'white', color: '#374151', borderColor: '#d1d5db' }
              }
            >
              {c === 'BELOW' ? t('prof.below') : t('prof.above')}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.via_sms}
            onChange={e => setForm(f => ({ ...f, via_sms: e.target.checked }))}
            className="w-4 h-4 accent-orange-500"
          />
          {t('prof.sms')}
        </label>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit" disabled={saving}
          className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
          style={{ backgroundColor: '#f97316' }}
        >
          {saving ? t('prof.adding') : t('prof.add_alert')}
        </button>
      </form>

      {loading ? <Spinner size={6} /> : alerts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">{t('prof.no_alerts')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map(a => (
            <div key={a.id} className="bg-white rounded-2xl p-3 flex items-center justify-between border border-gray-100">
              <div>
                <span className="font-medium text-sm">{a.crop_detail?.name_nepali || a.crop}</span>
                <div className="text-xs text-gray-500">
                  {a.condition === 'BELOW' ? '▼' : '▲'} रु.{a.threshold_price}
                  {a.via_sms && <span className="ml-2">📱 SMS</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-red-400 text-sm px-2 py-1"
              >🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyOrders({ t }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { lang } = useLanguage();

  useEffect(() => {
    const controller = new AbortController();
    api.get('/orders/my/', { signal: controller.signal })
      .then(({ data }) => setOrders(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handleStatus = async (id, newStatus) => {
    await api.patch(`/orders/${id}/status/`, { status: newStatus });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  if (loading) return <Spinner size={6} />;
  if (orders.length === 0) return <p className="text-sm text-gray-400 text-center py-4">{t('prof.no_orders')}</p>;

  return (
    <div className="flex flex-col gap-3">
      {orders.map(o => {
        const s = STATUS_LABELS[o.status] || STATUS_LABELS.PENDING;
        return (
          <div key={o.id} className="bg-white rounded-2xl p-3 border border-gray-100">
            <div className="flex items-start justify-between mb-1">
              <div>
                <span className="font-medium text-sm">{o.crop_name || `#${o.id}`}</span>
                <div className="text-xs text-gray-500">{parseFloat(o.quantity_kg).toFixed(0)} kg</div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: s.color }}>
                {lang === 'en' ? s.en : s.ne}
              </span>
            </div>
            {o.message && <p className="text-xs text-gray-500 italic mb-2">"{o.message}"</p>}
            {user?.role === 'FARMER' && o.status === 'PENDING' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleStatus(o.id, 'ACCEPTED')}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: '#16a34a' }}
                >{t('prof.accept')}</button>
                <button
                  onClick={() => handleStatus(o.id, 'REJECTED')}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: '#dc2626' }}
                >{t('prof.reject')}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MyListings({ t }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/listings/my/', { signal: controller.signal })
      .then(({ data }) => setListings(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/listings/${id}/`);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  if (loading) return <Spinner size={6} />;
  if (listings.length === 0) return <p className="text-sm text-gray-400 text-center py-4">{t('prof.no_listings')}</p>;

  return (
    <div className="flex flex-col gap-2">
      {listings.map(l => (
        <div key={l.id} className="bg-white rounded-2xl p-3 flex items-center justify-between border border-gray-100">
          <div>
            <span className="font-medium text-sm">{l.crop?.name_nepali || l.crop}</span>
            <div className="text-xs text-gray-500">
              {parseFloat(l.quantity_kg).toFixed(0)} kg · रु.{parseFloat(l.asking_price).toFixed(0)}/kg · {l.district}
            </div>
          </div>
          <button onClick={() => handleDelete(l.id)} className="text-red-400 text-sm px-2 py-1">🗑️</button>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [tab, setTab]     = useState(user?.role === 'FARMER' ? 'listings' : 'orders');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const controller = new AbortController();
    api.get('/crops/', { signal: controller.signal })
      .then(({ data }) => setCrops(data.results || []))
      .catch(() => {});
    return () => controller.abort();
  }, [user]);

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  // ── ADMIN profile ────────────────────────────────────────────────────────────
  if (user.role === 'ADMIN') {
    return (
      <div className="pb-24 md:pb-10">
        <div
          className="text-white"
          style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
        >
          <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-10 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div className="font-bold text-lg">{user.username}</div>
                <div className="text-green-200 text-sm">{t('prof.admin')}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 bg-white/10 rounded-2xl p-3 md:max-w-sm">
              {[
                { label: t('prof.phone'), value: user.phone || user.username },
                { label: t('prof.email'), value: user.email ? user.email.split('@')[0] + '...' : '—' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="text-xs text-green-200">{item.label}</div>
                  <div className="text-xs font-medium truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6 md:max-w-sm">
          <Link
            to="/admin-panel"
            className="block w-full py-3.5 rounded-2xl text-white font-bold text-sm text-center hover:opacity-90 transition-opacity mb-3"
            style={{ backgroundColor: '#1a6b2e' }}
          >
            {t('prof.go_admin_panel')}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl border-2 border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors"
          >
            {t('prof.logout')}
          </button>
        </div>
      </div>
    );
  }

  // ── FARMER / BUYER profile ───────────────────────────────────────────────────
  const roleLabel = user.role === 'FARMER' ? t('prof.farmer') : t('prof.buyer');

  return (
    <div className="pb-24 md:pb-10">
      {/* Header */}
      <div
        className="text-white"
        style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">
              {user.role === 'FARMER' ? '👨‍🌾' : '🛒'}
            </div>
            <div>
              <div className="font-bold text-lg">{user.username}</div>
              <div className="text-green-200 text-sm">{roleLabel}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 bg-white/10 rounded-2xl p-3 md:max-w-sm">
            {[
              { label: t('prof.phone'),    value: user.phone    || '—' },
              { label: t('prof.district'), value: user.district || '—' },
              { label: t('prof.email'),    value: user.email ? user.email.split('@')[0] + '...' : '—' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="text-xs text-green-200">{item.label}</div>
                <div className="text-xs font-medium truncate">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 flex">
          {user.role === 'FARMER' && (
            <button
              onClick={() => setTab('listings')}
              className="py-3 px-4 text-sm font-medium transition-colors"
              style={tab === 'listings' ? { color: '#1a6b2e', borderBottom: '2px solid #1a6b2e' } : { color: '#9ca3af' }}
            >{t('prof.tab_listings')}</button>
          )}
          <button
            onClick={() => setTab('orders')}
            className="py-3 px-4 text-sm font-medium transition-colors"
            style={tab === 'orders' ? { color: '#1a6b2e', borderBottom: '2px solid #1a6b2e' } : { color: '#9ca3af' }}
          >{t('prof.tab_orders')}</button>
          <button
            onClick={() => setTab('alerts')}
            className="py-3 px-4 text-sm font-medium transition-colors"
            style={tab === 'alerts' ? { color: '#f97316', borderBottom: '2px solid #f97316' } : { color: '#9ca3af' }}
          >{t('prof.tab_alerts')}</button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-4 md:max-w-2xl">
        {tab === 'listings' && user.role === 'FARMER' && <MyListings t={t} />}
        {tab === 'orders'   && <MyOrders t={t} />}
        {tab === 'alerts'   && <AlertSection crops={crops} t={t} />}

        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl border-2 border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors"
          >
            {t('prof.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
