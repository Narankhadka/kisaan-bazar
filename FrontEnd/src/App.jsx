import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import PricePage from './pages/PricePage';
import ListingsPage from './pages/ListingsPage';
import NewListingPage from './pages/NewListingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import Spinner from './components/Spinner';
import { Link } from 'react-router-dom';

/* Scroll to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

/* Wrap page content with fade-in animation keyed by path */
function PageWrapper({ children }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 relative">
      <TopNav />
      <PageWrapper>{children}</PageWrapper>
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="text-5xl">🚫</div>
        <h2 className="text-xl font-bold text-gray-800">अनुमति छैन</h2>
        <p className="text-sm text-gray-500">
          यो पृष्ठ {role === 'FARMER' ? 'किसान' : 'खरिदकर्ता'} को लागि मात्र हो।
        </p>
        <Link to="/" className="mt-2 text-sm font-medium text-green-700 underline">
          गृहपृष्ठमा जानुस्
        </Link>
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
          <ScrollToTop />
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/"             element={<HomePage />} />
                  <Route path="/prices"       element={<PricePage />} />
                  <Route path="/listings"     element={<ListingsPage />} />
                  <Route path="/listings/new" element={
                    <ProtectedRoute role="FARMER">
                      <NewListingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute role="FARMER">
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/buyer-dashboard" element={
                    <ProtectedRoute role="BUYER">
                      <BuyerDashboardPage />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Layout>
            } />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
