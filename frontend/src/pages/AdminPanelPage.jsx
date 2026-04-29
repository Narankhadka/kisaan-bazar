import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const GREEN  = '#1a6b2e';
const ORANGE = '#f97316';
const RED    = '#dc2626';
const BLUE   = '#2563eb';
const PURPLE = '#7c3aed';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function GridIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function UsersIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function SproutIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M7 20h10"/><path d="M10 20c5.5-2.5 8-6 4-12H9c-4 6-1.5 9.5 4 12z"/><path d="M10.74 7C14 5 18.5 4 21 8c-3 0-6 .5-9 2.5"/></svg>; }
function BagIcon()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>; }
function ChartIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function ServerIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>; }
function CheckIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>; }
function TrashIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function PlayIcon()    { return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function SpinIcon()    { return <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>; }
function PlusIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function ClockIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function VerifiedIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div
        className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
        style={{ backgroundColor: `${accent}18` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ value }) {
  const CFG = {
    PENDING:   { bg: '#fef3c7', color: '#92400e' },
    ACCEPTED:  { bg: '#d1fae5', color: '#065f46' },
    REJECTED:  { bg: '#fee2e2', color: '#991b1b' },
    COMPLETED: { bg: '#dbeafe', color: '#1e40af' },
    SUCCESS:   { bg: '#d1fae5', color: '#065f46' },
    RUNNING:   { bg: '#dbeafe', color: '#1e40af' },
    ERROR:     { bg: '#fee2e2', color: '#991b1b' },
    MANUAL:    { bg: '#ede9fe', color: '#5b21b6' },
    KALIMATI:  { bg: '#d1fae5', color: '#065f46' },
  };
  const s = CFG[value] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
      {value}
    </span>
  );
}

// ── Table shell ───────────────────────────────────────────────────────────────

function Table({ headers, children, empty }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && (
        <div className="py-12 text-center text-gray-400 text-sm">{empty}</div>
      )}
    </div>
  );
}

// ── Pagination bar ────────────────────────────────────────────────────────────

function Pager({ next, onLoadMore, loading }) {
  if (!next) return null;
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
      >
        {loading && <SpinIcon />}
        Load More
      </button>
    </div>
  );
}

// ── Sidebar tabs ──────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',  labelKey: 'admin.tab_overview',  icon: <GridIcon /> },
  { key: 'users',     labelKey: 'admin.tab_users',     icon: <UsersIcon /> },
  { key: 'listings',  labelKey: 'admin.tab_listings',  icon: <SproutIcon /> },
  { key: 'orders',    labelKey: 'admin.tab_orders',    icon: <BagIcon /> },
  { key: 'prices',    labelKey: 'admin.tab_prices',    icon: <ChartIcon /> },
  { key: 'scraper',   labelKey: 'admin.tab_scraper',   icon: <ServerIcon /> },
];

// ── OverviewTab ───────────────────────────────────────────────────────────────

