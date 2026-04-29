import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PriceCard from '../components/PriceCard';
import ListingCard from '../components/ListingCard';
import OrderModal from '../components/OrderModal';
import { matchesCrop, toNepaliNum } from '../utils/searchUtils';
import { useLanguage } from '../context/LanguageContext';

function Highlight({ text, query }) {
  if (!query || !text) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900 px-0.5 rounded not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

export default function HomePage() {
  const [prices, setPrices]             = useState([]);
  const [listings, setListings]         = useState([]);
  const [loadingP, setLoadingP]         = useState(true);
  const [loadingL, setLoadingL]         = useState(true);
  const [errorP, setErrorP]             = useState(false);
  const [errorL, setErrorL]             = useState(false);
  const [search, setSearch]             = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [orderListing, setOrderListing] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const { lang, t } = useLanguage();
  const navigate   = useNavigate();
  const searchRef  = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/prices/today/', { signal: controller.signal })
      .then(({ data }) => setPrices(data.results || []))
      .catch(err => { if (err?.code !== 'ERR_CANCELED') setErrorP(true); })
      .finally(() => setLoadingP(false));
    api.get('/listings/', { signal: controller.signal })
      .then(({ data }) => setListings(data.results || []))
      .catch(err => { if (err?.code !== 'ERR_CANCELED') setErrorL(true); })
      .finally(() => setLoadingL(false));
    return () => controller.abort();
  }, []);

  // "/" keyboard shortcut — focus search bar
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
        setDropdownOpen(true);
      }
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        searchRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Real-time filtered prices — uses transliteration map
  const filteredPrices = search.trim()
    ? prices.filter(p => matchesCrop(p, search))
    : prices;

  // Dropdown suggestions (mobile) — top 6 matches
  const suggestions = search.trim() ? filteredPrices.slice(0, 6) : [];

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setDropdownOpen(true);
  };

  const handleClear = () => {
    setSearch('');
    setDropdownOpen(false);
    searchRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setDropdownOpen(false);
    if (search.trim()) navigate(`/prices?q=${encodeURIComponent(search.trim())}`);
  };

  const handleSuggestionClick = (price) => {
    setSearch(price.crop?.name_nepali || '');
    setDropdownOpen(false);
  };

  const handleOrder = (listing) => setOrderListing(listing);
  const handleOrderClose = (ok) => {
    setOrderListing(null);
    if (ok) setOrderSuccess(true);
  };

  const statsItems = [
    { n: '120+', label: t('stats.vegetables') },
    { n: '850+', label: t('stats.farmers') },
    { n: '77',   label: t('stats.districts') },
  ];

  return (
    <div className="pb-24 md:pb-10">

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #0f5323 0%, #1a6b2e 40%, #2d9249 100%)' }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M40 0C17.9 0 0 17.9 0 40s17.9 40 40 40 40-17.9 40-40S62.1 0 40 0zm0 72C22.4 72 8 57.6 8 40S22.4 8 40 8s32 14.4 32 32-14.4 32-32 32z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:gap-16 pt-10 md:pt-16 pb-8 md:pb-16">

            {/* Left: Text + Search */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 md:hidden">
                <span className="text-2xl">🌾</span>
                <span className="text-lg font-bold tracking-wide">{t('app.name')}</span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mt-2 md:mt-0 mb-2 md:mb-4">
                {t('home.title1')}<br />
                <span className="text-green-300">{t('home.title2')}</span>
              </h1>
              <p className="text-green-200 text-sm md:text-lg mb-5 md:mb-8 max-w-md">
                {t('app.subtitle')}
              </p>

              {/* ── Search bar ── */}
              <div ref={wrapperRef} className="relative md:max-w-lg">
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    onFocus={() => search.trim() && setDropdownOpen(true)}
                    placeholder={t('home.search_placeholder')}
                    className="w-full bg-white/20 backdrop-blur border border-white/30 rounded-2xl px-4 py-3 md:py-4 pr-20 text-white placeholder-green-200 text-sm md:text-base focus:outline-none focus:bg-white/30 focus:border-white/60 transition-all"
                  />

                  {/* Clear button */}
                  {search && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-lg leading-none transition-colors"
                    >
                      ✕
                    </button>
                  )}

                  {/* Search icon / submit */}
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform"
                  >
                    🔍
                  </button>
                </form>

                {/* Keyboard hint */}
                {!search && (
                  <div className="hidden md:flex items-center gap-1 mt-2 text-green-300/70 text-xs">
                    <kbd className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 font-mono text-xs">/</kbd>
                    <span>{t('home.search_hint')}</span>
                  </div>
                )}

                {/* ── Mobile dropdown ── */}
                {dropdownOpen && search.trim() && (
                  <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    {suggestions.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-400 text-sm">
                        <div className="text-3xl mb-2">🔍</div>
                        <p className="font-medium text-gray-500">{t('home.no_results')}</p>
                        <p className="text-xs mt-1 text-gray-400">"{search}" {lang === 'en' ? 'not found' : 'को लागि कुनै तरकारी छैन'}</p>
                      </div>
                    ) : (
                      <>
                        {suggestions.map((p, i) => {
                          const sName = lang === 'en' ? (p.crop?.name_english || p.crop?.name_nepali) : p.crop?.name_nepali;
                          const sSecondary = lang === 'en' ? p.crop?.name_nepali : p.crop?.name_english;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSuggestionClick(p)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${i < suggestions.length - 1 ? 'border-b border-gray-50' : ''}`}
                            >
                              <span className="text-2xl shrink-0">{p.crop?.emoji || '🌿'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-800">
                                  <Highlight text={sName} query={search} />
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                  <Highlight text={sSecondary} query={search} />
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-bold text-sm" style={{ color: '#1a6b2e' }}>
                                  {t('currency')}{parseFloat(p.avg_price).toFixed(0)}
                                </div>
                                <div className="text-xs text-gray-400">/{p.crop?.unit || 'kg'}</div>
                              </div>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="w-full py-3 text-center text-sm font-medium border-t border-gray-100 hover:bg-gray-50 transition-colors"
                          style={{ color: '#f97316' }}
                        >
                          {t('view_all')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Stats — desktop inside hero */}
              <div className="hidden md:grid grid-cols-3 gap-4 mt-8 max-w-sm">
                {statsItems.map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-bold text-white">{s.n}</div>
                    <div className="text-xs text-green-300 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Decorative panel (desktop only) */}
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20 w-full max-w-sm">
                <div className="text-center mb-6">
                  <span className="text-7xl">🌾</span>
                  <h2 className="text-xl font-bold mt-3 text-white">{t('home.agri_market')}</h2>
                  <p className="text-green-200 text-sm mt-1">{t('home.fresh_contact')}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/listings/new"
                    className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 rounded-2xl p-4 transition-colors border border-white/10"
                  >
                    <span className="text-sm font-bold">{t('home.sell_crops')}</span>
                    <span className="text-xs text-green-200">{t('home.for_farmers')}</span>
                  </Link>
                  <Link
                    to="/listings"
                    className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-colors border border-orange-400/30"
                    style={{ background: 'rgba(249,115,22,0.25)' }}
                  >
                    <span className="text-sm font-bold">{t('home.buy_now')}</span>
                    <span className="text-xs text-orange-200">{t('home.for_buyers')}</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Stats (mobile only) ── */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-4 md:hidden">
        {statsItems.map(s => (
          <div key={s.label} className="bg-white rounded-2xl py-3 text-center shadow-sm">
            <div className="text-lg font-bold" style={{ color: '#1a6b2e' }}>{s.n}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── CTA cards (mobile only) ── */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4 md:hidden">
        <Link
          to="/listings/new"
          className="rounded-2xl p-4 text-white flex flex-col gap-1"
          style={{ background: 'linear-gradient(135deg, #1a6b2e, #2d9249)' }}
        >
          <span className="font-bold text-sm">{t('home.sell_crops')}</span>
          <span className="text-xs text-green-200">{t('home.for_farmers')}</span>
        </Link>
        <Link
          to="/listings"
          className="rounded-2xl p-4 text-white flex flex-col gap-1"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
        >
          <span className="font-bold text-sm">{t('home.buy_now')}</span>
          <span className="text-xs text-orange-100">{t('home.for_buyers')}</span>
        </Link>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 mt-6">

        {/* Alert Banner */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3 text-white mb-6"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <div className="font-bold text-sm md:text-base">{t('alert.title')}</div>
            <div className="text-xs md:text-sm text-orange-100">{t('alert.desc')}</div>
          </div>
          <Link
            to="/profile"
            className="bg-white text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-orange-50 transition-colors"
          >
            {t('alert.btn')}
          </Link>
        </div>

        {/* Two-column layout on desktop */}
        <div className="md:grid md:grid-cols-3 md:gap-8 lg:gap-10">

          {/* LEFT: Today's Prices */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-800 text-base md:text-lg">{t('home.today_prices')}</h2>
                {search.trim() && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {t('home.results_count', { n: toNepaliNum(filteredPrices.length) })}
                  </span>
                )}
              </div>
              <Link to="/prices" className="text-xs md:text-sm font-medium hover:underline" style={{ color: '#f97316' }}>
                {t('view_all')}
              </Link>
            </div>

            {loadingP ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
                    <div className="skeleton w-12 h-12 rounded-full mx-auto" />
                    <div className="skeleton h-4 w-3/4 mx-auto" />
                    <div className="skeleton h-3 w-1/2 mx-auto" />
                    <div className="skeleton h-5 w-2/3 mx-auto mt-1" />
                  </div>
                ))}
              </div>
            ) : errorP ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="font-medium text-gray-600">सर्भर समस्या भयो</p>
                <button
                  onClick={() => { setErrorP(false); setLoadingP(true); api.get('/prices/today/').then(({ data }) => setPrices(data.results || [])).catch(() => setErrorP(true)).finally(() => setLoadingP(false)); }}
                  className="mt-3 text-xs px-4 py-2 rounded-full border border-gray-300 hover:border-green-600 hover:text-green-700 transition-colors cursor-pointer"
                >
                  पुन: प्रयास गर्नुस्
                </button>
              </div>
            ) : filteredPrices.length === 0 && search.trim() ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">🔍</div>
                <p className="font-semibold text-gray-500 text-base">{t('home.no_results')}</p>
                <p className="text-sm mt-1">
                  {t('home.no_results_msg', { q: search })}
                </p>
                <button
                  onClick={handleClear}
                  className="mt-4 text-xs px-4 py-2 rounded-full border border-gray-300 hover:border-green-600 hover:text-green-700 transition-colors"
                >
                  {t('home.clear_search')}
                </button>
              </div>
            ) : prices.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">{t('home.no_prices')}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(search.trim() ? filteredPrices : prices.slice(0, 8)).map(p => (
                  <PriceCard key={p.id} price={p} highlight={search} />
                ))}
              </div>
            )}

            {!search.trim() && prices.length > 0 && (
              <Link
                to="/prices"
                className="mt-4 w-full flex items-center justify-center py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-green-600 hover:text-green-700 transition-colors"
              >
                {t('home.view_all_prices', { n: prices.length })}
              </Link>
            )}
          </div>

          {/* RIGHT: Farmer Listings sidebar */}
          <div className="mt-6 md:mt-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 text-base md:text-lg">{t('home.farmer_listings')}</h2>
              <Link to="/listings" className="text-xs md:text-sm font-medium hover:underline" style={{ color: '#f97316' }}>
                {t('view_all')}
              </Link>
            </div>
            {loadingL ? (
              <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="skeleton w-full h-36" style={{ borderRadius: 0 }} />
                    <div className="p-3 flex flex-col gap-2">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                      <div className="skeleton h-8 w-full mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : errorL ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="font-medium text-gray-600">सर्भर समस्या भयो</p>
                <button
                  onClick={() => { setErrorL(false); setLoadingL(true); api.get('/listings/').then(({ data }) => setListings(data.results || [])).catch(() => setErrorL(true)).finally(() => setLoadingL(false)); }}
                  className="mt-3 text-xs px-4 py-2 rounded-full border border-gray-300 hover:border-green-600 hover:text-green-700 transition-colors cursor-pointer"
                >
                  पुन: प्रयास गर्नुस्
                </button>
              </div>
            ) : listings.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">{t('home.no_listings')}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                {listings.slice(0, 4).map(l => (
                  <ListingCard key={l.id} listing={l} onOrder={handleOrder} />
                ))}
              </div>
            )}
            {listings.length > 0 && (
              <Link
                to="/listings"
                className="mt-4 w-full flex items-center justify-center py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-green-600 hover:text-green-700 transition-colors"
              >
                {t('home.view_all_listings')}
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* Order modal */}
      {orderListing && <OrderModal listing={orderListing} onClose={handleOrderClose} />}

      {/* Success toast */}
      {orderSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-2xl shadow-lg">
          ✅ {t('order.success')}
          <button className="ml-3 font-bold" onClick={() => setOrderSuccess(false)}>✕</button>
        </div>
      )}
    </div>
  );
}
