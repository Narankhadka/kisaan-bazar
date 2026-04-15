import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OrderModal({ listing, onClose }) {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [qty, setQty] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (listing) setTimeout(() => setVisible(true), 10);
  }, [listing]);

  if (!listing) return null;

  const cropName = lang === 'en'
    ? (listing.crop?.name_english || listing.crop?.name_nepali)
    : listing.crop?.name_nepali;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(false), 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/orders/', {
        listing: listing.id,
        quantity_kg: qty,
        message,
      });
      setVisible(false);
      setTimeout(() => onClose(true), 200);
    } catch (err) {
      setError(err.response?.data?.detail || t('order.err'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 transition-all duration-200"
      style={{ backgroundColor: visible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl transition-all duration-200"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)', opacity: visible ? 1 : 0 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg" style={{ color: '#1a6b2e' }}>
            {cropName} — {t('order.label')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 text-2xl leading-none hover:text-gray-600 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            &times;
          </button>
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
              autoFocus
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
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer flex items-center justify-center gap-2"
            style={{ backgroundColor: '#f97316', minHeight: '48px' }}
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {t('order.sending')}
              </>
            ) : (
              <>{t('order.send')}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
