import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import PricePage from './pages/PricePage';
import ListingsPage from './pages/ListingsPage';
import NewListingPage from './pages/NewListingPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 relative">
      <TopNav />
      {children}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/"              element={<HomePage />} />
                <Route path="/prices"        element={<PricePage />} />
                <Route path="/listings"      element={<ListingsPage />} />
                <Route path="/listings/new"  element={<NewListingPage />} />
                <Route path="/profile"       element={<ProfilePage />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
