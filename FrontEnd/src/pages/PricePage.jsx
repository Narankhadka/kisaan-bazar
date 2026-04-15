import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import PriceCard from '../components/PriceCard';
import Spinner from '../components/Spinner';
import { useLanguage } from '../context/LanguageContext';
import { toNepaliNum, translateToNepali } from '../utils/searchUtils';

export default function PricePage() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [prices, setPrices]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  // `search` is the committed API term (may be translated Nepali)
  const [search, setSearch]     = useState(() => translateToNepali(searchParams.get('q') || ''));
  const [cat, setCat]           = useState('');

  const isFirstRender = useRef(true);

  const CATEGORIES = [
    { key: '',          label: t('prices.all') },
    { key: 'VEGETABLE', label: `🥦 ${t('prices.vegetables')}` },
    { key: 'FRUIT',     label: `🍎 ${t('prices.fruits')}` },
    { key: 'OTHER',     label: `🌾 ${t('prices.other')}` },
  ];

  // Fetch whenever committed search term or category changes
  useEffect(() => {
    setLoading(true);
    const params = { page_size: 100 };
    if (search) params.crop = search;
    if (cat)    params.category = cat;
    api.get('/prices/today/', { params })
      .then(({ data }) => setPrices(data.results || []))
      .finally(() => setLoading(false));
  }, [search, cat]);

  // Debounce: commit search 600ms after the user stops typing
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => commitSearch(inputVal), 600);
    return () => clearTimeout(timer);
  }, [inputVal]);

  // Translate + commit (used by debounce, Enter, and search button)
  const commitSearch = (raw) => {
    const term = translateToNepali(raw.trim());
    setSearch(term);
    if (raw.trim()) setSearchParams({ q: raw.trim() });
    else setSearchParams({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    commitSearch(inputVal);
  };

  const handleClear = () => {
    setInputVal('');
    setSearch('');
    setSearchParams({});
  };

  // Result count text
  const resultInfo = () => {
    const n = prices.length;
    if (n === 0) {
      return lang === 'en' ? 'No results found' : 'कुनै नतिजा भेटिएन';
    }
    return t('prices.found', { n: lang === 'ne' ? toNepaliNum(n) : n });
  };

  return (
    <div className="pb-24 md:pb-10">
      {/* Header */}
      <div
        className="text-white"
        style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-8 md:pt-10 pb-5">
          <h1 className="text-xl md:text-2xl font-bold mb-3">{t('prices.title')}</h1>
          <form onSubmit={handleSubmit} className="relative md:max-w-xl">
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder={t('prices.search')}
              className="w-full bg-white/20 border border-white/30 rounded-2xl px-4 py-2.5 pr-20 text-white placeholder-green-200 text-sm focus:outline-none focus:bg-white/30 transition-colors"
            />
            {inputVal && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-lg leading-none transition-colors"
              >×</button>
            )}
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform"
            >🔍</button>
          </form>
        </div>
      </div>

      {/* Category tabs */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
              style={cat === c.key
                ? { backgroundColor: '#1a6b2e', color: 'white', borderColor: '#1a6b2e' }
                : { backgroundColor: 'white', color: '#374151', borderColor: '#d1d5db' }
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        {loading ? (
          <Spinner />
        ) : prices.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🌿</div>
            <p className="font-medium text-gray-500">{resultInfo()}</p>
            {(search || cat) && (
              <button
                onClick={() => { handleClear(); setCat(''); }}
                className="mt-4 text-xs px-4 py-2 rounded-full border border-gray-300 hover:border-green-600 hover:text-green-700 transition-colors"
              >
                {lang === 'en' ? 'Clear filters' : 'फिल्टर हटाउनुस्'}
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">{resultInfo()}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {prices.map(p => <PriceCard key={p.id} price={p} highlight={inputVal} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
