import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const GREEN  = '#1a6b2e';
const ORANGE = '#f97316';

// ── SVG Icons ──────────────────────────────────────────────────────────────
function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function HandshakeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
    </svg>
  );
}
function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/>
      <line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

// ── Step card ──────────────────────────────────────────────────────────────
function StepCard({ number, icon, title, desc, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center gap-3 relative">
      <div
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor: accent }}
      >
        {number}
      </div>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mt-2"
        style={{ backgroundColor: `${accent}15`, color: accent }}
      >
        {icon}
      </div>
      <h3 className="font-bold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ number, label, accent = GREEN }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}30` }}
    >
      <div className="text-4xl font-bold mb-1" style={{ color: accent }}>{number}</div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );
}

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="pb-24 md:pb-10">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div
        className="text-white py-16 px-4"
        style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #2d8a4a 60%, #1a6b2e 100%)` }}
      >
        <div className="max-w-screen-xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">{t('about.hero_title')}</h1>
          <p className="text-green-100 text-lg max-w-xl mx-auto leading-relaxed">
            {t('about.hero_subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-14">

        {/* ── Mission ─────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row items-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${GREEN}15`, color: GREEN }}
          >
            <TargetIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('about.mission_title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('about.mission_desc')}</p>
          </div>
        </section>

        {/* ── Problem → Solution ──────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">{t('about.problem_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Before */}
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <div className="text-sm font-bold text-red-600 uppercase tracking-wide mb-4">
                {t('about.problem_before')}
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                {[
                  { from: 'किसान', to: 'बिचौलिया १', price: 'रु.१५/kg' },
                  { from: 'बिचौलिया १', to: 'बिचौलिया २', price: 'रु.३०/kg' },
                  { from: 'बिचौलिया २', to: 'बिचौलिया ३', price: 'रु.४५/kg' },
                  { from: 'बिचौलिया ३', to: 'खरिदकर्ता', price: 'रु.६०/kg' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-medium text-gray-600 w-28 text-right">{row.from}</span>
                    <ArrowRightIcon />
                    <span className="text-gray-600">{row.to}</span>
                    <span className="ml-auto font-bold text-red-600">{row.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <div className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4">
                {t('about.problem_after')}
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">किसान</span>
                  <ArrowRightIcon />
                  <span className="text-green-700 font-medium">किसान बजार</span>
                  <ArrowRightIcon />
                  <span className="text-gray-600">खरिदकर्ता</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 text-center border border-green-200">
                    <div className="text-green-700 font-bold text-lg">रु.३५/kg</div>
                    <div className="text-xs text-gray-500 mt-0.5">किसानलाई मिल्छ</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-green-200">
                    <div className="text-green-700 font-bold text-lg">रु.४०/kg</div>
                    <div className="text-xs text-gray-500 mt-0.5">खरिदकर्ताले तिर्छ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-8 text-center">{t('about.how_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <StepCard
              number="1"
              icon={<ListIcon />}
              title={t('about.step1_title')}
              desc={t('about.step1_desc')}
              accent={GREEN}
            />
            <StepCard
              number="2"
              icon={<UsersIcon />}
              title={t('about.step2_title')}
              desc={t('about.step2_desc')}
              accent={ORANGE}
            />
            <StepCard
              number="3"
              icon={<HandshakeIcon />}
              title={t('about.step3_title')}
              desc={t('about.step3_desc')}
              accent="#2563eb"
            />
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">{t('about.stats_title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard number="120+" label={t('about.stat_veg')}      accent={GREEN} />
            <StatCard number="850+" label={t('about.stat_farmers')}  accent={ORANGE} />
            <StatCard number="77"   label={t('about.stat_districts')} accent="#2563eb" />
            <StatCard number="365"  label={t('about.stat_daily')}     accent="#7c3aed" />
          </div>
        </section>

        {/* ── Technology ──────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row items-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#7c3aed15', color: '#7c3aed' }}
          >
            <ServerIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('about.tech_title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('about.tech_desc')}</p>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="text-center">
          <Link
            to="/contact"
            className="inline-block px-8 py-3.5 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: GREEN }}
          >
            {t('about.contact_cta')} →
          </Link>
        </section>

      </div>
    </div>
  );
}
