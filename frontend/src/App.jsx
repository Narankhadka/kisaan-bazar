import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';
import Footer from './components/Footer';
import Spinner from './components/Spinner';

// ── Lazy-loaded pages (code splitting — each page = separate chunk) ────────
const HomePage           = lazy(() => import('./pages/HomePage'));
const PricePage          = lazy(() => import('./pages/PricePage'));
const ListingsPage       = lazy(() => import('./pages/ListingsPage'));
const NewListingPage     = lazy(() => import('./pages/NewListingPage'));
const LoginPage          = lazy(() => import('./pages/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/RegisterPage'));
const VerifyPhonePage    = lazy(() => import('./pages/VerifyPhonePage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const BuyerDashboardPage = lazy(() => import('./pages/BuyerDashboardPage'));
const AdminPanelPage     = lazy(() => import('./pages/AdminPanelPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentFailurePage = lazy(() => import('./pages/PaymentFailurePage'));
const ContactPage        = lazy(() => import('./pages/ContactPage'));
const AboutPage          = lazy(() => import('./pages/AboutPage'));

// ── Skeleton shown while a lazy page chunk is downloading ─────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar placeholder */}
      <div className="h-16 bg-white border-b border-gray-100 shadow-sm" />
      {/* Content shimmer */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8 space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded-xl w-1/3" />
        <div className="h-4 bg-gray-200 animate-pulse rounded-xl w-2/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl" style={{ width: `${95 - i * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Scroll to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

/* Fade-in wrapper keyed by path */
function PageWrapper({ children }) {
  const { pathname } = useLocation();
  return <div key={pathname} className="page-enter">{children}</div>;
}

function PhonePendingBanner() {
  const { phoneWarning, clearPhoneWarning } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!phoneWarning) return null;

  return (
    <div className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
      style={{ backgroundColor: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
      <span className="text-orange-700 font-medium">
        {t('banner.phone_pending').replace('{h}', phoneWarning.hours_remaining)}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate('/verify-phone')}
          className="text-xs font-bold text-white px-3 py-1 rounded-lg cursor-pointer"
          style={{ backgroundColor: '#f97316' }}
        >
          {t('banner.verify_now')}
        </button>
        <button
          onClick={clearPhoneWarning}
          className="text-xs text-orange-500 hover:text-orange-700 cursor-pointer"
          aria-label="dismiss"
        >
          {t('banner.dismiss')}
        </button>
      </div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 relative flex flex-col">
      <TopNav />
      <PhonePendingBanner />
      <div className="flex-1">
        <PageWrapper>{children}</PageWrapper>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}

function ProtectedRoute({ children, role = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    const roleLabel = role === 'FARMER' ? 'किसान' : role === 'ADMIN' ? 'एडमिन' : 'खरिदकर्ता';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ width: 48, height: 48 }}>
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <h2 className="text-xl font-bold text-gray-800">अनुमति छैन</h2>
        <p className="text-sm text-gray-500">यो पृष्ठ {roleLabel} को लागि मात्र हो।</p>
        <Link to="/" className="mt-2 text-sm font-medium text-green-700 underline">गृहपृष्ठमा जानुस्</Link>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Suspense fallback={<PageSkeleton />}>
            <ScrollToTop />
            <Routes>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-phone" element={
                <ProtectedRoute><VerifyPhonePage /></ProtectedRoute>
              } />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/failure" element={<PaymentFailurePage />} />
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/"             element={<HomePage />} />
                    <Route path="/prices"       element={<PricePage />} />
                    <Route path="/listings"     element={<ListingsPage />} />
                    <Route path="/contact"      element={<ContactPage />} />
                    <Route path="/about"        element={<AboutPage />} />
                    <Route path="/listings/new" element={
                      <ProtectedRoute role="FARMER"><NewListingPage /></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute><ProfilePage /></ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute role="FARMER"><DashboardPage /></ProtectedRoute>
                    } />
                    <Route path="/buyer-dashboard" element={
                      <ProtectedRoute role="BUYER"><BuyerDashboardPage /></ProtectedRoute>
                    } />
                    <Route path="/admin-panel" element={
                      <ProtectedRoute role="ADMIN"><AdminPanelPage /></ProtectedRoute>
                    } />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </Suspense>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
