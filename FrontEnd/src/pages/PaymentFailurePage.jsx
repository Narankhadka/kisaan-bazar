import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
}

export default function PaymentFailurePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 w-full max-w-sm text-center">

        {/* Icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: '#dc2626' }}
        >
          <XIcon />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('pay.cancelled_title')}</h1>
        <p className="text-gray-500 text-sm mb-8">{t('pay.cancelled_msg')}</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#f97316' }}
          >
            {t('pay.retry_btn')}
          </button>
          <Link
            to="/buyer-dashboard"
            className="block w-full py-3 rounded-2xl border-2 border-gray-300 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            {t('pay.go_dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
