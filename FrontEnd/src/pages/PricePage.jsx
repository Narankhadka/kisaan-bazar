import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import PriceCard from '../components/PriceCard';
import Spinner from '../components/Spinner';
import { useLanguage } from '../context/LanguageContext';

export default function PricePage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [prices, setPrices]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState(searchParams.get('q') || '');
  const [cat, setCat]         = useState('');
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');

  const CATEGORIES = [
    { key: '',          label: t('prices.all') },
    { key: 'VEGETABLE', label: `🥬 ${t('prices.vegetables')}` },
    { key: 'FRUIT',     label: `🍎 ${t('prices.fruits')}` },
    { key: 'OTHER',     label: `🌾 ${t('prices.other')}` },
  ];

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.crop = search;
    api.get('/prices/today/', { params })
      .then(({ data }) => setPrices(data.results || []))
      .finally(() => setLoading(false));
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputVal);
    if (inputVal) setSearchParams({ q: inputVal });
    else setSearchParams({});
  };

  const filtered = cat
    ? prices.filter(p => p.crop?.category === cat)
    : prices;

  return (
    <div className="pb-24 md:pb-10">
      {/* Header */}
      <div
        className="text-white"
        style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-8 md:pt-10 pb-5">
          <h1 className="text-xl md:text-2xl font-bold mb-3">{t('prices.title')}</h1>
          <form onSubmit={handleSearch} className="relative md:max-w-xl">
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder={t('prices.search')}
              className="w-full bg-white/20 border border-white/30 rounded-2xl px-4 py-2.5 text-white placeholder-green-200 text-sm focus:outline-none focus:bg-white/30"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => { setInputVal(''); setSearch(''); setSearchParams({}); }}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-white/60 text-lg"
              >×</button>
            )}
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">🔍</button>
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
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🌿</div>
            <p>{t('prices.not_found')}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">{t('prices.found', { n: filtered.length })}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(p => <PriceCard key={p.id} price={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
