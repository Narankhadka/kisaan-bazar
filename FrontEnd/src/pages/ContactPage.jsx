import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const GREEN  = '#1a6b2e';
const ORANGE = '#f97316';
const INPUT  = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 bg-white transition-colors';

// ── Web3Forms access key — replace with your key from web3forms.com ────────
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY ?? '7e99dc42-ded1-421d-8e7f-d6cd07cb8cb3';

// ── SVG Icons ──────────────────────────────────────────────────────────────
function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.55 5.55l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" className="w-5 h-5">
      <path d="M4 4l16 16M4 20 20 4"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

// ── Info Card ──────────────────────────────────────────────────────────────
function InfoCard({ icon, title, children, accent = GREEN }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accent}15`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</div>
        <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true); setError(''); setSuccess(false);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(t('contact.error'));
      }
    } catch {
      setError(t('contact.error'));
    } finally {
      setSending(false);
    }
  };

  const subjects = [
    { value: 'price',   label: t('contact.subject_price') },
    { value: 'tech',    label: t('contact.subject_tech') },
    { value: 'farmer',  label: t('contact.subject_farmer') },
    { value: 'payment', label: t('contact.subject_payment') },
    { value: 'other',   label: t('contact.subject_other') },
  ];

  return (
    <div className="pb-24 md:pb-10">
      {/* Page header */}
      <div
        className="text-white py-12 px-4"
        style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #2d8a4a 100%)` }}
      >
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{t('contact.title')}</h1>
          <p className="text-green-100 text-sm">{t('contact.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Left: Contact Form ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">{t('contact.title')}</h2>

            {success && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5 text-sm font-medium"
                style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: GREEN }}
              >
                <CheckCircleIcon />
                <span>{t('contact.success')}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.name')}</label>
                <input
                  required
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder={t('contact.name_hint')}
                  className={INPUT}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.email')}</label>
                <input
                  required type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder={t('contact.email_hint')}
                  className={INPUT}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.subject')}</label>
                <select
                  required
                  value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                  className={INPUT}
                >
                  <option value="">{t('contact.subject_select')}</option>
                  {subjects.map(s => (
                    <option key={s.value} value={s.label}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.message')}</label>
                <textarea
                  required rows={5}
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  placeholder={t('contact.message_hint')}
                  className={INPUT + ' resize-none'}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: GREEN }}
              >
                {sending ? t('contact.sending') : t('contact.send_btn')}
              </button>
            </form>
          </div>

          {/* ── Right: Info Cards ───────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <InfoCard icon={<MapPinIcon />} title={t('contact.location_title')} accent={GREEN}>
              {t('footer.location_val')}
            </InfoCard>

            <InfoCard icon={<MailIcon />} title={t('contact.email_title')} accent="#2563eb">
              <a
                href="mailto:info@kisaanbazar.com"
                className="hover:underline"
                style={{ color: '#2563eb' }}
              >
                {t('footer.email_val')}
              </a>
            </InfoCard>

            <InfoCard icon={<PhoneIcon />} title={t('contact.phone_title')} accent={ORANGE}>
              <a href="tel:+97701XXXXXXX" className="hover:underline" style={{ color: ORANGE }}>
                {t('footer.phone_val')}
              </a>
            </InfoCard>

            <InfoCard icon={<ClockIcon />} title={t('contact.hours_title')} accent="#7c3aed">
              {t('footer.hours_val')}
            </InfoCard>

            {/* Social */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {t('contact.social_title')}
              </div>
              <div className="flex items-center gap-3">
                {[
                  { href: 'https://facebook.com', icon: <FacebookIcon />, label: 'Facebook', color: '#1877f2' },
                  { href: 'https://instagram.com', icon: <InstagramIcon />, label: 'Instagram', color: '#e1306c' },
                  { href: 'https://twitter.com', icon: <TwitterIcon />, label: 'Twitter/X', color: '#000000' },
                ].map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity hover:opacity-80"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
