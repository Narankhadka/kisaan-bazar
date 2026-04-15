import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DISTRICTS_BY_PROVINCE } from '../data/districts';
import Spinner from '../components/Spinner';

const GREEN  = '#1a6b2e';
const ORANGE = '#f97316';

const INPUT = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 bg-white transition-colors';

const STATUS_CFG = {
  PENDING:   { key: 'status.PENDING',   bg: '#fef3c7', color: '#d97706' },
  ACCEPTED:  { key: 'status.ACCEPTED',  bg: '#dcfce7', color: '#16a34a' },
  REJECTED:  { key: 'status.REJECTED',  bg: '#fee2e2', color: '#dc2626' },
  COMPLETED: { key: 'status.COMPLETED', bg: '#dbeafe', color: '#2563eb' },
};

// ─── Skeleton ──────────────────────────────────────────────────────────────
function Skel({ h = 'h-6', w = 'w-full', cls = '' }) {
  return <div className={`bg-gray-200 animate-pulse rounded-xl ${h} ${w} ${cls}`} />;
}

// ─── Stat Card ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, loading, accent = GREEN, borderColor }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
      style={borderColor ? { borderLeft: `4px solid ${borderColor}` } : {}}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: `${accent}18` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div>
        <div className="text-xs text-gray-500 font-medium mb-0.5">{label}</div>
        {loading
          ? <Skel h="h-7" w="w-14" />
          : <div className="text-2xl font-bold text-gray-800">{value}</div>
        }
      </div>
    </div>
  );
}

// ─── SVG Icons ───────────────────────────────────────────────────────────
function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-300">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-300 mx-auto">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 inline-block">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 inline-block">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.55 5.55l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl modal-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl md:rounded-t-3xl z-10">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">✕</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, confirmColor = '#dc2626' }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="flex justify-center mb-3"><WarningIcon /></div>
        <p className="text-gray-800 font-medium mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">रद्द गर्नुस्</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: confirmColor }}>ठीक छ</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 1: Overview
