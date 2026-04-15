import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// ─── SVG Icons ────────────────────────────────────────────────────────────
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
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
function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-300">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  );
}
function SproutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-300">
      <path d="M7 20h10M10 20c5.5-2.5.8-6.4 3-10"/>
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>
      <path d="M14.1 6a7 7 0 0 1 5.1 8c-1.6.1-3.2-.4-4.4-1.4S12.7 10 13 7.8a5.7 5.7 0 0 1 1.1-1.8z"/>
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
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
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
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
function ConfirmDialog({ message, onConfirm, onCancel, confirmColor = GREEN }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="mb-3 flex justify-center"><WarningIcon /></div>
        <p className="text-gray-800 font-medium mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            रद्द गर्नुस्
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: confirmColor }}
          >
            ठीक छ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Listing Form Modal ───────────────────────────────────────────────────
function ListingModal({ listing, crops, onClose, onSaved }) {
  const [form, setForm] = useState({
    crop_id:      listing?.crop?.id  ?? listing?.crop ?? '',
    quantity_kg:  listing?.quantity_kg  ?? '',
    asking_price: listing?.asking_price ?? '',
    district:     listing?.district     ?? '',
    description:  listing?.description  ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      let data;
      if (listing) {
        ({ data } = await api.put(`/listings/${listing.id}/`, form));
      } else {
        ({ data } = await api.post('/listings/', form));
      }
      onSaved(data, !!listing);
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'बाली सुरक्षित गर्न सकिएन।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={listing ? 'बाली सम्पादन' : 'नयाँ बाली थप्नुस्'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">बाली *</label>
          <select required value={form.crop_id} onChange={e => set('crop_id', e.target.value)} className={INPUT}>
            <option value="">-- बाली छान्नुस् --</option>
            {crops.map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name_nepali} ({c.name_english})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">परिमाण (kg) *</label>
            <input
              required type="number" min="1"
              value={form.quantity_kg} onChange={e => set('quantity_kg', e.target.value)}
              placeholder="जस्तै: 100" className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">मूल्य (रु./kg) *</label>
            <input
              required type="number" min="1"
              value={form.asking_price} onChange={e => set('asking_price', e.target.value)}
              placeholder="जस्तै: 45" className={INPUT}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">जिल्ला *</label>
          <select required value={form.district} onChange={e => set('district', e.target.value)} className={INPUT}>
            <option value="">-- जिल्ला छान्नुस् --</option>
            {DISTRICTS_BY_PROVINCE.map(p => (
              <optgroup key={p.province} label={p.province}>
                {p.districts.map(d => <option key={d} value={d}>{d}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">विवरण</label>
          <textarea
            value={form.description} onChange={e => set('description', e.target.value)}
            rows={3} placeholder="बालीको बारेमा थप जानकारी..."
            className={INPUT + ' resize-none'}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit" disabled={saving}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: GREEN }}
        >
          {saving ? 'सुरक्षित गर्दैछ...' : listing ? 'अपडेट गर्नुस्' : 'बाली थप्नुस्'}
        </button>
      </form>
    </Modal>
  );
}

// ─── Alert Form Modal ─────────────────────────────────────────────────────
function AlertModal({ crops, onClose, onSaved }) {
  const [form, setForm] = useState({
    crop: '', threshold_price: '', condition: 'BELOW', via_sms: true, via_email: false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/alerts/', form);
      onSaved(data);
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'अलर्ट थप्न सकिएन।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="नयाँ मूल्य अलर्ट" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">बाली *</label>
          <select required value={form.crop} onChange={e => set('crop', e.target.value)} className={INPUT}>
            <option value="">-- बाली छान्नुस् --</option>
            {crops.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name_nepali}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">थ्रेसहोल्ड मूल्य (रु.) *</label>
          <input
            required type="number" min="1"
            value={form.threshold_price} onChange={e => set('threshold_price', e.target.value)}
            placeholder="जस्तै: 50" className={INPUT}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">अवस्था</label>
          <div className="flex gap-2">
            {[['BELOW', '▼ मूल्य घट्दा'], ['ABOVE', '▲ मूल्य बढ्दा']].map(([val, label]) => (
              <button
                type="button" key={val}
                onClick={() => set('condition', val)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                style={form.condition === val
                  ? { backgroundColor: ORANGE, color: 'white', borderColor: ORANGE }
                  : { backgroundColor: 'white', color: '#374151', borderColor: '#d1d5db' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {[['via_sms', 'SMS'], ['via_email', 'Email']].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={e => set(key, e.target.checked)}
                className="w-4 h-4 accent-orange-500"
              />
              {label}
            </label>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit" disabled={saving}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: ORANGE }}
        >
          {saving ? 'थप्दैछ...' : '+ अलर्ट थप्नुस्'}
        </button>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 1: Overview
// ═══════════════════════════════════════════════════════════════════════════
function OverviewTab({ listings, orders, loadingListings, loadingOrders }) {
  const [prices, setPrices]           = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/prices/today/')
      .then(({ data }) => setPrices(data.results || []))
      .finally(() => setLoadingPrices(false));
  }, []);

  const totalListings  = listings.length;
  const activeListings = listings.filter(l => l.is_available).length;
  const totalOrders    = orders.length;
  const pendingOrders  = orders.filter(o => o.status === 'PENDING').length;

  // Match today's prices to farmer's crops
  const farmerCropIds  = [...new Set(listings.map(l => l.crop?.id ?? l.crop))];
  const relevantPrices = prices.filter(p => farmerCropIds.includes(p.crop));

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<GridIcon />}        label={t('dash.total_listings')}  value={totalListings}  loading={loadingListings}  borderColor={GREEN} />
        <StatCard icon={<CheckCircleIcon />} label={t('dash.active_listings')} value={activeListings} loading={loadingListings}  borderColor="#16a34a" />
        <StatCard icon={<BagIcon />}         label={t('dash.total_orders')}    value={totalOrders}    loading={loadingOrders}    borderColor={ORANGE} />
        <StatCard icon={<ClockIcon />}       label={t('dash.pending_orders')}  value={pendingOrders}  loading={loadingOrders}    borderColor="#dc2626" />
      </div>

      {/* Recent orders table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{t('dash.recent_orders')}</h3>
        </div>
        {loadingOrders ? (
          <div className="p-4 flex flex-col gap-2">
            {[...Array(3)].map((_, i) => <Skel key={i} h="h-10" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center">
            <div className="flex justify-center mb-2"><InboxIcon /></div>
            <p className="text-gray-400 text-sm">{t('dash.no_orders')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2.5 font-medium">खरिदकर्ता</th>
                  <th className="px-4 py-2.5 font-medium">बाली</th>
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
                      <td className="px-4 py-3 font-medium text-gray-700">{o.buyer_name ?? `#${o.id}`}</td>
                      <td className="px-4 py-3 text-gray-600">{o.crop_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{parseFloat(o.quantity_kg).toFixed(0)} kg</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          {t(s.key)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(o.created_at).toLocaleDateString('ne-NP')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Today's prices for my crops */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{t('dash.today_prices')}</h3>
        </div>
        {loadingPrices ? (
          <div className="p-4 flex flex-col gap-2">
            {[...Array(3)].map((_, i) => <Skel key={i} h="h-12" />)}
          </div>
        ) : farmerCropIds.length === 0 ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-2"><SproutIcon /></div>
            <p className="text-gray-400 text-sm">{t('dash.add_crop_first')}</p>
          </div>
        ) : relevantPrices.length === 0 ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-2"><InboxIcon /></div>
            <p className="text-gray-400 text-sm">{t('dash.no_prices')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {relevantPrices.map(p => {
              const myListing   = listings.find(l => (l.crop?.id ?? l.crop) === p.crop);
              const myPrice     = myListing ? parseFloat(myListing.asking_price) : null;
              const marketAvg   = parseFloat(p.avg_price);
              const diff        = myPrice !== null ? myPrice - marketAvg : null;
              return (
                <div key={p.id} className="px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{p.crop_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      बजार: रु.{p.min_price}–{p.max_price}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm" style={{ color: GREEN }}>
                      रु.{marketAvg.toFixed(0)}/kg
                    </div>
                    {diff !== null && (
                      <div
                        className="text-xs font-medium mt-0.5"
                        style={{ color: diff > 0 ? ORANGE : '#16a34a' }}
                      >
                        तपाईं: रु.{myPrice}{diff > 0 ? ` (+${diff.toFixed(0)} माथि)` : ` (${diff.toFixed(0)} तल)`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 2: My Listings
// ═══════════════════════════════════════════════════════════════════════════
function ListingsTab({ listings, setListings, loading, crops }) {
  const [showModal,   setShowModal]   = useState(false);
  const [editListing, setEditListing] = useState(null);
  const [confirm,     setConfirm]     = useState(null);
  const { t } = useLanguage();

  const openAdd  = ()  => { setEditListing(null); setShowModal(true); };
  const openEdit = (l) => { setEditListing(l);    setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditListing(null); };

  const handleSaved = (data, isEdit) => {
    setListings(prev =>
      isEdit ? prev.map(l => l.id === data.id ? data : l) : [data, ...prev]
    );
  };

  const handleToggle = async (listing) => {
    try {
      const { data } = await api.patch(`/listings/${listing.id}/`, {
        is_available: !listing.is_available,
      });
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_available: data.is_available } : l));
    } catch {
      // swallow — backend may require full PUT; silent fail
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/listings/${id}/`);
    setListings(prev => prev.filter(l => l.id !== id));
    setConfirm(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">{t('dash.my_listings')}</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: GREEN }}
        >
          {t('dash.add_listing')}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skel key={i} h="h-28" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <div className="flex justify-center mb-3"><SproutIcon /></div>
          <p className="text-gray-600 font-medium mb-1">{t('dash.no_listings')}</p>
          <p className="text-gray-400 text-sm mb-5">{t('dash.no_listings_msg')}</p>
          <button
            onClick={openAdd}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: GREEN }}
          >
            {t('dash.add_listing')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {listings.map(l => (
            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{l.crop?.emoji ?? '🌿'}</span>
                  <div>
                    <div className="font-bold text-gray-800">{l.crop?.name_nepali ?? l.crop}</div>
                    <div className="text-xs text-gray-500 mt-0.5"><LocationIcon /> {l.district}</div>
                  </div>
                </div>

                {/* Active toggle */}
                <button
                  onClick={() => handleToggle(l)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                  style={{ backgroundColor: l.is_available ? GREEN : '#d1d5db' }}
                  title={l.is_available ? 'सक्रिय — निष्क्रिय गर्न थिच्नुस्' : 'निष्क्रिय — सक्रिय गर्न थिच्नुस्'}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: l.is_available ? 'translateX(22px)' : 'translateX(4px)' }}
                  />
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm mb-2">
                <span className="text-gray-600">{parseFloat(l.quantity_kg).toFixed(0)} kg</span>
                <span className="font-bold" style={{ color: GREEN }}>
                  रु.{parseFloat(l.asking_price).toFixed(0)}/kg
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
                  style={l.is_available
                    ? { backgroundColor: '#dcfce7', color: '#16a34a' }
                    : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                  }
                >
                  {l.is_available ? t('dash.active') : t('dash.inactive')}
                </span>
              </div>

              {l.description && (
                <p className="text-xs text-gray-400 line-clamp-2 mb-2">{l.description}</p>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => openEdit(l)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <PencilIcon /> {t('dash.edit')}
                </button>
                <button
                  onClick={() => setConfirm({ id: l.id })}
                  className="flex-1 py-2 rounded-xl border border-red-100 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <TrashIcon /> {t('dash.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ListingModal
          listing={editListing}
          crops={crops}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {confirm && (
        <ConfirmDialog
          message={t('dash.delete_confirm')}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
          confirmColor="#dc2626"
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 3: Orders
// ═══════════════════════════════════════════════════════════════════════════
function OrdersTab({ orders, setOrders, loading }) {
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

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const handleStatus = async (id, newStatus) => {
    await api.patch(`/orders/${id}/status/`, { status: newStatus });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    setConfirm(null);
  };

  return (
    <div>
      <h2 className="font-semibold text-gray-800 mb-4">{t('dash.orders_title')}</h2>

      {/* Filter chips */}
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
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <Skel key={i} h="h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
          <div className="flex justify-center mb-2"><InboxIcon /></div>
          <p className="text-gray-400 text-sm">{t('dash.no_category')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(o => {
            const s = STATUS_CFG[o.status] ?? STATUS_CFG.PENDING;
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{o.crop_name ?? `#${o.id}`}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {o.buyer_name ?? '—'}
                      {o.buyer_phone && <span className="ml-2"><PhoneIcon /> {o.buyer_phone}</span>}
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
                    style={{ backgroundColor: s.bg, color: s.color }}
                  >
                    {t(s.key)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                  <span>{parseFloat(o.quantity_kg).toFixed(0)} kg</span>
                  <span className="text-gray-400 text-xs ml-auto">
                    {new Date(o.created_at).toLocaleDateString('ne-NP')}
                  </span>
                </div>

                {o.message && (
                  <p className="text-xs text-gray-400 italic mt-1 mb-2">"{o.message}"</p>
                )}

                {o.status === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setConfirm({ id: o.id, newStatus: 'ACCEPTED', msg: t('dash.accept') + '?' })}
                      className="flex-1 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#16a34a' }}
                    >
                      {t('dash.accept')}
                    </button>
                    <button
                      onClick={() => setConfirm({ id: o.id, newStatus: 'REJECTED', msg: t('dash.reject') + '?', confirmColor: '#dc2626' })}
                      className="flex-1 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      {t('dash.reject')}
                    </button>
                  </div>
                )}

                {o.status === 'ACCEPTED' && (
                  <button
                    onClick={() => setConfirm({ id: o.id, newStatus: 'COMPLETED', msg: t('dash.mark_complete') + '?', confirmColor: '#2563eb' })}
                    className="w-full mt-3 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#2563eb' }}
                  >
                    {t('dash.mark_complete')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={() => handleStatus(confirm.id, confirm.newStatus)}
          onCancel={() => setConfirm(null)}
          confirmColor={confirm.confirmColor ?? GREEN}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 4: Price Alerts
// ═══════════════════════════════════════════════════════════════════════════
function AlertsTab({ crops }) {
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/alerts/my/')
      .then(({ data }) => setAlerts(data.results ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/alerts/${id}/`);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">{t('dash.alerts_title')}</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: ORANGE }}
        >
          {t('dash.add_alert')}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => <Skel key={i} h="h-16" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <div className="flex justify-center mb-3"><BellIcon /></div>
          <p className="text-gray-600 font-medium mb-1">{t('dash.no_alerts')}</p>
          <p className="text-gray-400 text-sm mb-5">{t('dash.no_alerts_msg')}</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: ORANGE }}
          >
            {t('dash.add_alert')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{a.crop_detail?.emoji ?? '🌿'}</div>
                <div>
                  <div className="font-medium text-gray-800 text-sm">
                    {a.crop_detail?.name_nepali ?? a.crop}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span style={{ color: a.condition === 'ABOVE' ? ORANGE : '#2563eb', fontWeight: 600 }}>
                      {a.condition === 'ABOVE' ? '▲' : '▼'} रु.{a.threshold_price}
                    </span>
                    {a.via_sms   && <span>SMS</span>}
                    {a.via_email && <span>Email</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-red-400 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AlertModal
          crops={crops}
          onClose={() => setShowModal(false)}
          onSaved={data => setAlerts(prev => [data, ...prev])}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 5: Profile
// ═══════════════════════════════════════════════════════════════════════════
function ProfileTab({ user: initialUser }) {
  const [localUser, setLocalUser] = useState(initialUser);
  const [editing,   setEditing]   = useState(false);
  const { t } = useLanguage();
  const [form, setForm] = useState({
    first_name: initialUser.first_name  ?? '',
    last_name:  initialUser.last_name   ?? '',
    phone:      initialUser.phone       ?? '',
    district:   initialUser.district    ?? '',
    address:    initialUser.address     ?? '',
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const { data } = await api.patch('/auth/me/', form);
      setLocalUser(prev => ({ ...prev, ...data }));
      setSuccess(true);
      setEditing(false);
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'अपडेट गर्न सकिएन।');
    } finally {
      setSaving(false);
    }
  };

  const displayName = [localUser.first_name, localUser.last_name].filter(Boolean).join(' ') || localUser.username;

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-xl text-gray-800">{displayName}</div>
            <div className="text-sm text-gray-500">@{localUser.username}</div>
            <div className="mt-1.5">
              {localUser.is_verified ? (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                  {t('dash.verified')}
                </span>
              ) : (
                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">
                  {t('dash.pending_verify')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: t('prof.phone'),    value: localUser.phone    ?? '—' },
            { label: t('prof.district'), value: localUser.district ?? '—' },
            { label: t('prof.email'),    value: localUser.email    ?? '—' },
            { label: 'ठेगाना',          value: localUser.address  ?? '—' },
            { label: 'भूमि क्षेत्रफल', value: localUser.farm_size_ropani ? `${localUser.farm_size_ropani} रोपनी` : '—' },
            { label: 'सदस्य मिति',      value: localUser.date_joined ? new Date(localUser.date_joined).toLocaleDateString('ne-NP') : '—' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-gray-400 text-xs mb-0.5">{item.label}</div>
              <div className="font-medium text-gray-700 text-sm truncate">{item.value}</div>
            </div>
          ))}
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-sm mb-3">
            प्रोफाइल सफलतापूर्वक अपडेट भयो।
          </div>
        )}

        <button
          onClick={() => { setEditing(e => !e); setError(''); setSuccess(false); }}
          className="w-full py-2.5 rounded-xl border-2 text-sm font-medium transition-colors"
          style={editing
            ? { borderColor: '#d1d5db', color: '#6b7280' }
            : { borderColor: GREEN, color: GREEN }
          }
        >
          {editing ? t('dash.cancel') : t('dash.edit_profile')}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">प्रोफाइल अपडेट गर्नुस्</h3>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">पहिलो नाम</label>
                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="पहिलो नाम" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">थर</label>
                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="थर" className={INPUT} />
              </div>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">ठेगाना</label>
              <textarea
                value={form.address} onChange={e => set('address', e.target.value)}
                rows={2} placeholder="गाउँ, टोल..."
                className={INPUT + ' resize-none'}
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-red-600 text-sm">{error}</div>
            )}
            <button
              type="submit" disabled={saving}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: GREEN }}
            >
              {saving ? 'सुरक्षित गर्दैछ...' : 'सुरक्षित गर्नुस्'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Page
// ═══════════════════════════════════════════════════════════════════════════
const FARMER_TABS = [
  { key: 'overview', labelKey: 'dash.tab_overview' },
  { key: 'listings', labelKey: 'dash.tab_listings' },
  { key: 'orders',   labelKey: 'dash.tab_orders' },
  { key: 'alerts',   labelKey: 'dash.tab_alerts' },
  { key: 'profile',  labelKey: 'dash.tab_profile' },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tab,      setTab]      = useState('overview');
  const [crops,    setCrops]    = useState([]);
  const [listings, setListings] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingOrders,   setLoadingOrders]   = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'FARMER') return;

    api.get('/crops/').then(({ data }) => setCrops(data.results ?? []));
    api.get('/listings/my/')
      .then(({ data }) => setListings(data.results ?? []))
      .finally(() => setLoadingListings(false));
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

  if (user.role !== 'FARMER') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="flex justify-center mb-1"><WarningIcon /></div>
        <h2 className="text-xl font-bold text-gray-800">{t('dash.access_denied')}</h2>
        <p className="text-sm text-gray-500 max-w-xs">{t('dash.farmer_only')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 text-sm font-medium underline"
          style={{ color: GREEN }}
        >
          {t('dash.go_home')}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-10">
      {/* Header banner */}
      <div
        className="text-white"
        style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-6 pb-5">
          <h1 className="text-xl font-bold">{t('dash.farmer_title')}</h1>
          <p className="text-green-200 text-sm mt-0.5">
            {t('dash.hello')}, {user.first_name || user.username}
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto flex">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-gray-200 bg-white sticky top-0 self-start h-screen overflow-y-auto">
          <nav className="py-5 flex flex-col gap-1 px-3">
            {FARMER_TABS.map(tabItem => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left w-full"
                style={tab === tabItem.key
                  ? { backgroundColor: '#f0fdf4', color: GREEN, fontWeight: 700, borderLeft: `3px solid ${GREEN}` }
                  : { color: '#6b7280', fontWeight: 500 }
                }
              >
                {t(tabItem.labelKey)}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main area ── */}
        <main className="flex-1 min-w-0">
          {/* Mobile tab bar */}
          <div className="md:hidden border-b border-gray-200 bg-white overflow-x-auto scrollbar-hide sticky top-0 z-30">
            <div className="flex px-2 py-1 gap-1 min-w-max">
              {FARMER_TABS.map(tabItem => (
                <button
                  key={tabItem.key}
                  onClick={() => setTab(tabItem.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
                  style={tab === tabItem.key
                    ? { backgroundColor: '#f0fdf4', color: GREEN, fontWeight: 700 }
                    : { color: '#9ca3af' }
                  }
                >
                  {t(tabItem.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-4 md:p-6">
            {tab === 'overview' && (
              <OverviewTab
                listings={listings}
                orders={orders}
                loadingListings={loadingListings}
                loadingOrders={loadingOrders}
              />
            )}
            {tab === 'listings' && (
              <ListingsTab
                listings={listings}
                setListings={setListings}
                loading={loadingListings}
                crops={crops}
              />
            )}
            {tab === 'orders' && (
              <OrdersTab
                orders={orders}
                setOrders={setOrders}
                loading={loadingOrders}
              />
            )}
            {tab === 'alerts' && (
              <AlertsTab crops={crops} />
            )}
            {tab === 'profile' && (
              <ProfileTab user={user} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
