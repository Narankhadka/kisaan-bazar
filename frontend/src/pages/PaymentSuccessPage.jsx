import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import Spinner from '../components/Spinner';

const GREEN = '#1a6b2e';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

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

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [verifying, setVerifying] = useState(true);
  const [result,    setResult]    = useState(null);  // { status, order_id, ref_id, amount_paid, crop_name, farmer_name }
  const [error,     setError]     = useState('');

  useEffect(() => {
    const data = searchParams.get('data');
    if (!data) {
      setError(t('pay.no_data'));
      setVerifying(false);
      return;
    }

    api.post('/orders/verify-payment/', { data })
      .then(({ data: res }) => setResult(res))
      .catch(err => {
        const msg = err.response?.data?.detail;
        setError(msg || t('pay.verify_failed'));
      })
      .finally(() => setVerifying(false));
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <Spinner />
        <p className="text-gray-500 text-sm">{t('pay.verifying')}</p>
      </div>
    );
  }

  const success = result?.status === 'PAID';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 w-full max-w-sm text-center">

        {/* Icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: success ? GREEN : '#dc2626' }}
        >
          {success ? <CheckIcon /> : <XIcon />}
        </div>

        {success ? (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('pay.success_title')}</h1>
            <p className="text-gray-500 text-sm mb-6">{t('pay.success_msg')}</p>

            <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6 space-y-2">
              {result.crop_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('pay.crop')}</span>
                  <span className="font-medium text-gray-800">{result.crop_name}</span>
                </div>
              )}
              {result.farmer_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('pay.farmer')}</span>
                  <span className="font-medium text-gray-800">{result.farmer_name}</span>
                </div>
              )}
              {result.amount_paid && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('pay.amount')}</span>
                  <span className="font-bold" style={{ color: GREEN }}>{t('currency')}{result.amount_paid}</span>
                </div>
              )}
              {result.ref_id && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('pay.ref_id')}</span>
                  <span className="font-medium text-gray-700 text-xs">{result.ref_id}</span>
                </div>
              )}
            </div>

            <Link
              to="/buyer-dashboard"
              className="block w-full py-3 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: GREEN }}
            >
              {t('pay.go_dashboard')}
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('pay.failed_title')}</h1>
            <p className="text-gray-500 text-sm mb-6">{error || t('pay.failed_msg')}</p>
            <Link
              to="/buyer-dashboard"
              className="block w-full py-3 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#dc2626' }}
            >
              {t('pay.go_dashboard')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
