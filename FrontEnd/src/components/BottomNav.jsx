import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const GREEN = '#1a6b2e';
const ORANGE = '#f97316';

function NavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center flex-1 py-2 text-xs"
      style={{ color: active ? GREEN : '#6b7280' }}
    >
      <span className="text-xl mb-0.5">{icon}</span>
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
      <NavItem to="/"        icon="🏠" label={t('nav.home')}    active={pathname === '/'} />
      <NavItem to="/prices"  icon="📊" label={t('nav.prices')}  active={pathname === '/prices'} />

      {/* Center FAB */}
      <div className="flex flex-col items-center flex-1">
        <Link
          to={user?.role === 'FARMER' ? '/listings/new' : '/listings'}
          className="flex items-center justify-center w-14 h-14 rounded-full text-white text-2xl -mt-5 shadow-lg"
          style={{ backgroundColor: ORANGE }}
        >
          {user?.role === 'FARMER' ? '+' : '🛒'}
        </Link>
      </div>

      <NavItem to="/listings" icon="🌿" label={t('nav.buy')}     active={pathname === '/listings'} />
      <NavItem to="/profile"  icon="👤" label={t('nav.profile')} active={pathname === '/profile'} />
    </nav>
  );
}
