import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api, { setAccessToken, clearAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [phoneWarning, setPhoneWarning] = useState(null); // { hours_remaining: number } | null

  // On mount: try to restore the session via the httpOnly refresh cookie.
  // No token in localStorage — the cookie is sent automatically.
  // 401 here is NORMAL for guests — we just set user = null and continue.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: refreshData } = await axios.post(
          '/api/auth/refresh/',
          {},
          { withCredentials: true }
        );
        setAccessToken(refreshData.access);
        const { data: meData } = await api.get('/auth/me/');
        if (!cancelled) {
          setUser(meData);
          // If user is already phone-verified, clear any stale warning
          if (meData.is_phone_verified) setPhoneWarning(null);
        }
      } catch {
        // 401 = not logged in (expected on public pages), network error, etc.
        clearAccessToken();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password });
    // access token in body; refresh token set as httpOnly cookie by server
    setAccessToken(data.access);
    if (data.warning === 'phone_pending') {
      setPhoneWarning({ hours_remaining: data.hours_remaining });
    } else {
      setPhoneWarning(null);
    }
    const me = await api.get('/auth/me/');
    setUser(me.data);
    return me.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');   // blacklists refresh token + clears cookie
    } catch {
      // Continue regardless — clear local state
    }
    clearAccessToken();
    setUser(null);
    setPhoneWarning(null);
  };

  const register = async (formData, username, password) => {
    await api.post('/auth/register/', formData);
    return login(username, password);
  };

  const clearPhoneWarning = () => setPhoneWarning(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, phoneWarning, clearPhoneWarning }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
