import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const GREEN = '#1a6b2e';
const ORANGE = '#f97316';

export default function TopNav() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { to: '/',         label: t('nav.home') },
    { to: '/prices',   label: t('nav.prices') },
    { to: '/listings', label: t('nav.listings') },
  ];

  return (
    <nav className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <span className="text-3xl leading-none" style={{ filter: 'sepia(1) saturate(2) hue-rotate(5deg)' }}>🌾</span>
        <span className="text-lg font-bold tracking-wide" style={{ color: GREEN }}>{t('app.name')}</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-8">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="text-sm font-medium transition-colors hover:opacity-80 pb-0.5"
            style={{
              color: pathname === link.to ? GREEN : '#374151',
              borderBottom: pathname === link.to ? `2px solid ${GREEN}` : '2px solid transparent',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right: language toggle + auth */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Language toggle */}
        <div className="flex items-center gap-1 text-sm border border-gray-200 rounded-full px-3 py-1.5">
          <button
            onClick={() => setLang('ne')}
            className="transition-colors"
            style={{ color: lang === 'ne' ? GREEN : '#9ca3af', fontWeight: lang === 'ne' ? 700 : 400 }}
          >
            नेपाली
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => setLang('en')}
            className="transition-colors"
            style={{ color: lang === 'en' ? GREEN : '#9ca3af', fontWeight: lang === 'en' ? 700 : 400 }}
          >
            EN
          </button>
        </div>

        {user ? (
          <>
            {user.role === 'FARMER' && (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium transition-colors hover:opacity-80 pb-0.5"
                  style={{
                    color: pathname === '/dashboard' ? GREEN : '#374151',
                    borderBottom: pathname === '/dashboard' ? `2px solid ${GREEN}` : '2px solid transparent',
                  }}
                >
                  {t('dash.farmer_title')}
                </Link>
                <Link
                  to="/listings/new"
                  className="text-sm px-4 py-2 rounded-full text-white font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: ORANGE }}
                >
                  {t('nav.add_crop')}
                </Link>
              </>
            )}
            {user.role === 'BUYER' && (
              <Link
                to="/buyer-dashboard"
                className="text-sm font-medium transition-colors hover:opacity-80 pb-0.5"
                style={{
                  color: pathname === '/buyer-dashboard' ? ORANGE : '#374151',
                  borderBottom: pathname === '/buyer-dashboard' ? `2px solid ${ORANGE}` : '2px solid transparent',
                }}
              >
                {t('dash.buyer_title')}
              </Link>
            )}
            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-green-800 px-3 py-2 rounded-full hover:bg-green-50 transition-colors"
            >
              {user.username}
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="text-sm px-5 py-2 rounded-full text-white font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: GREEN }}
          >
            {t('nav.login')}
          </Link>
        )}
      </div>
    </nav>
  );
}
