import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6A16 16 0 0 0 15.4 16.1l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

// ── OTP input boxes ──────────────────────────────────────────────────────────

function OTPInput({ digits, onChange, shake, disabled }) {
  const refs = useRef([]);

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits];
        next[i] = '';
        onChange(next);
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        const next = [...digits];
        next[i - 1] = '';
        onChange(next);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const next = [...digits];
    next[i] = val[val.length - 1];
    onChange(next);
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
    onChange(next);
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
  };

  const borderColor = (i) => {
    if (shake) return '#dc2626';
    if (digits[i]) return '#1a6b2e';
    return '#d1d5db';
  };

  return (
    <div
      className={`flex gap-2 justify-center ${shake ? 'otp-shake' : ''}`}
      onPaste={handlePaste}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          style={{
            width: 48, height: 48,
            border: `2px solid ${borderColor(i)}`,
            borderRadius: 12,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 700,
            color: '#1a6b2e',
            outline: 'none',
            background: disabled ? '#f9fafb' : 'white',
            boxShadow: d ? '0 0 0 3px #bbf7d0' : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#1a6b2e'; e.target.style.boxShadow = '0 0 0 3px #bbf7d0'; }}
          onBlur={(e) => {
            if (!d) { e.target.style.borderColor = shake ? '#dc2626' : '#d1d5db'; e.target.style.boxShadow = 'none'; }
          }}
        />
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const OTP_EXPIRY_SECS   = 600;  // 10 minutes
const RESEND_COOLDOWN   = 60;   // seconds before resend is available

export default function VerifyPhonePage() {
  const { user, clearPhoneWarning } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [digits, setDigits]       = useState(Array(6).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [shake, setShake]         = useState(false);
  const [devMode, setDevMode]     = useState(false);

  // Countdown timer (seconds remaining until OTP expires)
  const [timerSecs, setTimerSecs]     = useState(OTP_EXPIRY_SECS);
  const [resendSecs, setResendSecs]   = useState(RESEND_COOLDOWN);
  const timerRef  = useRef(null);
  const resendRef = useRef(null);

  // Redirect if already verified
  useEffect(() => {
    if (user?.is_phone_verified) {
      navigateToDashboard();
    }
  }, [user]);

  const navigateToDashboard = () => {
    if (user?.role === 'FARMER') navigate('/dashboard', { replace: true });
    else if (user?.role === 'BUYER') navigate('/buyer-dashboard', { replace: true });
    else navigate('/', { replace: true });
  };

  // Send OTP on mount and restart timers
  const sendOTP = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.post('/auth/send-otp/');
      setDevMode(!!data.dev_mode);
      // Reset timers
      setTimerSecs(OTP_EXPIRY_SECS);
      setResendSecs(RESEND_COOLDOWN);
    } catch (err) {
      const msg = err?.response?.data?.error || '';
      if (msg.includes('धेरै') || err?.response?.status === 429) {
        setError(t('otp.err_rate_limit'));
      } else {
        setError(t('otp.err_generic'));
      }
    }
  }, [t]);

  useEffect(() => {
    sendOTP();
  }, []);

  // OTP expiry countdown
  useEffect(() => {
    clearInterval(timerRef.current);
    if (timerSecs <= 0 || success) return;
    timerRef.current = setInterval(() => {
      setTimerSecs(s => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerSecs, success]);

  // Resend cooldown countdown
  useEffect(() => {
    clearInterval(resendRef.current);
    if (resendSecs <= 0 || success) return;
    resendRef.current = setInterval(() => {
      setResendSecs(s => {
        if (s <= 1) { clearInterval(resendRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(resendRef.current);
  }, [resendSecs, success]);

  const fmtTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleVerify = async (overrideDigits) => {
    const otp = (overrideDigits || digits).join('');
    if (otp.length < 6) return;

    setVerifying(true);
    setError('');
    try {
      await api.post('/auth/verify-otp/', { otp });
      setSuccess(true);
      clearPhoneWarning();
      setTimeout(() => navigateToDashboard(), 2000);
    } catch (err) {
      const msg = err?.response?.data?.error || '';
      if (msg.includes('म्याद')) {
        setError(t('otp.err_expired'));
      } else if (msg.includes('गलत')) {
        setError(t('otp.err_wrong'));
      } else {
        setError(t('otp.err_generic'));
      }
      triggerShake();
      setDigits(Array(6).fill(''));
    } finally {
      setVerifying(false);
    }
  };

  // Auto-submit when all 6 digits are filled
  const handleDigitsChange = (next) => {
    setDigits(next);
    setError('');
    if (next.every(d => d !== '')) {
      handleVerify(next);
    }
  };

  const handleResend = async () => {
    if (resendSecs > 0) return;
    setDigits(Array(6).fill(''));
    setError('');
    await sendOTP();
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-3xl shadow-sm p-10 max-w-sm w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#1a6b2e' }}
          >
            <CheckIcon />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{t('otp.success')}</h2>
          <p className="text-sm text-gray-500 mt-2">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const allFilled = digits.every(d => d !== '');
  const otpExpired = timerSecs === 0;

  return (
    <>
      <style>{`
        @keyframes otp-shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-6px); }
          30%      { transform: translateX(6px); }
          45%      { transform: translateX(-4px); }
          60%      { transform: translateX(4px); }
          75%      { transform: translateX(-2px); }
          90%      { transform: translateX(2px); }
        }
        .otp-shake { animation: otp-shake 0.6s ease-in-out; }
      `}</style>

      <div className="min-h-screen flex flex-col md:flex-row">

        {/* Left panel */}
        <div
          className="relative px-4 pt-10 pb-8 text-white text-center md:flex md:flex-col md:items-center md:justify-center md:flex-1 md:pt-0 md:pb-0"
          style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
        >
          <div className="flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/20 mb-3 md:mb-5 mx-auto">
            <PhoneIcon />
          </div>
          <h1 className="text-xl md:text-3xl font-bold">{t('otp.title')}</h1>
          <p className="text-green-200 text-sm mt-2 md:mt-3 md:max-w-xs">
            {t('otp.subtitle').replace('{phone}', user?.phone || '98XXXXXXXX')}
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 px-4 -mt-4 md:mt-0 md:flex md:items-center md:justify-center md:bg-gray-50 md:px-12">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden md:w-full md:max-w-md">
            <div className="py-4 px-5 border-b border-gray-100 text-center">
              <h2 className="text-sm font-bold" style={{ color: '#1a6b2e' }}>
                {t('otp.title')}
              </h2>
            </div>

            <div className="p-6 flex flex-col gap-5">

              {/* Dev mode notice */}
              {devMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 text-xs text-yellow-700">
                  {t('otp.dev_notice')}
                </div>
              )}

              {/* 24-hour warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-xs text-orange-700">
                {t('otp.warning_24h')}
              </div>

              {/* OTP boxes */}
              <OTPInput
                digits={digits}
                onChange={handleDigitsChange}
                shake={shake}
                disabled={verifying || otpExpired}
              />

              {/* Error */}
              {error && (
                <p className="text-center text-sm text-red-600 font-medium">{error}</p>
              )}

              {/* Timer */}
              <div className="text-center text-sm">
                {otpExpired ? (
                  <span className="font-medium text-red-600">{t('otp.expired')}</span>
                ) : (
                  <span style={{ color: timerSecs < 120 ? '#dc2626' : '#6b7280' }}>
                    {t('otp.timer_label')} <span className="font-bold font-mono">{fmtTime(timerSecs)}</span>
                  </span>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={() => handleVerify()}
                disabled={!allFilled || verifying || otpExpired}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: '#1a6b2e', minHeight: 48 }}
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    {t('otp.verifying')}
                  </span>
                ) : t('otp.submit')}
              </button>

              {/* Resend button */}
              <div className="text-center">
                {resendSecs > 0 ? (
                  <p className="text-xs text-gray-400">
                    {t('otp.resend_wait').replace('{s}', resendSecs)}
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-sm font-medium underline cursor-pointer"
                    style={{ color: '#f97316' }}
                  >
                    {t('otp.resend')}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        <div className="h-8 md:hidden" />
      </div>
    </>
  );
}
