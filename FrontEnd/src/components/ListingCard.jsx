import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ListingCard({ listing, onOrder }) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [saved,    setSaved]    = useState(listing.is_saved ?? false);
  const [toggling, setToggling] = useState(false);

  const cropName = lang === 'en'
    ? (listing.crop?.name_english || listing.crop?.name_nepali)
    : listing.crop?.name_nepali;

  const handleOrder = () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    onOrder?.(listing);
  };

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (user.role !== 'BUYER') return;
    if (toggling) return;
    setToggling(true);
    try {
      if (saved) {
        await api.delete(`/listings/${listing.id}/unsave/`);
        setSaved(false);
      } else {
        await api.post(`/listings/${listing.id}/save/`);
        setSaved(true);
      }
    } catch {
      // swallow
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.01] transition-all duration-150">
      <div className="relative">
        {listing.photo ? (
          <img src={listing.photo} alt={cropName} className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 flex items-center justify-center text-5xl"
            style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
            {listing.crop?.emoji || '🌿'}
          </div>
        )}
        {/* Bookmark button — only visible to buyers or guests */}
        {(!user || user.role === 'BUYER') && (
          <button
            onClick={handleSaveToggle}
            disabled={toggling}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors disabled:opacity-60"
            title={saved ? 'सेभबाट हटाउनुस्' : 'सेभ गर्नुस्'}
          >
            <span className="text-base leading-none">{saved ? '🔖' : '🏷️'}</span>
          </button>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-gray-800">{cropName}</div>
            <div className="text-xs text-gray-400">{listing.district}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-base" style={{ color: '#1a6b2e' }}>
              {t('currency')}{parseFloat(listing.asking_price).toFixed(0)}
            </div>
            <div className="text-xs text-gray-400">{t('listing.per')} {listing.crop?.unit || 'kg'}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {parseFloat(listing.quantity_kg).toFixed(0)} {t('listing.available')}
          </span>
          <button
            onClick={handleOrder}
            className="text-xs px-4 py-2 rounded-full text-white font-medium cursor-pointer hover:opacity-85 active:opacity-70 transition-opacity"
            style={{ backgroundColor: '#f97316', minHeight: '36px' }}
          >
            {t('listing.order')}
          </button>
        </div>
        {listing.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{listing.description}</p>
        )}
      </div>
    </div>
  );
}