function OverviewTab({ t }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/admin/stats/', { signal: controller.signal })
      .then(r => setStats(r.data)).catch(() => {});
    return () => controller.abort();
  }, []);

  const cards = stats ? [
    { label: t('admin.total_users'),         value: stats.total_users,          accent: BLUE,   icon: <UsersIcon /> },
    { label: t('admin.total_farmers'),       value: stats.total_farmers,        accent: GREEN,  icon: <SproutIcon /> },
    { label: t('admin.total_buyers'),        value: stats.total_buyers,         accent: ORANGE, icon: <UsersIcon /> },
    { label: t('admin.total_listings'),      value: stats.total_listings,       accent: GREEN,  icon: <SproutIcon /> },
    { label: t('admin.total_orders'),        value: stats.total_orders,         accent: PURPLE, icon: <BagIcon /> },
    { label: t('admin.pending_orders'),      value: stats.pending_orders,       accent: ORANGE, icon: <BagIcon /> },
    { label: t('admin.today_prices'),        value: stats.today_prices,         accent: BLUE,   icon: <ChartIcon /> },
    { label: t('admin.pending_verification'),value: stats.pending_verifications, accent: RED,    icon: <UsersIcon /> },
  ] : [];

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-5">{t('admin.tab_overview')}</h2>
      {!stats ? (
        <div className="flex justify-center py-16"><SpinIcon /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map(c => (
            <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} accent={c.accent} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ID Verification Modal ─────────────────────────────────────────────────────

function IDModal({ user, onClose, onVerify, onReject }) {
  const { t } = useLanguage();
  if (!user) return null;
  const BASE = 'http://localhost:8000';
  const imgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE}/${path.replace(/^\//, '')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{t('admin.id_review_title')}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">{t('admin.full_name')}:</span> <span className="font-medium">{user.full_name || '—'}</span></div>
            <div><span className="text-gray-500">{t('admin.username')}:</span> <span className="font-medium">{user.username}</span></div>
            <div><span className="text-gray-500">{t('admin.phone')}:</span> <span className="font-medium">{user.phone || '—'}</span></div>
            <div><span className="text-gray-500">{t('admin.district')}:</span> <span className="font-medium">{user.district || '—'}</span></div>
            <div><span className="text-gray-500">{t('admin.id_type_label')}:</span> <span className="font-medium">{user.id_type || '—'}</span></div>
            <div><span className="text-gray-500">{t('admin.id_number_label')}:</span> <span className="font-medium">{user.id_number || '—'}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[[t('admin.id_front_label'), user.id_front_photo], [t('admin.id_back_label'), user.id_back_photo]].map(([label, path]) => (
              <div key={label}>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                {imgUrl(path)
                  ? <a href={imgUrl(path)} target="_blank" rel="noreferrer">
                      <img src={imgUrl(path)} alt={label} className="rounded-xl border border-gray-200 w-full object-cover max-h-40 hover:opacity-90 transition-opacity" onError={e => { e.target.src = '/placeholder.png'; }} />
                    </a>
                  : <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 h-28 flex items-center justify-center text-xs text-gray-400">{t('admin.no_photo')}</div>
                }
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-500">{t('admin.current_status')}:</span>
            {user.is_id_verified
              ? <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{t('admin.verified')}</span>
              : <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{t('admin.pending_badge')}</span>}
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onVerify(user)}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: GREEN }}
          >
            {t('admin.verify')}
          </button>
          <button
            type="button"
            onClick={() => onReject(user)}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: RED }}
          >
            {t('admin.reject_btn')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t('admin.close_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── UsersTab ──────────────────────────────────────────────────────────────────

function UsersTab({ t, pendingCount }) {
  const [users,      setUsers]      = useState([]);
  const [search,     setSearch]     = useState('');
  const [role,       setRole]       = useState('');
  const [pending,    setPending]    = useState(false);
  const [nextUrl,    setNextUrl]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [idModal,    setIdModal]    = useState(null);   // user object or null
  const [toast,      setToast]      = useState('');     // success message

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchUsers = useCallback(async (reset = true) => {
    setLoading(true);
    try {
      const params = {};
      if (search)  params.search  = search;
      if (role)    params.role    = role;
      if (pending) params.pending_verification = 'true';
      const r = await api.get('/admin/users/', { params });
      setUsers(reset ? r.data.results : prev => [...prev, ...r.data.results]);
      setNextUrl(r.data.next);
    } catch {}
    setLoading(false);
  }, [search, role, pending]);

  useEffect(() => { fetchUsers(true); }, [fetchUsers]);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoading(true);
    try {
      const r = await api.get(nextUrl);
      setUsers(prev => [...prev, ...r.data.results]);
      setNextUrl(r.data.next);
    } catch {}
    setLoading(false);
  };

  const verifyUser = async (user) => {
    try {
      const r = await api.patch(`/admin/users/${user.id}/verify/`, { action: 'verify' });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_id_verified: r.data.is_id_verified } : u));
      setIdModal(null);
      showToast(t('admin.verified_toast').replace('{name}', user.username));
    } catch {}
  };

  const rejectUser = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/verify/`, { is_id_verified: false });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_id_verified: false } : u));
      setIdModal(null);
      showToast(t('admin.rejected_toast').replace('{name}', user.username));
    } catch {}
  };

  const ROLE_LABEL = { FARMER: t('admin.farmer'), BUYER: t('admin.buyer'), ADMIN: t('admin.admin') };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-pulse">
          {toast}
        </div>
      )}

      {/* ID Modal */}
      <IDModal
        user={idModal}
        onClose={() => setIdModal(null)}
        onVerify={verifyUser}
        onReject={rejectUser}
      />

      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.tab_users')}</h2>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('admin.search_users')}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 w-56"
        />
        <select
          value={role} onChange={e => { setRole(e.target.value); setPending(false); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
        >
          <option value="">{t('admin.all_roles')}</option>
          <option value="FARMER">{t('admin.farmer')}</option>
          <option value="BUYER">{t('admin.buyer')}</option>
          <option value="ADMIN">{t('admin.admin')}</option>
        </select>
        <button
          type="button"
          onClick={() => { setPending(v => !v); setRole(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
          style={pending
            ? { backgroundColor: '#fff7ed', borderColor: ORANGE, color: ORANGE }
            : { backgroundColor: 'white', borderColor: '#d1d5db', color: '#6b7280' }}
        >
          {t('admin.pending_verification')}
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: RED }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      <Table
        headers={[
          t('admin.phone'), t('admin.full_name'), t('admin.role'),
          `${t('admin.district')}/${t('admin.municipality')}`,
          t('admin.email'), t('admin.phone_verified'), t('admin.id_verified'),
          t('admin.joined'), '',
        ]}
        empty={users.length === 0 && !loading ? t('admin.no_data') : null}
      >
        {users.map(u => (
          <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{u.phone || u.username}</td>
            <td className="px-4 py-3 text-gray-700">{u.full_name || '—'}</td>
            <td className="px-4 py-3"><StatusBadge value={ROLE_LABEL[u.role] || u.role} /></td>
            <td className="px-4 py-3 text-gray-600 text-xs">
              {u.district || '—'}
              {u.municipality && <span className="text-gray-400">, {u.municipality}</span>}
            </td>
            <td className="px-4 py-3 text-gray-500 text-xs">{u.email || '—'}</td>
            <td className="px-4 py-3 text-center">
              {u.is_phone_verified
                ? <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium"><VerifiedIcon />Verified</span>
                : <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium"><ClockIcon />Pending</span>}
            </td>
            <td className="px-4 py-3">
              {u.role === 'FARMER'
                ? u.is_id_verified
                  ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><VerifiedIcon />Verified</span>
                  : <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium"><ClockIcon />Pending</span>
                : <span className="text-gray-300 text-xs">—</span>}
            </td>
            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
              {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}
            </td>
            <td className="px-4 py-3">
              {u.role === 'FARMER' && (
                <button
                  type="button"
                  onClick={() => setIdModal(u)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap"
                  style={{ borderColor: BLUE, color: BLUE }}
                >
                  ID {t('admin.view')}
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>
      {loading && <div className="flex justify-center py-4"><SpinIcon /></div>}
      <Pager next={nextUrl} onLoadMore={loadMore} loading={loading} />
    </div>
  );
}

// ── ListingsTab ───────────────────────────────────────────────────────────────

function ListingsTab({ t }) {
  const [listings, setListings] = useState([]);
  const [nextUrl,  setNextUrl]  = useState(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api.get('/admin/listings/', { signal: controller.signal })
      .then(r => { setListings(r.data.results); setNextUrl(r.data.next); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoading(true);
    try {
      const r = await api.get(nextUrl);
      setListings(prev => [...prev, ...r.data.results]);
      setNextUrl(r.data.next);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.delete_confirm'))) return;
    try {
      await api.delete(`/admin/listings/${id}/`);
      setListings(prev => prev.filter(l => l.id !== id));
    } catch {}
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.tab_listings')}</h2>
      <Table
        headers={[t('admin.crop'), t('admin.farmer_name'), t('admin.district'), t('admin.qty'), t('admin.price'), t('admin.status'), '']}
        empty={listings.length === 0 && !loading ? t('admin.no_data') : null}
      >
        {listings.map(l => (
          <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 font-medium text-gray-900">
              {l.crop?.emoji} {l.crop?.name_nepali}
            </td>
            <td className="px-4 py-3 text-gray-700">{l.farmer_name}</td>
            <td className="px-4 py-3 text-gray-600">{l.district}</td>
            <td className="px-4 py-3 text-gray-600">{parseFloat(l.quantity_kg).toFixed(0)} kg</td>
            <td className="px-4 py-3 font-medium" style={{ color: GREEN }}>
              {t('currency')}{parseFloat(l.asking_price).toFixed(0)}
            </td>
            <td className="px-4 py-3">
              <StatusBadge value={l.is_active ? 'ACTIVE' : 'INACTIVE'} />
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => handleDelete(l.id)}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title={t('admin.force_delete')}
              >
                <TrashIcon />
              </button>
            </td>
          </tr>
        ))}
      </Table>
      {loading && <div className="flex justify-center py-4"><SpinIcon /></div>}
      <Pager next={nextUrl} onLoadMore={loadMore} loading={loading} />
    </div>
  );
}

// ── OrdersTab ─────────────────────────────────────────────────────────────────

function OrdersTab({ t }) {
  const [orders,  setOrders]  = useState([]);
  const [filter,  setFilter]  = useState('');
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const r = await api.get('/admin/orders/', { params });
      setOrders(r.data.results);
      setNextUrl(r.data.next);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoading(true);
    try {
      const r = await api.get(nextUrl);
      setOrders(prev => [...prev, ...r.data.results]);
      setNextUrl(r.data.next);
    } catch {}
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.tab_orders')}</h2>
      <div className="mb-4">
        <select
          value={filter} onChange={e => setFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
        >
          <option value="">{t('admin.all_statuses')}</option>
          {['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <Table
        headers={[t('admin.crop'), t('admin.buyer_name'), t('admin.farmer_name'), t('admin.qty'), t('admin.price'), t('admin.status'), t('admin.date')]}
        empty={orders.length === 0 && !loading ? t('admin.no_data') : null}
      >
        {orders.map(o => (
          <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 font-medium text-gray-900">
              {o.crop_emoji} {o.crop_name}
            </td>
            <td className="px-4 py-3 text-gray-700">{o.buyer_name}</td>
            <td className="px-4 py-3 text-gray-700">{o.farmer_name}</td>
            <td className="px-4 py-3 text-gray-600">{parseFloat(o.quantity_kg).toFixed(0)} kg</td>
            <td className="px-4 py-3 font-medium" style={{ color: GREEN }}>
              {t('currency')}{parseFloat(o.asking_price || 0).toFixed(0)}
            </td>
            <td className="px-4 py-3"><StatusBadge value={o.status} /></td>
            <td className="px-4 py-3 text-gray-500 text-xs">
              {new Date(o.created_at).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </Table>
      {loading && <div className="flex justify-center py-4"><SpinIcon /></div>}
      <Pager next={nextUrl} onLoadMore={loadMore} loading={loading} />
    </div>
  );
}

// ── PricesTab ─────────────────────────────────────────────────────────────────

function PricesTab({ t }) {
  const [prices,   setPrices]   = useState([]);
  const [nextUrl,  setNextUrl]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [crops,    setCrops]    = useState([]);
  const [form,     setForm]     = useState({ crop_id: '', date: '', min_price: '', max_price: '' });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      api.get('/admin/prices/', { signal: controller.signal }),
      api.get('/crops/',        { signal: controller.signal }),
    ]).then(([pr, cr]) => {
      setPrices(pr.data.results);
      setNextUrl(pr.data.next);
      setCrops(cr.data.results || cr.data);
    }).catch(() => {}).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoading(true);
    try {
      const r = await api.get(nextUrl);
      setPrices(prev => [...prev, ...r.data.results]);
      setNextUrl(r.data.next);
    } catch {}
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const r = await api.post('/admin/prices/', form);
      setPrices(prev => [r.data, ...prev]);
      setMsg(t('admin.price_added'));
      setForm({ crop_id: '', date: '', min_price: '', max_price: '' });
      setShowForm(false);
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error');
    }
    setSaving(false);
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{t('admin.tab_prices')}</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: GREEN }}
        >
          <PlusIcon /> {t('admin.add_price')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-50 rounded-2xl p-4 mb-5 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 block mb-1">{t('admin.crop')}</label>
            <select
              value={form.crop_id}
              onChange={e => setForm(f => ({ ...f, crop_id: e.target.value }))}
              required className={inputCls}
            >
              <option value="">{t('admin.select_crop')}</option>
              {crops.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name_nepali}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{t('admin.date')}</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{t('admin.min')} ({t('currency')})</label>
            <input type="number" step="0.01" value={form.min_price} onChange={e => setForm(f => ({ ...f, min_price: e.target.value }))} required className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{t('admin.max')} ({t('currency')})</label>
            <input type="number" step="0.01" value={form.max_price} onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))} required className={inputCls} />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <button
              type="submit" disabled={saving}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: GREEN }}
            >
              {saving ? t('admin.submitting') : t('admin.submit')}
            </button>
            {msg && <span className="text-sm text-green-700">{msg}</span>}
          </div>
        </form>
      )}

      <Table
        headers={[t('admin.crop'), t('admin.date'), t('admin.min'), t('admin.max'), t('admin.avg'), t('admin.source')]}
        empty={prices.length === 0 && !loading ? t('admin.no_data') : null}
      >
        {prices.map(p => (
          <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 font-medium text-gray-900">
              {p.crop?.emoji} {p.crop?.name_nepali}
            </td>
            <td className="px-4 py-3 text-gray-600">{p.date}</td>
            <td className="px-4 py-3" style={{ color: GREEN }}>{t('currency')}{parseFloat(p.min_price).toFixed(0)}</td>
            <td className="px-4 py-3" style={{ color: RED }}>{t('currency')}{parseFloat(p.max_price).toFixed(0)}</td>
            <td className="px-4 py-3 text-gray-700 font-medium">{t('currency')}{parseFloat(p.avg_price).toFixed(0)}</td>
            <td className="px-4 py-3"><StatusBadge value={p.source} /></td>
          </tr>
        ))}
      </Table>
      {loading && <div className="flex justify-center py-4"><SpinIcon /></div>}
      <Pager next={nextUrl} onLoadMore={loadMore} loading={loading} />
    </div>
  );
}

// ── ScraperTab ────────────────────────────────────────────────────────────────

function ScraperTab({ t }) {
  const [logs,     setLogs]     = useState([]);
  const [nextUrl,  setNextUrl]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [running,  setRunning]  = useState(false);
  const [msg,      setMsg]      = useState('');
  const [runsToday, setRunsToday] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/scraper/logs/');
      setLogs(r.data.results);
      setNextUrl(r.data.next);
      const today = new Date().toISOString().slice(0, 10);
      const todayCount = r.data.results.filter(
        l => l.triggered_by !== 'scheduler' && l.started_at?.startsWith(today)
      ).length;
      setRunsToday(todayCount);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoading(true);
    try {
      const r = await api.get(nextUrl);
      setLogs(prev => [...prev, ...r.data.results]);
      setNextUrl(r.data.next);
    } catch {}
    setLoading(false);
  };

  const handleRun = async () => {
    setRunning(true);
    setMsg('');
    try {
      await api.post('/admin/scraper/run/');
      setMsg(t('admin.scraper_started'));
      setTimeout(fetchLogs, 1000);
    } catch (err) {
      setMsg(err.response?.data?.detail || t('admin.scraper_limit'));
    }
    setRunning(false);
  };

  const STATUS_COLOR = { SUCCESS: GREEN, ERROR: RED, RUNNING: BLUE };

  const duration = (log) => {
    if (!log.finished_at || !log.started_at) return '—';
    const ms = new Date(log.finished_at) - new Date(log.started_at);
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">{t('admin.scraper_title')}</h2>
      <p className="text-sm text-gray-500 mb-5">{t('admin.scraper_desc')}</p>

      <div className="bg-gray-50 rounded-2xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {t('admin.triggered_by')} ({runsToday}/3 {t('admin.date')})
          </p>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-8 h-2 rounded-full"
                style={{ backgroundColor: i < runsToday ? ORANGE : '#e5e7eb' }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={running || runsToday >= 3}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: runsToday >= 3 ? '#9ca3af' : ORANGE }}
        >
          {running ? <SpinIcon /> : <PlayIcon />}
          {running ? t('admin.running') : t('admin.run_scraper')}
        </button>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-blue-50 text-blue-800 text-sm">{msg}</div>
      )}

      <h3 className="text-base font-semibold text-gray-800 mb-3">{t('admin.logs_title')}</h3>
      <Table
        headers={[t('admin.status'), t('admin.triggered_by'), t('admin.fetched'), t('admin.saved'), t('admin.unmatched'), t('admin.started_at'), t('admin.duration')]}
        empty={logs.length === 0 && !loading ? t('admin.no_logs') : null}
      >
        {logs.map(log => (
          <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3"><StatusBadge value={log.status} /></td>
            <td className="px-4 py-3 text-gray-700">{log.triggered_by}</td>
            <td className="px-4 py-3 text-gray-600">{log.fetched_count}</td>
            <td className="px-4 py-3 font-medium" style={{ color: GREEN }}>{log.saved_count}</td>
            <td className="px-4 py-3 text-gray-500">{log.unmatched_count}</td>
            <td className="px-4 py-3 text-gray-500 text-xs">
              {log.started_at ? new Date(log.started_at).toLocaleString() : '—'}
            </td>
            <td className="px-4 py-3 text-gray-500 text-xs">{duration(log)}</td>
          </tr>
        ))}
      </Table>
      {loading && <div className="flex justify-center py-4"><SpinIcon /></div>}
      <Pager next={nextUrl} onLoadMore={loadMore} loading={loading} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPanelPage() {
  const { t } = useLanguage();
  const [tab,          setTab]          = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending verification count for badge
  useEffect(() => {
    const controller = new AbortController();
    api.get('/admin/stats/', { signal: controller.signal })
      .then(r => setPendingCount(r.data.pending_verifications || 0))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const CONTENT = {
    overview: <OverviewTab t={t} />,
    users:    <UsersTab    t={t} pendingCount={pendingCount} />,
    listings: <ListingsTab t={t} />,
    orders:   <OrdersTab   t={t} />,
    prices:   <PricesTab   t={t} />,
    scraper:  <ScraperTab  t={t} />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ backgroundColor: `${GREEN}18` }}
          >
            <span style={{ color: GREEN }}><ServerIcon /></span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('admin.title')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-56 md:min-h-screen bg-white border-b md:border-b-0 md:border-r border-gray-200 py-4 px-3 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {TABS.map(tabItem => {
              const active = tab === tabItem.key;
              return (
                <button
                  key={tabItem.key}
                  onClick={() => setTab(tabItem.key)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap text-left w-full"
                  style={active ? {
                    backgroundColor: `${GREEN}12`,
                    color: GREEN,
                    borderLeft: `3px solid ${GREEN}`,
                  } : {
                    color: '#6b7280',
                    borderLeft: '3px solid transparent',
                  }}
                >
                  {tabItem.icon}
                  <span className="flex-1">{t(tabItem.labelKey)}</span>
                  {tabItem.key === 'users' && pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: RED }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          {CONTENT[tab]}
        </main>
      </div>
    </div>
  );
}
