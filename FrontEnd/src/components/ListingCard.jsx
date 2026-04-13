import { useLanguage } from '../context/LanguageContext';

export default function ListingCard({ listing, onOrder }) {
  const { lang, t } = useLanguage();
  const cropName = lang === 'en'
    ? (listing.crop?.name_english || listing.crop?.name_nepali)
    : listing.crop?.name_nepali;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {listing.photo ? (
        <img src={listing.photo} alt={cropName} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 flex items-center justify-center text-5xl"
          style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
          {listing.crop?.emoji || '🌿'}
        </div>
      )}
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
            onClick={() => onOrder?.(listing)}
            className="text-xs px-3 py-1.5 rounded-full text-white font-medium"
            style={{ backgroundColor: '#f97316' }}
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
