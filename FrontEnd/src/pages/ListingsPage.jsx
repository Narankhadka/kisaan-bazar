import { useState, useEffect } from 'react';
import api from '../api/axios';
import ListingCard from '../components/ListingCard';
import OrderModal from '../components/OrderModal';
import { ALL_DISTRICTS } from '../data/districts';

export default function ListingsPage() {
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [district, setDistrict]     = useState('');
  const [cropQ, setCropQ]           = useState('');
  const [search, setSearch]         = useState('');
  const [orderListing, setOrderListing] = useState(null);
  const [success, setSuccess]       = useState(false);
  const [page, setPage]             = useState(1);
  const [hasNext, setHasNext]       = useState(false);

  // Filter-triggered fetch (aborted when filters change or component unmounts)
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const params = { page: 1 };
    if (district) params.district = district;
    if (search)   params.crop     = search;
    api.get('/listings/', { params, signal: controller.signal })
      .then(({ data }) => {
        setListings(data.results || []);
        setHasNext(!!data.next);
        setPage(1);
      })
      .catch(err => { if (err?.code !== 'ERR_CANCELED') setError(true); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [district, search]);

  // Load-more (no abort needed — user triggered, page append)
  const fetchListings = (nextPage) => {
    setLoading(true);
    const params = { page: nextPage };
    if (district) params.district = district;
    if (search)   params.crop     = search;
    api.get('/listings/', { params })
      .then(({ data }) => {
        setListings(prev => [...prev, ...(data.results || [])]);
        setHasNext(!!data.next);
        setPage(nextPage);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(cropQ);
  };

  const handleOrder  = (l) => setOrderListing(l);
  const handleClose  = (ok) => { setOrderListing(null); if (ok) setSuccess(true); };

  const loadMore = () => { fetchListings(page + 1); };

  return (
    <div className="pb-24 md:pb-10">
      {/* Header */}
      <div
        className="text-white"
        style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-8 md:pt-10 pb-5">
          <h1 className="text-xl md:text-2xl font-bold mb-3">किसानका बालीहरू</h1>
          <form onSubmit={handleSearch} className="relative mb-3 md:max-w-xl">
            <input
              type="text"
              value={cropQ}
              onChange={e => setCropQ(e.target.value)}
              placeholder="बाली खोज्नुहोस्..."
              className="w-full bg-white/20 border border-white/30 rounded-2xl px-4 py-2.5 text-white placeholder-green-200 text-sm focus:outline-none"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">🔍</button>
          </form>

          {/* District filter scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setDistrict('')}
              className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-all"
              style={!district
                ? { backgroundColor: 'white', color: '#1a6b2e', borderColor: 'white' }
                : { backgroundColor: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.4)' }
              }
            >
              सबै जिल्ला
            </button>
            {ALL_DISTRICTS.map(d => (
              <button
                key={d}
                onClick={() => setDistrict(d)}
                className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-all"
                style={district === d
                  ? { backgroundColor: 'white', color: '#1a6b2e', borderColor: 'white' }
                  : { backgroundColor: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.4)' }
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-4">
        {loading && listings.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            {[...Array(6)].map((_, i) => (
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
        ) : error ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="font-medium text-gray-600">सर्भर समस्या भयो</p>
            <p className="text-sm mt-1">इन्टरनेट जडान जाँच गर्नुस् र पुन: प्रयास गर्नुस्।</p>
            <button
              onClick={() => fetchListings(true)}
              className="mt-4 text-sm px-5 py-2.5 rounded-xl font-medium text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#1a6b2e', minHeight: '44px' }}
            >
              पुन: प्रयास गर्नुस्
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🌱</div>
            <p>हाल कुनै बाली उपलब्ध छैन।</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {listings.map(l => (
                <ListingCard key={l.id} listing={l} onOrder={handleOrder} />
              ))}
            </div>
            {hasNext && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full mt-4 py-3 rounded-2xl border text-sm font-medium text-gray-600 bg-white disabled:opacity-50 hover:border-green-600 hover:text-green-700 transition-colors cursor-pointer min-h-[44px]"
              >
                {loading ? 'लोड हुँदै...' : 'थप हेर्नुस्'}
              </button>
            )}
          </>
        )}
      </div>

      {orderListing && <OrderModal listing={orderListing} onClose={handleClose} />}

      {success && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-2xl shadow-lg">
          ✅ अर्डर पठाइयो!
          <button className="ml-3 font-bold" onClick={() => setSuccess(false)}>✕</button>
        </div>
      )}
    </div>
  );
}
