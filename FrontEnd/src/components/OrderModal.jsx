import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function OrderModal({ listing, onClose }) {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [qty, setQty] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!listing) return null;

  const cropName = lang === 'en'
    ? (listing.crop?.name_english || listing.crop?.name_nepali)
    : listing.crop?.name_nepali;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/orders/', {
        listing: listing.id,
        quantity_kg: qty,
        message,
      });
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.detail || t('order.err'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg" style={{ color: '#1a6b2e' }}>
            {cropName} — {t('order.label')}
          </h2>
          <button onClick={() => onClose(false)} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">
          <div>{t('order.farmer')} <strong>{listing.farmer_name || listing.farmer}</strong></div>
          <div>{t('order.district')} {listing.district}</div>
          <div>{t('order.price')} <strong style={{ color: '#1a6b2e' }}>{t('currency')}{parseFloat(listing.asking_price).toFixed(0)}/kg</strong></div>
          <div>{t('order.available')} {parseFloat(listing.quantity_kg).toFixed(0)} kg</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('order.quantity')}</label>
            <input
              type="number"
              min="1"
              max={listing.quantity_kg}
              value={qty}
              onChange={e => setQty(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-600"
              placeholder={t('order.qty_hint')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('order.message')}</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-600 resize-none"
              placeholder={t('order.msg_hint')}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ backgroundColor: '#f97316' }}
          >
            {submitting ? t('order.sending') : t('order.send')} 🛒
          </button>
        </form>
      </div>
    </div>
  );
}