// ═══════════════════════════════════════════════════════════════════════════
function OverviewTab({ orders, loadingOrders }) {
  const [prices,        setPrices]        = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/prices/today/')
      .then(({ data }) => {
        const sorted = (data.results ?? []).sort(
          (a, b) => parseFloat(a.avg_price) - parseFloat(b.avg_price)
        );
        setPrices(sorted.slice(0, 5));
      })
      .finally(() => setLoadingPrices(false));
  }, []);

  const total     = orders.length;
  const pending   = orders.filter(o => o.status === 'PENDING').length;
  const accepted  = orders.filter(o => o.status === 'ACCEPTED').length;
  const completed = orders.filter(o => o.status === 'COMPLETED').length;

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<BagIcon />}         label={t('dash.total_orders')}    value={total}     loading={loadingOrders}  borderColor={ORANGE} />
        <StatCard icon={<ClockIcon />}       label={t('dash.pending_orders')}  value={pending}   loading={loadingOrders}  borderColor="#dc2626" accent="#d97706" />
        <StatCard icon={<CheckCircleIcon />} label={t('dash.accepted_orders')} value={accepted}  loading={loadingOrders}  borderColor="#16a34a" accent="#16a34a" />
        <StatCard icon={<StarIcon />}        label={t('dash.completed_orders')}value={completed} loading={loadingOrders}  borderColor="#2563eb" accent="#2563eb" />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{t('dash.recent_orders')}</h3>
        </div>
        {loadingOrders ? (
          <div className="p-4 flex flex-col gap-2">{[...Array(3)].map((_, i) => <Skel key={i} h="h-10" />)}</div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center">
            <div className="flex justify-center mb-2"><InboxIcon /></div>
            <p className="text-gray-400 text-sm">{t('dash.no_orders_buyer')}</p>
            <Link to="/listings" className="inline-block mt-2 text-sm font-medium underline" style={{ color: GREEN }}>
              {t('dash.view_listings')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2.5 font-medium">बाली</th>
                  <th className="px-4 py-2.5 font-medium">किसान</th>
                  <th className="px-4 py-2.5 font-medium">परिमाण</th>
                  <th className="px-4 py-2.5 font-medium">अवस्था</th>
                  <th className="px-4 py-2.5 font-medium">मिति</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => {
                  const s = STATUS_CFG[o.status] ?? STATUS_CFG.PENDING;
                  return (
                    <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {o.crop_emoji} {o.crop_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {o.farmer_name ?? '—'}
                        {o.farmer_district && <span className="text-gray-400 text-xs ml-1">({o.farmer_district})</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{parseFloat(o.quantity_kg).toFixed(0)} kg</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: s.bg, color: s.color }}>
                          {t(s.key)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString('ne-NP')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Today's cheapest prices */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{t('dash.cheapest')}</h3>
          <Link to="/prices" className="text-xs font-medium hover:underline" style={{ color: ORANGE }}>
            {t('dash.view_all_prices')}
          </Link>
        </div>
        {loadingPrices ? (
          <div className="p-4 flex flex-col gap-2">{[...Array(5)].map((_, i) => <Skel key={i} h="h-10" />)}</div>
        ) : prices.length === 0 ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-2"><InboxIcon /></div>
            <p className="text-gray-400 text-sm">{t('dash.no_prices')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {prices.map((p, i) => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <span className="text-lg font-bold text-gray-300 w-5 text-right flex-shrink-0">{i + 1}</span>
                <span className="text-xl">{p.crop_emoji ?? '🌿'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm truncate">{p.crop_name}</div>
                  <div className="text-xs text-gray-400">रु.{p.min_price}–{p.max_price}</div>
                </div>
                <div className="font-bold text-sm flex-shrink-0" style={{ color: GREEN }}>
                  रु.{parseFloat(p.avg_price).toFixed(0)}/kg
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 2: My Orders
// ═══════════════════════════════════════════════════════════════════════════
function MyOrdersTab({ orders, setOrders, loading }) {
  const [filter,  setFilter]  = useState('all');
  const [confirm, setConfirm] = useState(null);
  const { t } = useLanguage();

  const filterKeys = [
    { key: 'all',       labelKey: 'prices.all' },
    { key: 'PENDING',   labelKey: 'status.PENDING' },
    { key: 'ACCEPTED',  labelKey: 'status.ACCEPTED' },
    { key: 'REJECTED',  labelKey: 'status.REJECTED' },
    { key: 'COMPLETED', labelKey: 'status.COMPLETED' },
  ];

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const handleCancel = async (id) => {
    await api.delete(`/orders/${id}/`);
    setOrders(prev => prev.filter(o => o.id !== id));
    setConfirm(null);
  };

  return (
    <div>
      <h2 className="font-semibold text-gray-800 mb-4">{t('dash.my_orders')}</h2>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
        {filterKeys.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={filter === f.key
              ? { backgroundColor: GREEN, color: 'white' }
              : { backgroundColor: '#f3f4f6', color: '#6b7280' }
            }
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <Skel key={i} h="h-32" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
          <div className="flex justify-center mb-2"><InboxIcon /></div>
          <p className="text-gray-400 text-sm">{t('dash.no_category')}</p>
          {filter === 'all' && (
            <Link to="/listings" className="inline-block mt-3 text-sm font-medium underline" style={{ color: GREEN }}>
              {t('dash.find_listings')}
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(o => {
            const s = STATUS_CFG[o.status] ?? STATUS_CFG.PENDING;
            const totalValue = o.asking_price
              ? (parseFloat(o.quantity_kg) * parseFloat(o.asking_price)).toFixed(0)
              : null;
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-gray-800">
                      {o.crop_emoji} {o.crop_name ?? `अर्डर #${o.id}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {o.farmer_name ?? '—'}
                      {o.farmer_district && <span className="ml-1">· <LocationIcon /> {o.farmer_district}</span>}
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
                    style={{ backgroundColor: s.bg, color: s.color }}
                  >
                    {t(s.key)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span>{parseFloat(o.quantity_kg).toFixed(0)} kg</span>
                  {totalValue && (
                    <span className="font-medium" style={{ color: GREEN }}>≈ रु.{totalValue}</span>
                  )}
                  <span className="text-gray-400 text-xs ml-auto">
                    {new Date(o.created_at).toLocaleDateString('ne-NP')}
                  </span>
                </div>

                {o.message && (
                  <p className="text-xs text-gray-400 italic mb-2">"{o.message}"</p>
                )}

                {/* ACCEPTED — show contact info prominently */}
                {o.status === 'ACCEPTED' && o.farmer_phone && (
                  <div
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 mb-2"
                    style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                  >
                    <div>
                      <div className="text-xs text-green-600 font-medium mb-0.5">किसानले स्वीकार गर्नुभयो!</div>
                      <div className="text-sm font-bold text-green-800"><PhoneIcon /> {o.farmer_phone}</div>
                    </div>
                    <a
                      href={`tel:${o.farmer_phone}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold"
                      style={{ backgroundColor: GREEN }}
                    >
                      सम्पर्क
                    </a>
                  </div>
                )}

                {/* PENDING — cancel button */}
                {o.status === 'PENDING' && (
                  <button
                    onClick={() => setConfirm({ id: o.id })}
                    className="w-full mt-1 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors"
                  >
                    अर्डर रद्द गर्नुस्
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          message="के तपाईं यो अर्डर रद्द गर्न चाहनुहुन्छ?"
          onConfirm={() => handleCancel(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 3: Saved Listings
// ═══════════════════════════════════════════════════════════════════════════
function SavedTab({ onOrderClick }) {
  const [saved,   setSaved]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/listings/saved/')
      .then(({ data }) => setSaved(data.results ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (listingId) => {
    await api.delete(`/listings/${listingId}/unsave/`);
    setSaved(prev => prev.filter(s => s.listing.id !== listingId));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <Skel key={i} h="h-36" />)}
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-800 mb-4">सेभ गरिएका बालीहरू</h2>
      {saved.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <div className="flex justify-center mb-3"><StarIcon /></div>
          <p className="text-gray-600 font-medium mb-1">कुनै बाली सेभ गरिएको छैन</p>
          <p className="text-gray-400 text-sm mb-5">बाली हेर्दा बुकमार्क आइकन थिचेर सेभ गर्नुस्।</p>
          <Link
            to="/listings"
            className="inline-block px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: GREEN }}
          >
            बालीहरू हेर्नुस् →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {saved.map(({ id, listing }) => (
            <div key={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {listing.photo ? (
                <img src={listing.photo} alt={listing.crop?.name_nepali} className="w-full h-32 object-cover" />
              ) : (
                <div
                  className="w-full h-32 flex items-center justify-center text-5xl"
                  style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}
                >
                  {listing.crop?.emoji ?? '🌿'}
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-bold text-gray-800">{listing.crop?.name_nepali}</div>
                    <div className="text-xs text-gray-400"><LocationIcon /> {listing.district}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-base" style={{ color: GREEN }}>
                      रु.{parseFloat(listing.asking_price).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-400">प्रति kg</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {parseFloat(listing.quantity_kg).toFixed(0)} kg उपलब्ध
                  {listing.farmer_name && <span className="ml-2">· {listing.farmer_name}</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onOrderClick(listing)}
                    className="flex-1 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: ORANGE }}
                  >
                    अर्डर गर्नुस्
                  </button>
                  <button
                    onClick={() => handleUnsave(listing.id)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors"
                    title="सेभबाट हटाउनुस्"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 4: Profile
// ═══════════════════════════════════════════════════════════════════════════
function ProfileTab({ user: initialUser }) {
  const [localUser, setLocalUser] = useState(initialUser);
  const [editing,   setEditing]   = useState(false);
  const { t } = useLanguage();
  const [form, setForm] = useState({
    full_name:     initialUser.full_name     ?? '',
    phone:         initialUser.phone         ?? '',
    district:      initialUser.district      ?? '',
    municipality:  initialUser.municipality  ?? '',
    business_type: initialUser.business_type ?? '',
  });
  const [saving,        setSaving]        = useState(false);
  const [profileError,  setProfileError]  = useState('');
  const [profileOk,     setProfileOk]     = useState(false);

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError,  setPwError]  = useState('');
  const [pwOk,     setPwOk]     = useState(false);

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPw  = (k, v) => setPwForm(f => ({ ...f, [k]: v }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setProfileError(''); setProfileOk(false);
    try {
      const { data } = await api.patch('/auth/me/', form);
      setLocalUser(prev => ({ ...prev, ...data }));
      setProfileOk(true);
      setEditing(false);
    } catch (err) {
      const d = err.response?.data;
      setProfileError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'अपडेट गर्न सकिएन।');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSaving(true); setPwError(''); setPwOk(false);
    try {
      await api.post('/auth/change-password/', pwForm);
      setPwOk(true);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const d = err.response?.data;
      setPwError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'पासवर्ड परिवर्तन गर्न सकिएन।');
    } finally {
      setPwSaving(false);
    }
  };

  const displayName = localUser.full_name || localUser.username;

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(160deg, #f97316 0%, #fb923c 100%)' }}
          >
            <UserIcon />
          </div>
          <div>
            <div className="font-bold text-xl text-gray-800">{displayName}</div>
            <div className="text-sm text-gray-500">@{localUser.username}</div>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              {localUser.business_type && (
                <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">
                  {localUser.business_type}
                </span>
              )}
              {localUser.is_verified ? (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">{t('dash.verified')}</span>
              ) : (
                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">{t('dash.pending_verify')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: t('prof.phone'),    value: localUser.phone        ?? '—' },
            { label: t('prof.district'), value: localUser.district     ?? '—' },
            { label: t('prof.email'),    value: localUser.email        ?? '—' },
            { label: 'नगरपालिका',       value: localUser.municipality ?? '—' },
            { label: 'व्यापार प्रकार',  value: localUser.business_type ?? '—' },
            { label: 'सदस्य मिति',      value: localUser.date_joined ? new Date(localUser.date_joined).toLocaleDateString('ne-NP') : '—' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-gray-400 text-xs mb-0.5">{item.label}</div>
              <div className="font-medium text-gray-700 text-sm truncate">{item.value}</div>
            </div>
          ))}
        </div>

        {profileOk && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-sm mb-3">
            प्रोफाइल सफलतापूर्वक अपडेट भयो।
          </div>
        )}

        <button
          onClick={() => { setEditing(e => !e); setProfileError(''); setProfileOk(false); }}
          className="w-full py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
          style={editing
            ? { borderColor: '#d1d5db', color: '#6b7280' }
            : { borderColor: ORANGE, color: ORANGE }
          }
        >
          {editing ? t('dash.cancel') : t('dash.edit_profile')}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">प्रोफाइल अपडेट गर्नुस्</h3>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">पूरा नाम</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="पूरा नाम" className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">फोन नम्बर</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="९८xxxxxxxx" className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">जिल्ला</label>
              <select value={form.district} onChange={e => set('district', e.target.value)} className={INPUT}>
                <option value="">-- जिल्ला छान्नुस् --</option>
                {DISTRICTS_BY_PROVINCE.map(p => (
                  <optgroup key={p.province} label={p.province}>
                    {p.districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">नगरपालिका</label>
              <input value={form.municipality} onChange={e => set('municipality', e.target.value)} placeholder="नगरपालिका / गाउँपालिका" className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">व्यापार प्रकार</label>
              <input value={form.business_type} onChange={e => set('business_type', e.target.value)} placeholder="जस्तै: होलसेलर, रिटेलर, होटल..." className={INPUT} />
            </div>
            {profileError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-red-600 text-sm">{profileError}</div>}
            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ backgroundColor: ORANGE }}>
              {saving ? 'सुरक्षित गर्दैछ...' : 'सुरक्षित गर्नुस्'}
            </button>
          </form>
        </div>
      )}

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4">🔒 पासवर्ड परिवर्तन</h3>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          {[
            { key: 'current_password', label: 'पुरानो पासवर्ड', placeholder: '••••••••' },
            { key: 'new_password',     label: 'नयाँ पासवर्ड (कम्तीमा ८ वर्ण)',  placeholder: '••••••••' },
            { key: 'confirm_password', label: 'नयाँ पासवर्ड पुष्टि',             placeholder: '••••••••' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type="password"
                value={pwForm[key]}
                onChange={e => setPw(key, e.target.value)}
                placeholder={placeholder}
                required
                className={INPUT}
              />
            </div>
          ))}
          {pwError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-red-600 text-sm">{pwError}</div>}
          {pwOk    && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-sm">✓ पासवर्ड सफलतापूर्वक परिवर्तन भयो।</div>}
          <button type="submit" disabled={pwSaving} className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ backgroundColor: GREEN, color: 'white' }}>
            {pwSaving ? 'परिवर्तन गर्दैछ...' : 'पासवर्ड परिवर्तन गर्नुस्'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Order Modal (for Saved Tab — place order from saved listing)
// ═══════════════════════════════════════════════════════════════════════════
function QuickOrderModal({ listing, onClose, onOrdered }) {
  const [form, setForm] = useState({ listing: listing.id, quantity_kg: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/orders/', form);
      onOrdered(data);
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'अर्डर गर्न सकिएन।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="अर्डर गर्नुस्" onClose={onClose}>
      <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ backgroundColor: '#f0fdf4' }}>
        <span className="text-3xl">{listing.crop?.emoji ?? '🌿'}</span>
        <div>
          <div className="font-bold text-gray-800">{listing.crop?.name_nepali}</div>
          <div className="text-sm font-medium" style={{ color: GREEN }}>
            रु.{parseFloat(listing.asking_price).toFixed(0)}/kg
          </div>
          <div className="text-xs text-gray-500"><LocationIcon /> {listing.district} · {listing.farmer_name}</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">परिमाण (kg) *</label>
          <input
            required type="number" min="1"
            value={form.quantity_kg} onChange={e => set('quantity_kg', e.target.value)}
            placeholder="कति kg चाहिन्छ?" className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">सन्देश</label>
          <textarea
            value={form.message} onChange={e => set('message', e.target.value)}
            rows={3} placeholder="किसानलाई सन्देश..."
            className={INPUT + ' resize-none'}
          />
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm">{error}</div>}
        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ backgroundColor: ORANGE }}>
          {saving ? 'पठाउँदैछ...' : 'अर्डर पठाउनुस्'}
        </button>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Buyer Dashboard Page
// ═══════════════════════════════════════════════════════════════════════════
const BUYER_TABS = [
  { key: 'overview', labelKey: 'dash.tab_overview' },
  { key: 'orders',   labelKey: 'dash.tab_my_orders' },
  { key: 'saved',    labelKey: 'dash.tab_saved' },
  { key: 'profile',  labelKey: 'dash.tab_profile' },
];

export default function BuyerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tab,    setTab]    = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderListing, setOrderListing] = useState(null); // for quick order modal

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'BUYER') return;

    api.get('/orders/my/')
      .then(({ data }) => setOrders(data.results ?? []))
      .finally(() => setLoadingOrders(false));
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  if (user.role !== 'BUYER') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="flex justify-center mb-1"><WarningIcon /></div>
        <h2 className="text-xl font-bold text-gray-800">{t('dash.access_denied')}</h2>
        <p className="text-sm text-gray-500 max-w-xs">{t('dash.buyer_only')}</p>
        <button onClick={() => navigate('/')} className="mt-2 text-sm font-medium underline" style={{ color: GREEN }}>
          {t('dash.go_home')}
        </button>
      </div>
    );
  }

  const displayName = user.full_name || user.username;

  return (
    <div className="pb-24 md:pb-10">
      {/* Header */}
      <div
        className="text-white"
        style={{ background: 'linear-gradient(160deg, #c2410c 0%, #f97316 100%)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-6 pb-5">
          <h1 className="text-xl font-bold">{t('dash.buyer_title')}</h1>
          <p className="text-orange-100 text-sm mt-0.5">
            {t('dash.hello')}, {displayName}
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-gray-200 bg-white sticky top-0 self-start h-screen overflow-y-auto">
          <nav className="py-5 flex flex-col gap-1 px-3">
            {BUYER_TABS.map(tabItem => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left w-full"
                style={tab === tabItem.key
                  ? { backgroundColor: '#fff7ed', color: ORANGE, fontWeight: 700, borderLeft: `3px solid ${ORANGE}` }
                  : { color: '#6b7280', fontWeight: 500 }
                }
              >
                {t(tabItem.labelKey)}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Mobile tab bar */}
          <div className="md:hidden border-b border-gray-200 bg-white overflow-x-auto scrollbar-hide sticky top-0 z-30">
            <div className="flex px-2 py-1 gap-1 min-w-max">
              {BUYER_TABS.map(tabItem => (
                <button
                  key={tabItem.key}
                  onClick={() => setTab(tabItem.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
                  style={tab === tabItem.key
                    ? { backgroundColor: '#fff7ed', color: ORANGE, fontWeight: 700 }
                    : { color: '#9ca3af' }
                  }
                >
                  {t(tabItem.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-6">
            {tab === 'overview' && (
              <OverviewTab orders={orders} loadingOrders={loadingOrders} />
            )}
            {tab === 'orders' && (
              <MyOrdersTab orders={orders} setOrders={setOrders} loading={loadingOrders} />
            )}
            {tab === 'saved' && (
              <SavedTab onOrderClick={listing => setOrderListing(listing)} />
            )}
            {tab === 'profile' && (
              <ProfileTab user={user} />
            )}
          </div>
        </main>
      </div>

      {orderListing && (
        <QuickOrderModal
          listing={orderListing}
          onClose={() => setOrderListing(null)}
          onOrdered={newOrder => {
            setOrders(prev => [newOrder, ...prev]);
            setOrderListing(null);
          }}
        />
      )}
    </div>
  );
}
