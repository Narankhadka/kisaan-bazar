import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const GREEN = '#1a6b2e';
const ORANGE = '#f97316';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function PricesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function ListingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function NavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center flex-1 py-2 text-xs"
      style={{ color: active ? GREEN : '#6b7280' }}
    >
      <span className="mb-0.5">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center z-50 safe-area-bottom md:hidden"
      style={{ maxWidth: '100vw' }}
    >
      <NavItem to="/"        icon={<HomeIcon />}    label={t('nav.home')}    active={pathname === '/'} />
      <NavItem to="/prices"  icon={<PricesIcon />}  label={t('nav.prices')}  active={pathname === '/prices'} />

      {/* Center FAB */}
      <div className="flex flex-col items-center flex-1">
        <Link
          to={user?.role === 'FARMER' ? '/listings/new' : '/listings'}
          className="flex items-center justify-center w-14 h-14 rounded-full text-white text-2xl font-bold -mt-5 shadow-lg"
          style={{ backgroundColor: ORANGE }}
        >
          +
        </Link>
      </div>

      {user?.role === 'FARMER'
        ? <NavItem to="/dashboard"       icon={<DashboardIcon />} label={t('dash.farmer_title')}  active={pathname === '/dashboard'} />
        : user?.role === 'BUYER'
          ? <NavItem to="/buyer-dashboard" icon={<DashboardIcon />} label={t('dash.buyer_title')}  active={pathname === '/buyer-dashboard'} />
          : user?.role === 'ADMIN'
            ? <NavItem to="/admin-panel"   icon={<DashboardIcon />} label={t('nav.admin_panel')}   active={pathname === '/admin-panel'} />
            : <NavItem to="/listings"      icon={<ListingsIcon />}  label={t('nav.buy')}            active={pathname === '/listings'} />
      }
      <NavItem to="/profile" icon={<ProfileIcon />} label={t('nav.profile')} active={pathname === '/profile'} />
    </nav>
  );
}
