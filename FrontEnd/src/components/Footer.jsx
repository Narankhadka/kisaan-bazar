import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const BG         = '#0f1f0f';   // very dark green — matches project theme
const BG_BOTTOM  = '#0a150a';   // slightly darker for bottom bar
const ACCENT     = '#60bb46';   // bright green — headings + hover
const LINK_COLOR = '#d1fae5';   // light green — link text
const MUTED      = '#6b7280';   // gray — secondary text / icons
const BORDER     = '#1a3a1a';   // subtle dark-green divider

// ── SVG Icons ──────────────────────────────────────────────────────────────
function WheatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
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
function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0 mt-0.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0 mt-0.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0 mt-0.5">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.55 5.55l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

// ── FooterLink ─────────────────────────────────────────────────────────────
function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm transition-colors duration-200"
      style={{ color: LINK_COLOR }}
      onMouseEnter={e => { e.currentTarget.style.color = ACCENT; }}
      onMouseLeave={e => { e.currentTarget.style.color = LINK_COLOR; }}
    >
      {children}
    </Link>
  );
}

// ── SocialBtn — no background, icon-only ──────────────────────────────────
function SocialBtn({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="transition-colors duration-200"
      style={{ color: MUTED }}
      onMouseEnter={e => { e.currentTarget.style.color = ACCENT; }}
      onMouseLeave={e => { e.currentTarget.style.color = MUTED; }}
    >
      {icon}
    </a>
  );
}

export default function Footer() {
  const { t, lang, setLang } = useLanguage();

  return (
    <footer style={{ backgroundColor: BG, borderTop: `3px solid ${ACCENT}` }}>

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Col 1 — Brand */}
          <div className="flex flex-col gap-4 items-start sm:items-start">
            <Link to="/" className="flex items-center gap-2">
              <span style={{ color: ACCENT }}><WheatIcon /></span>
              <span className="text-xl font-bold text-white tracking-wide">{t('app.name')}</span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: LINK_COLOR }}>
              {t('footer.tagline')}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
              {t('app.subtitle')}
            </p>
            {/* Social icons — no backgrounds, clean */}
            <div className="flex items-center gap-4 mt-1">
              <SocialBtn href="https://facebook.com"  icon={<FacebookIcon />}  label="Facebook" />
              <SocialBtn href="https://twitter.com"   icon={<TwitterIcon />}   label="Twitter/X" />
              <SocialBtn href="https://instagram.com" icon={<InstagramIcon />} label="Instagram" />
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>
              {t('footer.quick_links')}
            </h3>
            <div className="flex flex-col space-y-3">
              <FooterLink to="/">{t('nav.home')}</FooterLink>
              <FooterLink to="/prices">{t('nav.prices')}</FooterLink>
              <FooterLink to="/listings">{t('nav.listings')}</FooterLink>
              <FooterLink to="/register">{t('login.tab_register')}</FooterLink>
              <FooterLink to="/login">{t('nav.login')}</FooterLink>
            </div>
          </div>

          {/* Col 3 — Information */}
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>
              {t('footer.information')}
            </h3>
            <div className="flex flex-col space-y-3">
              <FooterLink to="/about">{t('footer.about_link')}</FooterLink>
              <FooterLink to="/contact">{t('footer.contact_link')}</FooterLink>
              <FooterLink to="/privacy">{t('footer.privacy')}</FooterLink>
              <FooterLink to="/terms">{t('footer.terms')}</FooterLink>
            </div>
          </div>

          {/* Col 4 — Contact Info */}
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>
              {t('footer.contact_info')}
            </h3>
            <div className="flex flex-col space-y-3">
              <div className="flex items-start gap-2 text-sm" style={{ color: MUTED }}>
                <MapPinIcon /><span>{t('footer.location_val')}</span>
              </div>
              <a
                href="mailto:info@kisaanbazar.com"
                className="flex items-start gap-2 text-sm transition-colors duration-200"
                style={{ color: MUTED }}
                onMouseEnter={e => { e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.color = MUTED; }}
              >
                <MailIcon /><span>{t('footer.email_val')}</span>
              </a>
              <a
                href="tel:+97701XXXXXXX"
                className="flex items-start gap-2 text-sm transition-colors duration-200"
                style={{ color: MUTED }}
                onMouseEnter={e => { e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.color = MUTED; }}
              >
                <PhoneIcon /><span>{t('footer.phone_val')}</span>
              </a>
              <div className="flex items-start gap-2 text-sm" style={{ color: MUTED }}>
                <ClockIcon /><span>{t('footer.hours_val')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}` }} />

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <div style={{ backgroundColor: BG_BOTTOM }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Left — copyright */}
          <span className="text-xs order-2 sm:order-1" style={{ color: MUTED }}>
            {t('footer.copyright')}
          </span>

          {/* Center — tagline */}
          <span className="text-xs order-1 sm:order-2" style={{ color: MUTED }}>
            {t('footer.made_with')}
          </span>

          {/* Right — language toggle */}
          <div
            className="flex items-center gap-1 text-xs rounded-full px-3 py-1.5 order-3"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <button
              type="button"
              onClick={() => setLang('ne')}
              className="transition-colors duration-200 cursor-pointer px-1"
              style={{ color: lang === 'ne' ? ACCENT : MUTED, fontWeight: lang === 'ne' ? 700 : 400 }}
            >
              नेपाली
            </button>
            <span style={{ color: BORDER }}>|</span>
            <button
              type="button"
              onClick={() => setLang('en')}
              className="transition-colors duration-200 cursor-pointer px-1"
              style={{ color: lang === 'en' ? ACCENT : MUTED, fontWeight: lang === 'en' ? 700 : 400 }}
            >
              EN
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
}
