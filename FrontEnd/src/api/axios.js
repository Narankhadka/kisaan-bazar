import axios from 'axios';

// ── In-memory access token ────────────────────────────────────────────────
// The access token is stored in JS memory (not localStorage) to protect
// against XSS attacks. It is lost on page reload — the refresh cookie
// (httpOnly, set by the server) is used to recover a new access token.

let _accessToken = null;

export function setAccessToken(token) { _accessToken = token; }
export function clearAccessToken()    { _accessToken = null; }
export function getAccessToken()      { return _accessToken; }

// ── Axios instance ────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,   // send httpOnly refresh cookie automatically
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// On 401: try refresh (cookie is auto-sent), then retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh/', {}, {
          withCredentials: true,  // ensure cookie is sent
        });
        setAccessToken(data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        // Only redirect to login if the user was previously authenticated.
        // If there was no token (public page visit), just reject silently.
        const wasAuthenticated = _accessToken !== null;
        clearAccessToken();
        if (wasAuthenticated) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
